import asyncio
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import sys

# Add backend/src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from src.repositories.models import Ticket

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/tickets"

async def get_ticket_id():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        stmt = select(Ticket).limit(5)
        result = await session.execute(stmt)
        tickets = result.scalars().all()
        for t in tickets:
            print(f"ID: {t.id} - Number: {t.ticket_number} - Status: {t.status} - Candidate: {t.is_automation_candidate}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_ticket_id())
