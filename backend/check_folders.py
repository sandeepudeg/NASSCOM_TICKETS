
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Folder, Ticket, TicketFolderAssignment
from sqlalchemy import select, delete

async def check_folders():
    async for db in get_db():
        stmt = select(Folder)
        result = await db.execute(stmt)
        folders = result.scalars().all()
        print(f"Total folders: {len(folders)}")
        for f in folders:
            # Count tickets in folder
            stmt_count = select(Ticket).join(TicketFolderAssignment).where(TicketFolderAssignment.folder_id == f.id)
            res_count = await db.execute(stmt_count)
            count = len(res_count.all())
            print(f"ID: {f.id}, Name: '{f.name}', Owner: {f.owner_id}, Tickets: {count}")

if __name__ == "__main__":
    asyncio.run(check_folders())
