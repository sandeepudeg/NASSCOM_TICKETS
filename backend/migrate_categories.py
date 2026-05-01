
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Ticket, Folder, TicketEmbedding, PatternAlert
from sqlalchemy import select, update, text
import json

async def migrate():
    async for db in get_db():
        print("Starting folder name migration...")
        
        # Mapping old to new
        mapping = {
            "Infrastructure": "infrastructure",
            "Application": "application",
            "Security": "security",
            "Database": "database",
            "Storage": "storage",
            "Network": "network",
            "Access Management": "access"
        }
        
        # 1. Update Folders (String column)
        for old, new in mapping.items():
            old_dept = f"{old} Department"
            # Try both names
            stmt = update(Folder).where(Folder.name == old).values(name=new)
            result = await db.execute(stmt)
            
            stmt2 = update(Folder).where(Folder.name == old_dept).values(name=new)
            result2 = await db.execute(stmt2)
            print(f"Updated {result.rowcount + result2.rowcount} folders for '{old}'")
            
        await db.commit()
        print("Migration complete!")
        break

if __name__ == "__main__":
    asyncio.run(migrate())
