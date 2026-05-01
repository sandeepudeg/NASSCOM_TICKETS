
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Ticket
from sqlalchemy import select

async def run():
    async for db in get_db():
        stmt = select(Ticket.category).limit(10)
        result = await db.execute(stmt)
        print(result.all())
        break

if __name__ == "__main__":
    asyncio.run(run())
