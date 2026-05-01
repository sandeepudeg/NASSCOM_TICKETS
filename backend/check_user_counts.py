
import asyncio
from src.repositories.database import async_session_maker
from src.repositories.models import Ticket
from sqlalchemy import select, func

async def check():
    async with async_session_maker() as s:
        r = await s.execute(select(Ticket.owner_id, func.count(Ticket.id)).group_by(Ticket.owner_id).where(Ticket.owner_id.like('user%')))
        results = r.all()
        for owner, count in results:
            print(f"User: {owner}, Tickets: {count}")

if __name__ == "__main__":
    asyncio.run(check())
