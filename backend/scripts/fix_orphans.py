import asyncio
import sys
import uuid
from datetime import datetime

import structlog
from sqlalchemy import select

from src.repositories.database import async_session_maker
from src.repositories.models import Ticket, Folder, TicketFolderAssignment

logger = structlog.get_logger("scripts.fix_orphaned_tickets")

async def fix_orphaned_tickets():
    async with async_session_maker() as session:
        # Find all tickets that DO NOT have an assignment
        stmt = select(Ticket).where(~Ticket.folder_assignments.any())
        result = await session.execute(stmt)
        orphaned_tickets = result.scalars().all()
        
        if not orphaned_tickets:
            print("No orphaned tickets found.")
            return

        print(f"Found {len(orphaned_tickets)} orphaned tickets. Assigning them to departments...")

        # Group by category
        owner_id = orphaned_tickets[0].owner_id  # Assuming all belong to same owner (admin)
        unique_categories = {t.category for t in orphaned_tickets if t.category}
        folder_map = {}
        
        for category in unique_categories:
            folder_name = f"{category} Department"
            stmt = select(Folder).where(Folder.name == folder_name, Folder.owner_id == owner_id)
            result = await session.execute(stmt)
            folder = result.scalars().first()
            
            if not folder:
                folder = Folder(
                    id=str(uuid.uuid4()),
                    name=folder_name,
                    owner_id=owner_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(folder)
            folder_map[category] = folder

        await session.flush()
        
        assignments = []
        for t in orphaned_tickets:
            if t.category and t.category in folder_map:
                assignments.append(
                    TicketFolderAssignment(
                        id=str(uuid.uuid4()),
                        ticket_id=t.id,
                        folder_id=folder_map[t.category].id,
                        assigned_at=datetime.utcnow()
                    )
                )
        
        if assignments:
            session.add_all(assignments)
            await session.commit()
            print(f"Successfully assigned {len(assignments)} tickets to their departments.")
        else:
            print("No assignments needed.")

if __name__ == "__main__":
    asyncio.run(fix_orphaned_tickets())
