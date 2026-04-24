
import asyncio
import json
import numpy as np
from sqlalchemy import select, delete
from src.repositories.database import get_db_context
from src.repositories.models import Ticket, TicketEmbedding
from src.ml.embedding_service import embedding_service

async def backfill_embeddings():
    async with get_db_context() as session:
        # Wipe all existing zero/bad embeddings
        await session.execute(delete(TicketEmbedding))
        await session.commit()
        
        # Fetch all tickets
        query = select(Ticket)
        result = await session.execute(query)
        tickets = result.scalars().all()
        
        print(f"Total tickets: {len(tickets)}. Generating fresh embeddings...")
        
        for i, ticket in enumerate(tickets):
            full_text = f"{ticket.title}. {ticket.description}"
            emb = embedding_service.get_embedding(full_text)
            
            ticket_emb = TicketEmbedding(
                ticket_id=ticket.id,
                embedding=json.dumps(emb.tolist()),
                model_version=embedding_service.model_name
            )
            session.add(ticket_emb)
            
            if (i + 1) % 50 == 0:
                await session.flush()
                print(f"Processed {i + 1}/{len(tickets)}...")
        
        await session.commit()
        print("Backfill complete with high-quality vectors.")

if __name__ == "__main__":
    asyncio.run(backfill_embeddings())
