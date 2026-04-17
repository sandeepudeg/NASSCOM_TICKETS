import asyncio
import os
import sys
import pandas as pd
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

from src.repositories.database import async_session_maker
from src.repositories.models import Ticket
from src.schemas.ticket import RoutingStatus, TicketStatus
from sqlalchemy import select, func, delete

KAGGLE_PATH = (
    r"d:\Learning\Self_learning\Nasscom\Tickets\data\kaggle\multilingual_tickets.csv"
)

# Category Mapping
TAG_MAPPING = {
    "Security": "Security",
    "Bug": "Application",
    "Feature": "Application",
    "Feedback": "Application",
    "Performance": "Application",
    "Infrastructure": "Infrastructure",
    "Outage": "Infrastructure",
    "Hardware": "Infrastructure",
    "Account": "Access Management",
    "Access": "Access Management",
    "Network": "Network",
    "Database": "Database",
    "Storage": "Storage",
    "Database Management": "Database",
}

# Short codes for ticket numbers
CATEGORY_SHORT_CODES = {
    "Infrastructure": "INF",
    "Application": "APP",
    "Security": "SEC",
    "Database": "DB",
    "Storage": "STR",
    "Network": "NET",
    "Access Management": "ACC",
}


async def get_next_ticket_idx():
    async with async_session_maker() as session:
        query = select(func.count(Ticket.id)).where(
            Ticket.owner_id == "kaggle_importer"
        )
        res = await session.execute(query)
        return res.scalar() or 0


async def seed_data():
    if not os.path.exists(KAGGLE_PATH):
        print(f"Error: Kaggle dataset not found at {KAGGLE_PATH}")
        return

    # Cleanup any previous partial imports
    async with async_session_maker() as session:
        print("Cleaning up previous kaggle_importer tickets...")
        await session.execute(
            delete(Ticket).where(Ticket.owner_id == "kaggle_importer")
        )
        await session.commit()

    print("Loading Kaggle dataset...")
    df = pd.read_csv(KAGGLE_PATH)

    # Filter for English and resolved tickets (those with answers)
    df_en = df[df["language"] == "en"].dropna(subset=["answer", "tag_1"])

    # Take a diverse sample across tags
    sampled_df = df_en.groupby("tag_1").head(15).head(500)

    print(f"Importing up to {len(sampled_df)} tickets...")

    start_idx = await get_next_ticket_idx()
    print(f"Starting index: {start_idx}")

    async with async_session_maker() as session:
        count = 0
        added_count = 0
        for _, row in sampled_df.iterrows():
            try:
                tag = row["tag_1"]
                category_str = TAG_MAPPING.get(tag, "Application")

                title = str(row["subject"])[:500]
                description = str(row["body"])
                resolution = str(row["answer"])

                short_code = CATEGORY_SHORT_CODES.get(category_str, "GEN")
                ts = int(datetime.utcnow().timestamp())
                ticket_number = f"KAG-{short_code}-{ts}-{count:03d}"

                ticket = Ticket(
                    ticket_number=ticket_number,
                    title=title,
                    description=description,
                    owner_id="kaggle_importer",
                    category=category_str,
                    status=TicketStatus.RESOLVED.value,
                    routing_status=RoutingStatus.CLASSIFIED.value,
                    confidence_score=0.85 + (count % 15) / 100.0,
                    priority="medium",
                    source_channel="email",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    resolved_at=datetime.utcnow(),
                )

                import json

                payload = {"resolution": resolution}
                ticket.structured_payload = json.dumps(payload)

                session.add(ticket)
                await session.commit()  # Commit per row
                count += 1
                added_count += 1

                if count % 10 == 0:
                    print(f"  Successfully seeded {count} tickets...")
            except Exception as e:
                await session.rollback()
                print(f"  Skipping row {count} due to error: {e}")

        print(f"Seeding process finished. Total added: {added_count}")


if __name__ == "__main__":
    asyncio.run(seed_data())
