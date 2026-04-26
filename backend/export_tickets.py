import asyncio
import json
from sqlalchemy import select
from src.repositories.database import get_db, init_db, close_db
from src.repositories.models import Ticket, Folder, TicketFolderAssignment, TicketEmbedding
from datetime import datetime

def datetime_handler(x):
    if isinstance(x, datetime):
        return x.isoformat()
    raise TypeError("Unknown type")

async def export_data():
    await init_db()
    async for db in get_db():
        # Export Tickets
        tickets = await db.execute(select(Ticket))
        tickets_list = []
        for t in tickets.scalars().all():
            d = {c.name: getattr(t, c.name) for c in t.__table__.columns}
            tickets_list.append(d)
        
        # Export Folders
        folders = await db.execute(select(Folder))
        folders_list = []
        for f in folders.scalars().all():
            d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
            folders_list.append(d)
            
        # Export Assignments
        assignments = await db.execute(select(TicketFolderAssignment))
        assignments_list = []
        for a in assignments.scalars().all():
            d = {c.name: getattr(a, c.name) for c in a.__table__.columns}
            assignments_list.append(d)

        data = {
            "tickets": tickets_list,
            "folders": folders_list,
            "assignments": assignments_list
        }
        
        with open("tickets_seed.json", "w") as f:
            json.dump(data, f, default=datetime_handler, indent=2)
            
        print(f"Exported {len(tickets_list)} tickets, {len(folders_list)} folders, {len(assignments_list)} assignments.")
        break
    await close_db()

if __name__ == "__main__":
    asyncio.run(export_data())
