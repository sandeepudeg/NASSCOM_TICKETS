from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.repositories.models import Base
from src.schemas.settings import settings

is_sqlite = settings.database_url.startswith("sqlite")

# Normalize the DB URL to always use the correct async driver.
# HuggingFace Secrets often store DATABASE_URL as plain `postgresql://` or `postgres://`
# which loads psycopg2 (sync) and crashes create_async_engine.
_raw_url = settings.database_url
_async_url = (
    _raw_url
    .replace("postgres://", "postgresql+asyncpg://")
    .replace("postgresql://", "postgresql+asyncpg://")
)
# Avoid double-replacing if it already has the right scheme
if "postgresql+asyncpg+asyncpg" in _async_url:
    _async_url = _async_url.replace("postgresql+asyncpg+asyncpg", "postgresql+asyncpg")

if is_sqlite:
    engine = create_async_engine(
        settings.database_url.replace("sqlite+aiosqlite", "sqlite+aiosqlite"),
        connect_args={"check_same_thread": False},
        echo=settings.debug,
    )
else:
    engine = create_async_engine(
        _async_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
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
