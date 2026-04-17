import re
import ssl as _ssl
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.repositories.models import Base
from src.schemas.settings import settings

is_sqlite = settings.database_url.startswith("sqlite")

# Normalize the DB URL to always use the async asyncpg driver.
# Neon / HuggingFace Secrets often provide URLs like:
#   postgres://user:pass@host/db?sslmode=require
# asyncpg does NOT support `sslmode` as a query param — it uses a Python
# ssl.SSLContext passed via connect_args instead.
_raw_url = settings.database_url

# 1. Upgrade scheme to asyncpg
_async_url = _raw_url
for old, new in [
    ("postgresql+asyncpg://", "postgresql+asyncpg://"),  # already correct, no-op
    ("postgresql://", "postgresql+asyncpg://"),
    ("postgres://", "postgresql+asyncpg://"),
]:
    if _async_url.startswith(old.split("+")[0] + "://") and "asyncpg" not in _async_url:
        _async_url = _async_url.replace(old.split("+")[0] + "://", "postgresql+asyncpg://", 1)
        break

# Fix double-replace edge case
_async_url = re.sub(r"postgresql\+asyncpg\+asyncpg", "postgresql+asyncpg", _async_url)

# 2. Detect SSL requirement before stripping sslmode from URL
_needs_ssl = "sslmode=require" in _raw_url or "ssl=require" in _raw_url or ".neon.tech" in _raw_url

# 3. Strip sslmode/ssl query params — asyncpg rejects them as kwargs
_async_url = re.sub(r"[?&]sslmode=[^&]*", "", _async_url)
_async_url = re.sub(r"[?&]ssl=[^&]*", "", _async_url)
# Clean up trailing ? if all params were removed
_async_url = _async_url.rstrip("?")

# 4. Build connect_args
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
    engine = create_async_engine(
        _async_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args=_connect_args,
        echo=settings.debug,
    )

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if is_sqlite:
            from sqlalchemy import text

            await conn.execute(text("PRAGMA journal_mode=WAL"))

        # Seeding logic: Ensure departmental folders exist for 'admin'
        await seed_department_folders()


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
