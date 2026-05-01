
import asyncio
from src.repositories.database import get_db
from src.repositories.models import Folder, Ticket, TicketFolderAssignment
from sqlalchemy import select, delete, update

async def cleanup():
    async for db in get_db():
        print("Starting folder cleanup and renaming...")
        
        # 1. Get all folders
        stmt = select(Folder)
        result = await db.execute(stmt)
        folders = result.scalars().all()
        
        # Group by name (lowercase)
        groups = {}
        for f in folders:
            name_key = f.name.lower()
            if name_key not in groups:
                groups[name_key] = []
            groups[name_key].append(f)
            
        for name, folder_list in groups.items():
            # Pick the 'admin' folder as best_folder if it exists, otherwise the first one
            best_folder = next((f for f in folder_list if f.owner_id == "admin"), folder_list[0])
            
            # If multiple admin folders, pick the one with most tickets
            admin_folders = [f for f in folder_list if f.owner_id == "admin"]
            if len(admin_folders) > 1:
                max_tickets = -1
                for f in admin_folders:
                    stmt_count = select(TicketFolderAssignment).where(TicketFolderAssignment.folder_id == f.id)
                    res_count = await db.execute(stmt_count)
                    count = len(res_count.all())
                    if count > max_tickets:
                        max_tickets = count
                        best_folder = f
            
            print(f"Keeping folder '{best_folder.name}' (ID: {best_folder.id}) owned by '{best_folder.owner_id}'.")
            
            # Ensure owner is 'admin'
            best_folder.owner_id = "admin"
            
            # Move tickets from all other folders in the group to best_folder
            for f in folder_list:
                if f.id == best_folder.id:
                    continue
                
                # To avoid UniqueViolationError, we delete assignments that already exist in best_folder
                # Subquery to find ticket_ids already in best_folder
                stmt_dup = select(TicketFolderAssignment.ticket_id).where(TicketFolderAssignment.folder_id == best_folder.id)
                res_dup = await db.execute(stmt_dup)
                dup_ticket_ids = res_dup.scalars().all()
                
                if dup_ticket_ids:
                    stmt_del_dup = delete(TicketFolderAssignment).where(
                        TicketFolderAssignment.folder_id == f.id,
                        TicketFolderAssignment.ticket_id.in_(dup_ticket_ids)
                    )
                    await db.execute(stmt_del_dup)
                
                # Update remaining assignments
                stmt_move = update(TicketFolderAssignment).where(TicketFolderAssignment.folder_id == f.id).values(folder_id=best_folder.id)
                await db.execute(stmt_move)
                
                # Delete old folder
                await db.delete(f)
                print(f"Deleted folder ID: {f.id} owned by '{f.owner_id}'")
            
            # Rename best_folder to Title Case
            new_name = name.capitalize()
            # Special case for Access
            if name == "access":
                new_name = "Access"
            
            best_folder.name = new_name
            print(f"Renamed to '{new_name}'")

        await db.commit()
        print("Cleanup and renaming complete!")
        break

if __name__ == "__main__":
    asyncio.run(cleanup())
