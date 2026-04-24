import asyncio
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.repositories.models import Base, AutomationRunbook
from src.schemas.settings import settings

# Database setup
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_runbooks():
    async with AsyncSessionLocal() as session:
        runbooks = [
            AutomationRunbook(
                id=str(uuid.uuid4()),
                name="Network Connectivity Restorter",
                description="Resets the VPN gateway and flushes DNS cache for the affected network segment. Safe for production during off-peak hours.",
                category_target="Network",
                script_path="/scripts/remediate_network.sh",
                is_active=True
            ),
            AutomationRunbook(
                id=str(uuid.uuid4()),
                name="Database Connection Pool Recycler",
                description="Identifies stagnant connections in the Postgres pool and gracefully restarts the connection manager. Prevents 504 timeouts.",
                category_target="Database",
                script_path="/scripts/recycle_db_pool.py",
                is_active=True
            ),
            AutomationRunbook(
                id=str(uuid.uuid4()),
                name="Storage Capacity Optimizer",
                description="Cleans up temporary log files and archived traces older than 7 days from the /var/log/app directory. Gains ~20% disk space.",
                category_target="Storage",
                script_path="/scripts/cleanup_logs.sh",
                is_active=True
            ),
            AutomationRunbook(
                id=str(uuid.uuid4()),
                name="Access Management Sync",
                description="Force-syncs the local LDAP cache with the primary Entra ID provider to resolve permission lag. Triggered after OIDC failures.",
                category_target="Access Management",
                script_path="/scripts/sync_ldap.sh",
                is_active=True
            )
        ]
        
        session.add_all(runbooks)
        await session.commit()
        print("Runbooks seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_runbooks())
