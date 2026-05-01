import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select, delete, update, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from src.repositories.models import Ticket

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/tickets"

CATEGORY_SHORT_CODES = {
    "Infrastructure": "INF",
    "Application": "APP",
    "Security": "SEC",
    "Database": "DB",
    "Storage": "STR",
    "Network": "NET",
    "Access Management": "ACC",
}

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        print("--- Step 1: Consolidating Folders ---")
        # 1. Consolidated Folders (Moved to SQL for speed)
        query = text("""
            WITH mapping AS (
                SELECT s.id as source_id, t.id as target_id
                FROM folders s
                JOIN folders t ON t.name = REPLACE(s.name, ' Department', '')
                WHERE s.name LIKE '% Department' AND s.deleted_at IS NULL AND t.deleted_at IS NULL
            ),
            moved AS (
                INSERT INTO ticket_folder_assignments (id, ticket_id, folder_id, assigned_at)
                SELECT gen_random_uuid()::varchar, tfa.ticket_id, m.target_id, tfa.assigned_at
                FROM ticket_folder_assignments tfa
                JOIN mapping m ON tfa.folder_id = m.source_id
                ON CONFLICT (ticket_id, folder_id) DO NOTHING
                RETURNING ticket_id
            )
            SELECT count(*) FROM moved;
        """)
        result = await session.execute(query)
        print(f"✅ Consolidated {result.scalar() or 0} ticket assignments.")

        query = text("UPDATE folders SET deleted_at = NOW() WHERE name LIKE '% Department' AND deleted_at IS NULL;")
        await session.execute(query)
        print("✅ Cleaned up duplicate 'Department' folders.")

        print("\n--- Step 2: Fixing Ticket Numbers ---")
        # 2. Find tickets with bad numbering
        # (Missing ticket_number or doesn't follow TICK- pattern)
        stmt = select(Ticket).where(
            (Ticket.ticket_number.is_(None)) | 
            (~Ticket.ticket_number.like("TICK-%"))
        ).order_by(Ticket.created_at.asc())
        
        result = await session.execute(stmt)
        bad_tickets = result.scalars().all()
        
        if not bad_tickets:
            print("No tickets with invalid numbering found.")
        else:
            print(f"Found {len(bad_tickets)} tickets requiring re-numbering.")
            
            # Get current base count for sequence
            stmt = select(text("count(*)")).select_from(text("tickets"))
            result = await session.execute(stmt)
            current_total = result.scalar() or 0
            
            start_idx = current_total - len(bad_tickets) + 101
            if start_idx < 101: start_idx = 101
            
            for i, ticket in enumerate(bad_tickets):
                short_code = CATEGORY_SHORT_CODES.get(ticket.category, "GEN")
                ticket.ticket_number = f"TICK-{short_code}-{start_idx + i:05d}"
            
            print(f"✅ Successfully re-numbered {len(bad_tickets)} tickets.")

        await session.commit()
        print("\n🚀 All migrations completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
