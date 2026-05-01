
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Ticket, Folder, TicketFolderAssignment
from sqlalchemy import select, func

async def check_data():
    async for db in get_db():
        print("\n--- Folders & Assignments ---")
        stmt = select(Folder.name, Folder.id, Folder.owner_id)
        result = await db.execute(stmt)
        folders = result.all()
        for f in folders:
            # count assignments
            stmt_a = select(func.count(TicketFolderAssignment.id)).where(TicketFolderAssignment.folder_id == f[1])
            res_a = await db.execute(stmt_a)
            count = res_a.scalar()
            print(f"Owner: {f[2]}, Folder: '{f[0]}', ID: {f[1]}, Assignments: {count}")

if __name__ == "__main__":
    asyncio.run(check_data())
