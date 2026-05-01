import asyncio
import json
import uuid
from datetime import datetime
from src.repositories.database import async_session_maker
from sqlalchemy import select, func
from src.repositories.models import Ticket, TicketEmbedding
from src.ml.embedding_service import embedding_service

async def fix_missing_embeddings():
    async with async_session_maker() as session:
        # Find tickets without embeddings
        # Subquery for ticket_ids that have embeddings
        emb_subquery = select(TicketEmbedding.ticket_id)
        stmt = select(Ticket).where(Ticket.id.not_in(emb_subquery))
        
        result = await session.execute(stmt)
        tickets_missing = result.scalars().all()
        
        print(f"Found {len(tickets_missing)} tickets missing embeddings.")
        
        if not tickets_missing:
            return

        # Process in batches of 50
        batch_size = 50
        for i in range(0, len(tickets_missing), batch_size):
            batch = tickets_missing[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}...")
            
            texts = [f"{t.title}. {t.description}" for t in batch]
            embeddings = embedding_service.get_embeddings(texts)
            
            embedding_objs = []
            for j, ticket in enumerate(batch):
                embedding_objs.append(
                    TicketEmbedding(
                        id=str(uuid.uuid4()),
                        ticket_id=ticket.id,
                        embedding=json.dumps(embeddings[j].tolist()),
                        model_version=embedding_service.model_name,
                        created_at=datetime.utcnow()
                    )
                )
            
            session.add_all(embedding_objs)
            await session.commit()
            print(f"Saved {len(embedding_objs)} embeddings.")

if __name__ == "__main__":
    asyncio.run(fix_missing_embeddings())
