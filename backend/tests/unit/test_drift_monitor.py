"""
Unit tests for category distribution drift monitoring.

Requirements: 15.4
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from src.services.drift_monitor import DRIFT_THRESHOLD, DriftMonitor

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture
def mock_session():
    """Mock AsyncSession with mixed sync/async methods."""
    # We use MagicMock so add() isn't async, but we'll mock async methods explicitly
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    return session



async def test_get_production_distribution_empty(mock_session):
    """Test production distribution with no tickets."""
    mock_session.execute = AsyncMock(return_value=AsyncMock(fetchall=lambda: []))

    monitor = DriftMonitor(mock_session)
    dist = await monitor.get_production_distribution(window_hours=24)

    assert dist == {}



async def test_get_production_distribution_calculates_proportions(mock_session):
    """Test production distribution calculation."""
    # Mock 10 tickets: 5 Infrastructure, 3 Application, 2 Security
    mock_result = AsyncMock()
    mock_result.fetchall = lambda: [
        ("Infrastructure",),
        ("Infrastructure",),
        ("Infrastructure",),
        ("Infrastructure",),
        ("Infrastructure",),
        ("Application",),
        ("Application",),
        ("Application",),
        ("Security",),
        ("Security",),
    ]
    mock_session.execute = AsyncMock(return_value=mock_result)

    monitor = DriftMonitor(mock_session)
    dist = await monitor.get_production_distribution(window_hours=24)

    assert dist["Infrastructure"] == 0.5
    assert dist["Application"] == 0.3
    assert dist["Security"] == 0.2



async def test_check_drift_no_drift(mock_session):
    """Test drift check when distribution is within threshold."""
    training_dist = {
        "Infrastructure": 0.20,
        "Application": 0.20,
        "Security": 0.20,
        "Database": 0.20,
        "Storage": 0.20,
    }

    # Production distribution is very close to training
    mock_result = AsyncMock()
    mock_result.fetchall = lambda: [
        ("Infrastructure",),
        ("Application",),
        ("Security",),
        ("Database",),
        ("Storage",),
    ]
    mock_session.execute = AsyncMock(return_value=mock_result)

    monitor = DriftMonitor(mock_session)
    has_drift, details = await monitor.check_drift(training_dist, window_hours=24)

    assert has_drift is False
    assert details == []



async def test_check_drift_detects_drift(mock_session):
    """Test drift detection when category deviates beyond threshold."""
    training_dist = {
        "Infrastructure": 0.20,
        "Application": 0.20,
        "Security": 0.20,
        "Database": 0.20,
        "Storage": 0.20,
    }

    # Production: 70% Infrastructure, 10% each for others (50% deviation)
    mock_result = AsyncMock()
    mock_result.fetchall = lambda: (
        [("Infrastructure",)] * 7
        + [("Application",)]
        + [("Security",)]
        + [("Database",)]
    )
    mock_session.execute = AsyncMock(return_value=mock_result)

    monitor = DriftMonitor(mock_session)
    has_drift, details = await monitor.check_drift(training_dist, window_hours=24)

    assert has_drift is True
    assert len(details) > 0

    # Check Infrastructure drift detail
    infra_detail = next(d for d in details if d["category"] == "Infrastructure")
    assert infra_detail["training_proportion"] == 0.20
    assert infra_detail["production_proportion"] == 0.70
    assert infra_detail["deviation"] == 0.50
    assert infra_detail["threshold"] == DRIFT_THRESHOLD



async def test_check_drift_multiple_categories(mock_session):
    """Test drift detection with multiple drifting categories."""
    training_dist = {
        "Infrastructure": 0.25,
        "Application": 0.25,
        "Security": 0.25,
        "Database": 0.25,
    }

    # Production: 60% Infrastructure, 30% Application, 5% each for others
    mock_result = AsyncMock()
    mock_result.fetchall = lambda: (
        [("Infrastructure",)] * 12
        + [("Application",)] * 6
        + [("Security",)]
        + [("Database",)]
    )
    mock_session.execute = AsyncMock(return_value=mock_result)

    monitor = DriftMonitor(mock_session)
    has_drift, details = await monitor.check_drift(training_dist, window_hours=24)

    assert has_drift is True

    # Infrastructure should be flagged (0.60 - 0.25 = 0.35 > 0.20)
    drifted_categories = {d["category"] for d in details}
    assert "Infrastructure" in drifted_categories
    # Security has exactly 0.20 deviation (0.25 - 0.05 = 0.20), which is at threshold
    # but not exceeding it, so it may or may not be flagged depending on > vs >=



async def test_log_drift_event(mock_session):
    """Test drift event logging to audit log."""
    drift_details = [
        {
            "category": "Infrastructure",
            "training_proportion": 0.20,
            "production_proportion": 0.50,
            "deviation": 0.30,
            "threshold": 0.20,
        }
    ]

    monitor = DriftMonitor(mock_session)
    await monitor.log_drift_event(drift_details)

    # Verify audit log entry was added
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()



async def test_send_drift_alert_success(mock_session):
    """Test successful drift alert webhook delivery."""
    drift_details = [
        {
            "category": "Infrastructure",
            "training_proportion": 0.20,
            "production_proportion": 0.50,
            "deviation": 0.30,
            "threshold": 0.20,
        }
    ]

    with patch("src.services.drift_monitor.settings") as mock_settings:
        mock_settings.observability_webhook_url = "http://localhost:9000/webhook"

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )

            monitor = DriftMonitor(mock_session)
            await monitor.send_drift_alert(drift_details)

            # Verify webhook was called
            mock_client.return_value.__aenter__.return_value.post.assert_called_once()



async def test_send_drift_alert_no_webhook_configured(mock_session, capsys):
    """Test drift alert when no webhook URL is configured."""
    drift_details = [{"category": "Infrastructure"}]

    with patch("src.services.drift_monitor.settings") as mock_settings:
        mock_settings.observability_webhook_url = None

        monitor = DriftMonitor(mock_session)
        await monitor.send_drift_alert(drift_details)

        captured = capsys.readouterr()
        assert "No observability webhook URL configured" in captured.out



async def test_monitor_and_alert_triggers_alert(mock_session):
    """Test full monitor_and_alert workflow when drift is detected."""
    training_dist = {"Infrastructure": 0.20, "Application": 0.80}

    # Production: 60% Infrastructure, 40% Application (40% deviation)
    mock_result = AsyncMock()
    mock_result.fetchall = lambda: ([("Infrastructure",)] * 6 + [("Application",)] * 4)
    mock_session.execute = AsyncMock(return_value=mock_result)

    with patch("src.services.drift_monitor.settings") as mock_settings:
        mock_settings.observability_webhook_url = "http://localhost:9000/webhook"

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )

            monitor = DriftMonitor(mock_session)
            await monitor.monitor_and_alert(training_dist, window_hours=24)

            # Verify audit log and webhook were called
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
            mock_client.return_value.__aenter__.return_value.post.assert_called_once()
