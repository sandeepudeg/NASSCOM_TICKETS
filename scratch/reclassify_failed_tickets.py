import asyncio
import os
import sys
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Add backend/src to path
backend_path = os.path.abspath(os.path.join(os.getcwd(), "backend", "src"))
sys.path.append(backend_path)
# Add backend to path for config
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "backend")))

from repositories.models import Ticket
from services.ticket_service import TicketService

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/tickets"

async def reclassify_tickets():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    ticket_ids = ['630d2b77-801a-4db2-a436-91489343e096', 'd10341bf-f955-4b99-b510-dde94f222dab']
    
    async with async_session() as session:
        service = TicketService(session)
        
        for tid in ticket_ids:
            print(f"Re-classifying ticket: {tid}")
            ticket = await service.ticket_repo.get_by_id(tid)
            if not ticket:
                print(f"  Ticket {tid} not found.")
                continue
                
            # We need to simulate what create_ticket does, but for an existing ticket
            from ml.classifier import classifier
            from services.converters import ticket_to_response
            
            classification = await classifier.classify(
                title=ticket.title,
                description=ticket.description
            )
            
            print(f"  Detected Category: {classification.category.value}")
            
            ticket.category = classification.category.value
            ticket.confidence_score = classification.confidence_score
            ticket.routing_status = classification.routing_status.value
            
            # Re-generate ticket number if None
            if not ticket.ticket_number:
                from services.ticket_service import CATEGORY_SHORT_CODES, Category
                category_enum = Category(classification.category.value)
                short_code = CATEGORY_SHORT_CODES.get(category_enum, "GEN")
                ticket_count = await service.ticket_repo.count_all()
                ticket.ticket_number = f"TK-{short_code}-{ticket_count + 101:05d}"
            
            await service.ticket_repo.update(ticket)
            
            # Re-assign to folder
            try:
                dept_folder = await service.routing_service.get_or_create_department_folder(
                    category=classification.category.value, owner_id=ticket.owner_id
                )
                await service.assignment_service.assign_ticket(
                    ticket_id=ticket.id,
                    folder_id=dept_folder.id,
                    user_id=ticket.owner_id
                )
                print(f"  Assigned to folder: {dept_folder.name}")
            except Exception as e:
                print(f"  Routing failed: {str(e)}")
        
        await session.commit()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reclassify_tickets())
