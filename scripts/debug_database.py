import asyncio
import os
import sys
from sqlalchemy import text

# Add project root to path
sys.path.append(os.getcwd())

from src.repositories.database import engine


async def debug_db():
    print(f"Connecting to: {engine.url}")
    async with engine.connect() as conn:
        try:
            # Check owner distribution
            res = await conn.execute(
                text("SELECT owner_id, count(*) FROM tickets GROUP BY owner_id")
            )
            owners = res.all()
            print("\nTickets by Owner:")
            for row in owners:
                print(f"  - {row[0]}: {row[1]}")

            # Check status distribution
            res = await conn.execute(
                text("SELECT status, count(*) FROM tickets GROUP BY status")
            )
            statuses = res.all()
            print("\nTickets by Status:")
            for row in statuses:
                print(f"  - {row[0]}: {row[1]}")

            # Check for Kaggle tickets specifically
            res = await conn.execute(
                text("SELECT count(*) FROM tickets WHERE owner_id = 'kaggle_importer'")
            )
            kaggle_count = res.scalar()
            print(f"\nTotal Kaggle Tickets: {kaggle_count}")

            # Show a few ticket numbers
            res = await conn.execute(text("SELECT ticket_number FROM tickets LIMIT 5"))
            numbers = res.scalars().all()
            print(f"\nSample Ticket Numbers: {numbers}")

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(debug_db())
