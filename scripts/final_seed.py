
import asyncio
import os
import sys
import pandas as pd
from datetime import datetime
from uuid import uuid4
import json

# Add project root to path
sys.path.append(os.getcwd())

from src.repositories.database import async_session_maker
from src.repositories.models import Ticket
from src.schemas.ticket import Category, RoutingStatus, TicketStatus

KAGGLE_PATH = r"d:\Learning\Self_learning\Nasscom\Tickets\data\kaggle\multilingual_tickets.csv"

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

async def final_seed():
    if not os.path.exists(KAGGLE_PATH):
        print(f"Error: Kaggle dataset not found at {KAGGLE_PATH}")
        return

    print("Loading Kaggle dataset...")
    df = pd.read_csv(KAGGLE_PATH)
    
    # Filter for English and resolved tickets (those with answers)
    df_en = df[df['language'] == 'en'].dropna(subset=['answer', 'tag_1'])
    
    # Take a diverse sample
    sampled_df = df_en.groupby('tag_1').head(15).head(300)
    
    print(f"Importing {len(sampled_df)} tickets...")
    
    async with async_session_maker() as session:
        count = 0
        for _, row in sampled_df.iterrows():
            try:
                tag = row['tag_1']
                category_str = TAG_MAPPING.get(tag, "Application")
                
                title = str(row['subject'])[:500]
                description = str(row['body'])
                resolution = str(row['answer'])
                
                ticket_number = f"KAG-{int(datetime.utcnow().timestamp())}-{count:04d}"
                
                ticket = Ticket(
                    id=str(uuid4()),
                    ticket_number=ticket_number,
                    title=title,
                    description=description,
                    owner_id="system",
                    category=category_str,
                    status=TicketStatus.RESOLVED.value,
                    routing_status=RoutingStatus.CLASSIFIED.value,
                    confidence_score=0.90,
                    priority="medium",
                    source_channel="email",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    resolved_at=datetime.utcnow(),
                    structured_payload=json.dumps({"resolution": resolution})
                )
                
                session.add(ticket)
                await session.commit()
                count += 1
                if count % 20 == 0:
                    print(f"  Added {count} tickets...")
            except Exception as e:
                await session.rollback()
                # Skip error and continue
                continue
    
    print(f"\nFinal Seed Finished. Successfully added {count} tickets.")

if __name__ == "__main__":
    asyncio.run(final_seed())
