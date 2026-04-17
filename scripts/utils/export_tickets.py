"""
Export tickets (with optional embeddings) to CSV with PII scrubbing.

Usage:
  PYTHONPATH=. python scripts/export_tickets.py --output data/exported_tickets.csv --include-embeddings
"""

import argparse
import asyncio
import csv
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from src.schemas.settings import settings
from src.repositories.models import Ticket
from src.ml.pii_scrubber import PIIScrubber


async def main(output: Path, include_embeddings: bool):
    engine = create_async_engine(settings.database_url, future=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    output.parent.mkdir(parents=True, exist_ok=True)

    async with session_maker() as session:
        result = await session.execute(select(Ticket))
        tickets = result.scalars().all()

    with output.open("w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "id",
            "title",
            "description",
            "owner_id",
            "category",
            "confidence_score",
            "routing_status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        if include_embeddings:
            fieldnames.append("embedding")

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for t in tickets:
            title, _ = PIIScrubber.scrub(t.title or "")
            desc, _ = PIIScrubber.scrub(t.description or "")
            row = {
                "id": t.id,
                "title": title,
                "description": desc,
                "owner_id": t.owner_id,
                "category": t.category,
                "confidence_score": t.confidence_score,
                "routing_status": t.routing_status,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
                "resolved_at": t.resolved_at,
            }
            if include_embeddings:
                row["embedding"] = t.embedding
            writer.writerow(row)

    await engine.dispose()
    print(f"Exported {len(tickets)} tickets to {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output", type=Path, default=Path("data/exported_tickets.csv")
    )
    parser.add_argument("--include-embeddings", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(args.output, args.include_embeddings))
