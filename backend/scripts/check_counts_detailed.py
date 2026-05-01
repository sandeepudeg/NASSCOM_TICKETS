import asyncio
import os
from src.repositories.database import async_session_maker, engine
from sqlalchemy import select, func
from src.repositories.models import TicketEmbedding, Ticket
from src.schemas.settings import settings

async def check():
    print(f"Settings DB URL: {settings.database_url}")
    print(f"Engine URL: {engine.url}")
    async with async_session_maker() as session:
        t_count = await session.execute(select(func.count(Ticket.id)))
        e_count = await session.execute(select(func.count(TicketEmbedding.id)))
        print(f"Tickets in DB: {t_count.scalar()}")
        print(f"Embeddings in DB: {e_count.scalar()}")

if __name__ == "__main__":
    asyncio.run(check())
