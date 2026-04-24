import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

async def get_id():
    load_dotenv("backend/.env")
    engine = create_async_engine(os.getenv("DATABASE_URL"))
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT id FROM tickets LIMIT 1"))
        print(r.scalar())
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_id())
