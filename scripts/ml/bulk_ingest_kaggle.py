#!/usr/bin/env python3
"""
bulk_ingest_kaggle.py — Import Kaggle datasets into TicketIQ database.

Supports 3 datasets with their actual schemas:
  1. adisongoh/it-service-ticket-classification-dataset
     → Columns: Document, Topic_group
  2. vipulshinde/incident-response-log
     → Columns: number, category, subcategory, u_symptom, closed_code, resolved_by, resolved_at, ...
  3. tobiasbueck/multilingual-customer-support-tickets
     → Columns: subject, body, answer, type, queue, priority, language, tag_1..tag_8
     → 'answer' column = resolution text (best source for RAG)

Usage (run from project root):
    PYTHONPATH=. python scripts/ml/bulk_ingest_kaggle.py --limit 100
"""

import argparse
import asyncio
import csv
import json
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from src.ml.pii_scrubber import PIIScrubber
from src.repositories.models import Ticket
from src.schemas.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Category Mapping
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_MAP = {
    "Infrastructure": [
        "Hardware",
        "Infrastructure",
        "Server",
        "Data Center",
        "Network Equipment",
        "Projector",
        "Screen",
    ],
    "Application": [
        "Software",
        "App",
        "Application",
        "Bug",
        "Feature",
        "Returns",
        "Product",
        "Integration",
    ],
    "Security": [
        "Access",
        "Password",
        "Firewall",
        "Security",
        "LDAP",
        "Data Breach",
        "Cyber",
    ],
    "Database": ["DB", "SQL", "Database", "Oracle", "Postgres"],
    "Storage": ["Disk", "Storage", "Filing", "Share", "Cloud", "Cloud Plattform"],
    "Network": [
        "VPN",
        "WIFI",
        "Network",
        "Internet",
        "Connectivity",
        "Outage",
        "Disruption",
    ],
    "Access Management": ["Account", "Permission", "Login", "Access Management", "IAM"],
}


def map_category(raw_val: str) -> str:
    val = str(raw_val).lower()
    for official, keywords in CATEGORY_MAP.items():
        if any(kw.lower() in val for kw in keywords):
            return official
    return "Application"  # safe default


def map_priority(raw_val: str) -> str:
    val = str(raw_val).lower()
    if "high" in val or "1" in val or "critical" in val:
        return "high"
    if "low" in val or "3" in val or "4" in val:
        return "low"
    return "medium"


# ─────────────────────────────────────────────────────────────────────────────
# Dataset 1: adisongoh — it_tickets.csv
# Columns: Document, Topic_group
# Note: No resolution text — ingest as classified examples only
# ─────────────────────────────────────────────────────────────────────────────


async def ingest_adisongoh(session: AsyncSession, file_path: Path, limit: int) -> int:
    """Ingest adisongoh IT ticket classification dataset."""
    logger.info(f"[adisongoh] Ingesting {file_path} ...")
    count = 0
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if count >= limit:
                break
            doc = str(row.get("Document", "")).strip()
            topic = str(row.get("Topic_group", "")).strip()
            if not doc or doc == "nan":
                continue

            # Apply PII scrubbing
            doc, _ = PIIScrubber.scrub(doc)

            title = doc[:120]
            ticket = Ticket(
                title=title,
                description=doc[:2000],
                owner_id="kaggle_importer",
                category=map_category(topic),
                status="resolved",
                routing_status="classified",
                priority="medium",
                structured_payload=json.dumps(
                    {
                        "source": "adisongoh_it_tickets",
                        "topic_group": topic,
                    }
                ),
            )
            session.add(ticket)
            count += 1
    logger.info(f"[adisongoh] Queued {count} tickets.")
    return count


# ─────────────────────────────────────────────────────────────────────────────
# Dataset 2: vipulshinde — incident_log.csv
# Columns: number, category, subcategory, u_symptom, closed_code, resolved_by, resolved_at
# Note: category/subcategory/symptom combos form description; closed_code = resolution hint
# ─────────────────────────────────────────────────────────────────────────────

# Filter to only resolved / closed incidents (skip duplicates from state changes)
CLOSED_STATES = {"closed", "resolved"}


async def ingest_vipulshinde(session: AsyncSession, file_path: Path, limit: int) -> int:
    """Ingest vipulshinde incident response log."""
    logger.info(f"[vipulshinde] Ingesting {file_path} ...")
    seen_numbers = set()
    count = 0
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if count >= limit:
                break
            inc_num = str(row.get("number", "")).strip()
            state = str(row.get("incident_state", "")).strip().lower()
            # Only ingest each incident once, and only when closed/resolved
            if inc_num in seen_numbers:
                continue
            if state not in CLOSED_STATES:
                continue
            seen_numbers.add(inc_num)

            category = str(row.get("category", "")).strip()
            subcategory = str(row.get("subcategory", "")).strip()
            symptom = str(row.get("u_symptom", "")).strip()
            closed_code = str(row.get("closed_code", "")).strip()
            priority = map_priority(row.get("priority", "medium"))
            resolved_at = str(row.get("resolved_at", "")).strip()

            title_raw = (
                f"{category} - {subcategory}"
                if subcategory and subcategory != "?"
                else category
            )
            description_raw = f"Incident: {inc_num}\nCategory: {category}\nSubcategory: {subcategory}\nSymptom: {symptom}"
            resolution_raw = (
                f"Resolution code: {closed_code}"
                if closed_code and closed_code != "?"
                else "Resolved — see incident log."
            )

            # Apply PII scrubbing
            title, _ = PIIScrubber.scrub(title_raw)
            description, _ = PIIScrubber.scrub(description_raw)
            resolution, _ = PIIScrubber.scrub(resolution_raw)

            ticket = Ticket(
                title=title[:200],
                description=description[:2000],
                owner_id="kaggle_importer",
                category=map_category(category + " " + subcategory),
                status="resolved",
                routing_status="classified",
                priority=priority,
                structured_payload=json.dumps(
                    {
                        "source": "vipulshinde_incident_log",
                        "incident_id": inc_num,
                        "resolution": resolution,
                        "resolved_at": resolved_at,
                    }
                ),
            )
            session.add(ticket)
            count += 1
    logger.info(f"[vipulshinde] Queued {count} tickets.")
    return count


# ─────────────────────────────────────────────────────────────────────────────
# Dataset 3: tobiasbueck — multilingual_tickets.csv
# Columns: subject, body, answer, type, queue, priority, language, tag_1..tag_8
# Note: 'answer' = rich resolution text — BEST for RAG context
# ─────────────────────────────────────────────────────────────────────────────


async def ingest_tobiasbueck(session: AsyncSession, file_path: Path, limit: int) -> int:
    """Ingest tobiasbueck multilingual customer support tickets (English only for RAG quality)."""
    logger.info(f"[tobiasbueck] Ingesting {file_path} ...")
    count = 0
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if count >= limit:
                break
            # Skip non-English for now to ensure LLM quality
            lang = str(row.get("language", "en")).strip().lower()
            if lang != "en":
                continue

            subject = str(row.get("subject", "")).strip()
            body = str(row.get("body", "")).strip()
            answer = str(row.get("answer", "")).strip()
            ticket_type = str(row.get("type", "")).strip()
            queue = str(row.get("queue", "")).strip()
            priority = map_priority(row.get("priority", "medium"))

            # Aggregate tags for category mapping
            tags = " ".join(
                [
                    str(row.get(f"tag_{i}", ""))
                    for i in range(1, 9)
                    if str(row.get(f"tag_{i}", "")).strip() not in ("", "nan", "NaN")
                ]
            )
            category_raw = f"{queue} {tags}".lower()

            if not subject or subject == "nan":
                continue

            # Apply PII scrubbing
            subject, _ = PIIScrubber.scrub(subject)
            body, _ = PIIScrubber.scrub(body)
            answer, _ = PIIScrubber.scrub(answer)

            ticket = Ticket(
                title=subject[:200],
                description=body[:2000],
                owner_id="kaggle_importer",
                category=map_category(category_raw),
                status="resolved",
                routing_status="classified",
                priority=priority,
                structured_payload=json.dumps(
                    {
                        "source": "tobiasbueck_multilingual",
                        "resolution": answer[:1500],  # ← KEY for RAG retrieval
                        "ticket_type": ticket_type,
                        "queue": queue,
                        "tags": tags,
                    }
                ),
            )
            session.add(ticket)
            count += 1
    logger.info(f"[tobiasbueck] Queued {count} tickets.")
    return count


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────


async def get_existing_count(session: AsyncSession) -> int:
    result = await session.scalar(
        select(func.count(Ticket.id)).where(Ticket.owner_id == "kaggle_importer")
    )
    return result or 0


async def main():
    parser = argparse.ArgumentParser(
        description="Bulk ingest Kaggle datasets into TicketIQ"
    )
    parser.add_argument(
        "--limit", type=int, default=100, help="Max tickets per dataset (default: 100)"
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/kaggle",
        help="Path to Kaggle CSV directory",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete existing kaggle_importer tickets first",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        existing = await get_existing_count(session)
        if existing > 0 and not args.clear:
            logger.info(
                f"⚠  {existing} kaggle_importer tickets already exist. Use --clear to re-ingest or --limit to add more."
            )
        elif args.clear:
            from sqlalchemy import delete

            await session.execute(
                delete(Ticket).where(Ticket.owner_id == "kaggle_importer")
            )
            await session.commit()
            logger.info("🗑  Cleared existing kaggle_importer tickets.")

        total = 0

        # Dataset 1
        p1 = data_dir / "it_tickets.csv"
        if p1.exists():
            total += await ingest_adisongoh(session, p1, args.limit)
        else:
            logger.warning(f"Missing: {p1}")

        # Dataset 2
        p2 = data_dir / "incident_log.csv"
        if p2.exists():
            total += await ingest_vipulshinde(session, p2, args.limit)
        else:
            logger.warning(f"Missing: {p2}")

        # Dataset 3 (richest resolution data)
        p3 = data_dir / "multilingual_tickets.csv"
        if p3.exists():
            total += await ingest_tobiasbueck(session, p3, args.limit)
        else:
            logger.warning(f"Missing: {p3}")

        await session.commit()
        logger.info(f"✅ Ingested {total} tickets from Kaggle datasets.")
        logger.info(
            "   Next step: run  python scripts/utils/populate_vector_store.py  to vectorize them."
        )


if __name__ == "__main__":
    asyncio.run(main())
