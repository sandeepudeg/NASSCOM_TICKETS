
import asyncio
from src.database.session import get_db
from src.repositories.models import User
from sqlalchemy import select

async def run():
    async for db in get_db():
        stmt = select(User.id, User.username)
        result = await db.execute(stmt)
        users = result.all()
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}")
        break

if __name__ == "__main__":
    asyncio.run(run())
