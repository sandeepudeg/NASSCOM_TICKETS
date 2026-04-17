import pytest


@pytest.fixture
def mock_db_session():
    from unittest.mock import AsyncMock

    session = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session
