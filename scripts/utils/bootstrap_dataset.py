"""
Generate synthetic balanced tickets for all categories and insert into the database.

Usage:
  PYTHONPATH=. python scripts/bootstrap_dataset.py --per-category 20
"""
import argparse
import asyncio
from uuid import uuid4
from datetime import datetime

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from src.schemas.settings import settings
from src.schemas.ticket import Category
from src.repositories.models import Ticket, Base
from src.ml.pii_scrubber import PIIScrubber

TEMPLATE_DESCRIPTIONS = {
    Category.INFRASTRUCTURE: "Server {host} unreachable, CPU spike and kernel logs showing soft lockup.",
    Category.APPLICATION: "API returns 500 on POST /orders, stacktrace NullPointer in payment module.",
    Category.SECURITY: "IDS flagged multiple failed SSH logins from {ip}, possible brute-force.",
    Category.DATABASE: "Replication lag of {lag}s on read replica, slow queries with lock wait timeout.",
    Category.STORAGE: "S3-compatible bucket write failures, 503 slow down responses.",
    Category.NETWORK: "Intermittent packet loss between app and db, latency > {ms}ms.",
    Category.ACCESS_MANAGEMENT: "User cannot login, SSO redirect loop, likely expired IdP metadata.",
}


def synth_ticket(cat: Category, idx: int) -> dict:
    title = f"[{cat.value}] synthetic ticket {idx}"
    desc = TEMPLATE_DESCRIPTIONS[cat].format(host="srv-" + str(idx), ip=f"10.0.0.{idx%255}", lag=45 + idx, ms=120 + idx)
    title, _ = PIIScrubber.scrub(title)
    desc, _ = PIIScrubber.scrub(desc)
    now = datetime.utcnow()
    return dict(
        id=str(uuid4()),
        title=title,
        description=desc,
        owner_id="bootstrapper",
        category=cat.value,
        routing_status="classified",
        confidence_score=0.8,
        created_at=now,
        updated_at=now,
    )


async def main(per_category: int):
    engine = create_async_engine(settings.database_url, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with session_maker() as session:
        rows = []
        for cat in Category:
            for i in range(per_category):
                rows.append(Ticket(**synth_ticket(cat, i)))
        session.add_all(rows)
        await session.commit()
    await engine.dispose()
    print(f"Inserted {len(rows)} synthetic tickets")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-category", type=int, default=20)
    args = parser.parse_args()
    asyncio.run(main(args.per_category))
