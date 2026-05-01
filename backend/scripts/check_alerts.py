import asyncio
from src.repositories.database import async_session_maker
from sqlalchemy import select, func
from src.repositories.models import PatternAlert

async def check_alerts():
    async with async_session_maker() as session:
        res = await session.execute(select(func.count(PatternAlert.id)))
        count = res.scalar()
        print(f"Current Pattern Alerts in DB: {count}")

if __name__ == "__main__":
    asyncio.run(check_alerts())
