import pytest
import nest_asyncio

nest_asyncio.apply()





@pytest.fixture
def mock_db_session():
    from unittest.mock import AsyncMock

    session = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session
