import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

async def check():
    load_dotenv("backend/.env")
    base_url = os.getenv("DATABASE_URL").rsplit("/", 1)[0]
    
    for db_name in ["tickets", "tickets_db"]:
        url = f"{base_url}/{db_name}"
        try:
            engine = create_async_engine(url)
            async with engine.connect() as conn:
                r = await conn.execute(text("SELECT COUNT(*) FROM tickets;"))
                count = r.scalar()
                print(f"DB '{db_name}': {count} tickets")
            await engine.dispose()
        except Exception as e:
            print(f"DB '{db_name}': Error {e}")

if __name__ == "__main__":
    asyncio.run(check())
