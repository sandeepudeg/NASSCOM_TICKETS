import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Add backend/src to path
backend_path = os.path.abspath(os.path.join(os.getcwd(), "backend", "src"))
sys.path.append(backend_path)

from repositories.models import Ticket, Folder, TicketFolderAssignment

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/tickets"

async def debug_tickets():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Search for specific tickets
        stmt = select(Ticket).where(Ticket.ticket_number.ilike('%D10341%') | Ticket.ticket_number.ilike('%630D2B%') | Ticket.id.ilike('%D10341%') | Ticket.id.ilike('%630D2B%'))
        result = await session.execute(stmt)
        tickets = result.scalars().all()
        
        print(f"Found {len(tickets)} matching tickets.")
        for t in tickets:
            print(f"ID: {t.id} | Number: {t.ticket_number} | Category: {t.category} | Status: {t.status} | Routing: {t.routing_status}")
            print(f"  TITLE: {t.title}")
            print(f"  DESCRIPTION: {t.description}")
            
            # Check assignments
            assign_stmt = select(TicketFolderAssignment, Folder.name).join(Folder).where(TicketFolderAssignment.ticket_id == t.id)
            assign_result = await session.execute(assign_stmt)
            assignments = assign_result.all()
            if not assignments:
                print("  -> NO FOLDER ASSIGNMENTS")
            for assignment, folder_name in assignments:
                print(f"  -> Assigned to folder: {folder_name} (ID: {assignment.folder_id})")
        
        # 2. Also check for ANY unassigned tickets
        unassigned_stmt = select(Ticket).outerjoin(TicketFolderAssignment).where(TicketFolderAssignment.id.is_(None)).limit(10)
        unassigned_result = await session.execute(unassigned_stmt)
        unassigned_tickets = unassigned_result.scalars().all()
        if unassigned_tickets:
            print("\nUnassigned tickets (up to 10):")
            for t in unassigned_tickets:
                print(f"ID: {t.id} | Number: {t.ticket_number} | Category: {t.category} | Routing: {t.routing_status}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_tickets())
