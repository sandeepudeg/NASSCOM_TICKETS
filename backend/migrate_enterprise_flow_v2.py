import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from src.schemas.settings import settings

async def migrate():
    print(f"Connecting to {settings.database_url}...")
    engine = create_async_engine(settings.database_url)
    
    async with engine.begin() as conn:
        # Define columns to add
        # Note: SQLAlchemy doesn't support async ALTER TABLE easily across all dialects,
        # so we use raw SQL.
        
        columns = [
            ("resolution_details", "TEXT"),
            ("hold_type", "VARCHAR(50)"),
            ("status_changed_at", "TIMESTAMP")
        ]
        
        # Check dialect
        is_sqlite = "sqlite" in settings.database_url
        
        for col_name, col_type in columns:
            try:
                print(f"Adding column {col_name} ({col_type})...")
                # PostgreSQL requires check for existence or handling error
                if is_sqlite:
                    await conn.execute(text(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}"))
                else:
                    # Postgres specific: check if exists to avoid error
                    await conn.execute(text(f"ALTER TABLE tickets ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Column {col_name} added.")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Warning: Could not add {col_name}: {e}")
        
        # Update status_changed_at
        print("Initializing status_changed_at timestamps...")
        await conn.execute(text("UPDATE tickets SET status_changed_at = created_at WHERE status_changed_at IS NULL"))
        print("Migration complete.")

if __name__ == "__main__":
    # Ensure we are in the right directory to import src
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(migrate())
