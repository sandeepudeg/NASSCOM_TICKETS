
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Ticket, Folder, TicketFolderAssignment
from sqlalchemy import select, func
from uuid import uuid4
from datetime import datetime

async def duplicate_assignments():
    async for db in get_db():
        print("Duplicating assignments from 'admin' folders to 'system' folders...")
        
        # Get admin folders
        stmt_admin = select(Folder).where(Folder.owner_id == "admin")
        res_admin = await db.execute(stmt_admin)
        admin_folders = res_admin.scalars().all()
        
        # Get system folders
        stmt_system = select(Folder).where(Folder.owner_id == "system")
        res_system = await db.execute(stmt_system)
        system_folders = {f.name: f for f in res_system.scalars().all()}
        
        for af in admin_folders:
            sf = system_folders.get(af.name)
            if not sf:
                print(f"No system folder for {af.name}")
                continue
            
            # Get assignments for admin folder
            stmt_a = select(TicketFolderAssignment).where(TicketFolderAssignment.folder_id == af.id)
            res_a = await db.execute(stmt_a)
            assignments = res_a.scalars().all()
            
            count = 0
            for a in assignments:
                # Check if already assigned to system folder
                stmt_check = select(TicketFolderAssignment).where(
                    TicketFolderAssignment.ticket_id == a.ticket_id,
                    TicketFolderAssignment.folder_id == sf.id
                )
                res_check = await db.execute(stmt_check)
                if not res_check.scalar_one_or_none():
                    new_a = TicketFolderAssignment(
                        id=str(uuid4()),
                        ticket_id=a.ticket_id,
                        folder_id=sf.id,
                        assigned_at=a.assigned_at or datetime.utcnow()
                    )
                    db.add(new_a)
                    count += 1
            
            print(f"Copied {count} assignments for {af.name}")
            
        await db.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(duplicate_assignments())
