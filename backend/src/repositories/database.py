import re
import ssl as _ssl
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from urllib.parse import urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.repositories.models import Base
from src.schemas.settings import settings

is_sqlite = settings.database_url.startswith("sqlite")

# Normalize the DB URL to always use the async asyncpg driver.
# Neon provides URLs like: postgres://user:pass@host/db?sslmode=require&channel_binding=require
# asyncpg does NOT support URL query params like sslmode/channel_binding —
# SSL must be passed via connect_args using a Python ssl.SSLContext.
_raw_url = settings.database_url

# 1. Upgrade scheme to asyncpg (handles postgres://, postgresql://, postgresql+asyncpg://)
_parsed = urlparse(_raw_url)
if _parsed.scheme in ("postgres", "postgresql"):
    _parsed = _parsed._replace(scheme="postgresql+asyncpg")
elif _parsed.scheme == "postgresql+asyncpg":
    pass  # already correct

# 2. Detect SSL from the query string BEFORE stripping it
_needs_ssl = (
    "sslmode=require" in _raw_url
    or "ssl=require" in _raw_url
    or "channel_binding" in _raw_url
    or ".neon.tech" in _raw_url
)

# 3. Strip ALL query params — asyncpg doesn't understand them
_parsed = _parsed._replace(query="")
_async_url = urlunparse(_parsed)

# 4. Build connect_args with SSL context if needed
_connect_args: dict = {}
if not is_sqlite and _needs_ssl:
    _ssl_ctx = _ssl.create_default_context()
    _connect_args["ssl"] = _ssl_ctx

if is_sqlite:
    engine = create_async_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        echo=settings.debug,
    )
else:
    # asyncpg-specific connection arguments
    # command_timeout: timeout for individual queries
    # timeout: timeout for establishing a connection
    _connect_args.update({
        "command_timeout": 60,
        "timeout": 60,  # Increased from 30 to handle cold starts
        "statement_timeout": 60000, # 60s in ms
    })
    
    engine = create_async_engine(
        _async_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args=_connect_args,
        echo=settings.debug,
        pool_recycle=1800, # Reduced to 30m to stay fresh with serverless
        pool_pre_ping=True, # Verify connection is alive before use
        pool_use_lifo=True, # Improved performance for serverless pools
    )

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db() -> None:
    import logging
    import asyncio
    _log = logging.getLogger(__name__)

    # Retry logic for initial connection - helpful for slow startup or serverless wake-up
    max_retries = 10 # Increased from 5
    retry_delay = 10 # Increased from 5
    
    for attempt in range(1, max_retries + 1):
        try:
            _log.info(f"Database initialization attempt {attempt}/{max_retries}...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                if is_sqlite:
                    from sqlalchemy import text
                    await conn.execute(text("PRAGMA journal_mode=WAL"))
            _log.info("Database initialization successful.")
            break
        except Exception as e:
            if attempt == max_retries:
                _log.error(f"init_db failed after {max_retries} attempts: {e}")
                # We don't raise here to allow the app to start even if DB is transiently down,
                # though most features will fail.
            else:
                _log.warning(f"init_db attempt {attempt} failed, retrying in {retry_delay}s: {e}")
                await asyncio.sleep(retry_delay)

    # Seed departmental folders — best-effort, never crash startup
    try:
        await seed_department_folders()
    except Exception as e:
        _log.warning(f"init_db: seed_department_folders skipped: {e}")


async def seed_department_folders() -> None:
    """Ensure all 7 departmental folders exist for the 'admin' user."""
    from sqlalchemy import select

    from src.repositories.models import Folder

    admin_id = "admin"
    categories = [
        "Infrastructure",
        "Application",
        "Security",
        "Database",
        "Storage",
        "Network",
        "Access Management",
    ]

    async with async_session_maker() as session:
        try:
            for cat in categories:
                folder_name = f"{cat} Department"
                # Check if folder exists
                stmt = select(Folder).where(
                    Folder.name == folder_name, Folder.owner_id == admin_id
                )
                result = await session.execute(stmt)
                if not result.scalar_one_or_none():
                    # Create folder
                    new_folder = Folder(name=folder_name, owner_id=admin_id)
                    session.add(new_folder)

            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    await engine.dispose()
