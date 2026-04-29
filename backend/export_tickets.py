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
        from src.repositories.models import Ticket, Folder, TicketFolderAssignment, TicketEmbedding, PatternAlert, AgentOverride, MappingConfig
        
        # Helper to export a table
        async def get_table_data(model):
            res = await db.execute(select(model))
            items = []
            for item in res.scalars().all():
                d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
                items.append(d)
            return items

        data = {
            "tickets": await get_table_data(Ticket),
            "folders": await get_table_data(Folder),
            "assignments": await get_table_data(TicketFolderAssignment),
            "embeddings": await get_table_data(TicketEmbedding),
            "pattern_alerts": await get_table_data(PatternAlert),
            "overrides": await get_table_data(AgentOverride),
            "mapping_configs": await get_table_data(MappingConfig)
        }
        
        with open("tickets_seed.json", "w") as f:
            json.dump(data, f, default=datetime_handler, indent=2)
            
        print(f"✅ Full Export Complete:")
        for key, val in data.items():
            print(f"  - {key}: {len(val)}")
        break
    await close_db()

if __name__ == "__main__":
    asyncio.run(export_data())
