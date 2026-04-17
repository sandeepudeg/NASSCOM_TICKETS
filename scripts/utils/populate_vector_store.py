#!/usr/bin/env python3
"""
populate_vector_store.py — Batch-embed all resolved tickets into the TicketEmbedding table.

The RAG service in TicketIQ uses cosine similarity against stored embeddings.
This script generates embeddings for every resolved ticket and stores them in
the `ticket_embeddings` table so the RAG service can find similar tickets fast.

Usage (run from project root):
    PYTHONPATH=. python scripts/utils/populate_vector_store.py
    PYTHONPATH=. python scripts/utils/populate_vector_store.py --reindex   # re-embed everything
    PYTHONPATH=. python scripts/utils/populate_vector_store.py --batch-size 64
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Ensure project root is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.ml.embedding_service import embedding_service
from src.repositories.models import Ticket, TicketEmbedding
from src.schemas.settings import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger(__name__)


def build_ticket_text(ticket: Ticket) -> str:
    """Combine title + description (+ resolution if Kaggle data) into one embedding text."""
    parts = [ticket.title, ticket.description]
    # Pull resolution text from structured_payload for RAG quality
    if ticket.structured_payload:
        try:
            payload = json.loads(ticket.structured_payload)
            resolution = payload.get("resolution", "")
            if resolution:
                parts.append(f"Resolution: {resolution}")
        except Exception:
            pass
    return " ".join(p.strip() for p in parts if p and p.strip())


async def fetch_resolved_tickets(session: AsyncSession) -> list[Ticket]:
    """Load all resolved tickets (our RAG knowledge base)."""
    result = await session.execute(select(Ticket).where(Ticket.status == "resolved"))
    return result.scalars().all()


async def fetch_already_indexed_ids(session: AsyncSession) -> set[str]:
    """Return ticket IDs that already have embeddings stored."""
    result = await session.execute(select(TicketEmbedding.ticket_id))
    return {row[0] for row in result.fetchall()}


async def main():
    parser = argparse.ArgumentParser(
        description="Embed all resolved tickets for RAG retrieval"
    )
    parser.add_argument(
        "--reindex",
        action="store_true",
        help="Delete all embeddings and re-embed from scratch",
    )
    parser.add_argument(
        "--batch-size", type=int, default=32, help="Embedding batch size (default: 32)"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show stats without writing embeddings"
    )
    args = parser.parse_args()

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:

        # Optional: wipe and rebuild everything
        if args.reindex:
            logger.info("🗑  --reindex: deleting all existing embeddings...")
            await session.execute(delete(TicketEmbedding))
            await session.commit()
            logger.info("    Done.")

        resolved_tickets = await fetch_resolved_tickets(session)
        logger.info(
            f"📋  Found {len(resolved_tickets)} resolved tickets in the database."
        )

        already_indexed = await fetch_already_indexed_ids(session)
        logger.info(f"🔑  Already embedded: {len(already_indexed)} tickets.")

        to_embed = [t for t in resolved_tickets if t.id not in already_indexed]
        logger.info(f"📝  Tickets needing embedding: {len(to_embed)}")

        if not to_embed:
            logger.info(
                "✅  Nothing to do — all resolved tickets are already vectorized."
            )
            return

        if args.dry_run:
            logger.info(f"[DRY RUN] Would embed {len(to_embed)} tickets. Exiting.")
            return

        # Batch encode
        try:
            model_version = embedding_service.model_name
        except AttributeError:
            model_version = os.getenv("EMBEDDING_MODEL", settings.embedding_model)
        logger.info(f"🤖  Embedding model: {model_version}")

        embedded_count = 0
        for batch_start in range(0, len(to_embed), args.batch_size):
            batch = to_embed[batch_start : batch_start + args.batch_size]
            texts = [build_ticket_text(t) for t in batch]

            embeddings = embedding_service.get_embeddings(texts)

            for ticket, emb in zip(batch, embeddings):
                te = TicketEmbedding(
                    ticket_id=ticket.id,
                    embedding=json.dumps(emb.tolist()),
                    model_version=model_version,
                )
                session.add(te)

            await session.commit()
            embedded_count += len(batch)
            logger.info(f"    Embedded {embedded_count}/{len(to_embed)} tickets...")

        logger.info(f"✅  Done! {embedded_count} new embeddings stored.")
        logger.info(
            "    RAG service will automatically use these for resolution suggestions."
        )


if __name__ == "__main__":
    asyncio.run(main())
