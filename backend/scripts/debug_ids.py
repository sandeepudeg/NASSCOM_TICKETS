import asyncio
from src.repositories.database import async_session_maker
from sqlalchemy import select
from src.repositories.models import Ticket, TicketEmbedding

async def check():
    async with async_session_maker() as session:
        stmt_t = select(Ticket.id).limit(5)
        res_t = await session.execute(stmt_t)
        t_ids = res_t.scalars().all()
        print(f"Ticket IDs: {t_ids}")
        
        stmt_e = select(TicketEmbedding.ticket_id).limit(5)
        res_e = await session.execute(stmt_e)
        e_ids = res_e.scalars().all()
        print(f"Embedding Ticket IDs: {e_ids}")

if __name__ == "__main__":
    asyncio.run(check())
