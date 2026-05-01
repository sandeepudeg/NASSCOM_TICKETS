import asyncio
from src.repositories.database import async_session_maker
from sqlalchemy import select, func
from src.repositories.models import TicketEmbedding, Ticket

async def check():
    async with async_session_maker() as session:
        t_count = await session.execute(select(func.count(Ticket.id)))
        e_count = await session.execute(select(func.count(TicketEmbedding.id)))
        print(f"Tickets in DB: {t_count.scalar()}")
        print(f"Embeddings in DB: {e_count.scalar()}")
        
        # Check if they join
        stmt = select(Ticket.id).join(TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id).limit(5)
        res = await session.execute(stmt)
        joined = res.scalars().all()
        print(f"Joined samples: {len(joined)}")

if __name__ == "__main__":
    asyncio.run(check())
