
import asyncio
import json
import numpy as np
from sqlalchemy import select
from src.repositories.database import get_db_context
from src.repositories.models import Ticket, TicketEmbedding
from datetime import datetime, timedelta

async def check_similarities(ticket_id):
    async with get_db_context() as session:
        # 1. Get target embedding
        query = select(TicketEmbedding.embedding).where(TicketEmbedding.ticket_id == ticket_id)
        result = await session.execute(query)
        target_emb_json = result.scalar()
        if not target_emb_json:
            print("Target embedding not found!")
            return
        target_emb = np.array(json.loads(target_emb_json))

        # 2. Get recent tickets
        since_date = datetime.utcnow() - timedelta(days=7)
        recent_query = select(Ticket, TicketEmbedding.embedding).join(
            TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id
        ).where(Ticket.created_at >= since_date)
        
        result = await session.execute(recent_query)
        rows = result.all()
        
        print(f"Checking similarities for {ticket_id} against {len(rows)} recent tickets...")
        
        sims = []
        for other, emb_json in rows:
            if other.id == ticket_id:
                continue
            emb = np.array(json.loads(emb_json))
            sim = np.dot(target_emb, emb) / (np.linalg.norm(target_emb) * np.linalg.norm(emb))
            sims.append((other.ticket_number, sim))
        
        sims.sort(key=lambda x: x[1], reverse=True)
        for tnum, sim in sims[:10]:
            print(f"{tnum}: {sim:.4f}")

if __name__ == "__main__":
    import sys
    asyncio.run(check_similarities('351c6bd0-435d-4da7-b26b-51ff048cff30'))
