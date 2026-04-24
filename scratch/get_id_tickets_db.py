import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

async def get_id():
    load_dotenv("backend/.env")
    url = os.getenv("DATABASE_URL").rsplit("/", 1)[0] + "/tickets_db"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT id FROM tickets LIMIT 1"))
        print(r.scalar())
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_id())
