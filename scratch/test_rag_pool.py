import asyncio
from src.repositories.ticket_repository import TicketRepository
from src.schemas.settings import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


async def test():
    engine = create_async_engine(settings.database_url, echo=False)
    s = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with s() as session:
        repo = TicketRepository(session)
        tickets = await repo.get_resolved_tickets_for_rag()
        print(f"RAG pool size: {len(tickets)} tickets")

        with_emb = sum(1 for t in tickets if "embedding" in t)
        print(f"With pre-stored embeddings: {with_emb}")

        # Show a sample resolution from Kaggle (has non-empty, non-bracket-prefixed text)
        kaggle_sample = next(
            (t for t in tickets if t.get("resolution_summary") and not t["resolution_summary"].startswith("[")),
            None,
        )
        if kaggle_sample:
            print("Sample Kaggle resolution:", kaggle_sample["resolution_summary"][:250])
        else:
            print("No Kaggle resolution found in sample; showing first entry:")
            print("  title:", tickets[0]["title"] if tickets else "N/A")
            print("  resolution:", tickets[0]["resolution_summary"][:200] if tickets else "N/A")


asyncio.run(test())
