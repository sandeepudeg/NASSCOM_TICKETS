import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

async def check():
    load_dotenv("backend/.env")
    url = os.getenv("DATABASE_URL").rsplit("/", 1)[0] + "/postgres"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT datname FROM pg_database;"))
        dbs = [row[0] for row in r]
        print(f"Databases: {dbs}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
