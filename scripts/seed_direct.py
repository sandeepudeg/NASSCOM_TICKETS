import json
import os
import sqlite3
import uuid
from datetime import datetime

import pandas as pd

KAGGLE_PATH = (
    r"d:\Learning\Self_learning\Nasscom\Tickets\data\kaggle\multilingual_tickets.csv"
)
DB_PATH = "tickets.db"


def seed_direct():
    if not os.path.exists(KAGGLE_PATH):
        print(f"Error: Kaggle dataset not found at {KAGGLE_PATH}")
        return

    print("Loading Kaggle dataset...")
    df = pd.read_csv(KAGGLE_PATH)
    df_en = df[df["language"] == "en"].dropna(subset=["answer", "tag_1"])
    sampled_df = df_en.head(300)

    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Cleaning existing kaggle tickets...")
    cursor.execute("DELETE FROM tickets WHERE owner_id = 'kaggle_importer'")

    print(f"Inserting {len(sampled_df)} tickets...")
    added = 0
    for i, row in sampled_df.iterrows():
        try:
            ticket_id = str(uuid.uuid4())
            ticket_number = f"KAG-{int(datetime.utcnow().timestamp())}-{i:04d}"
            title = str(row["subject"])[:500]
            description = str(row["body"])
            resolution = str(row["answer"])
            category = "Application"  # Simple default for testing

            # Category Mapping
            tag = str(row["tag_1"]).lower()
            if "security" in tag:
                category = "Security"
            elif "infra" in tag or "hardware" in tag:
                category = "Infrastructure"
            elif "access" in tag or "account" in tag:
                category = "Access Management"
            elif "network" in tag:
                category = "Network"
            elif "database" in tag:
                category = "Database"
            elif "storage" in tag:
                category = "Storage"

            cursor.execute(
                """
                INSERT INTO tickets (
                    id, ticket_number, title, description, owner_id, 
                    category, status, routing_status, confidence_score, 
                    priority, source_channel, structured_payload, 
                    created_at, updated_at, resolved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    ticket_id,
                    ticket_number,
                    title,
                    description,
                    "kaggle_importer",
                    category,
                    "resolved",
                    "classified",
                    0.95,
                    "medium",
                    "email",
                    json.dumps({"resolution": resolution}),
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                ),
            )
            added += 1
        except Exception as e:
            print(f"Error on row {i}: {e}")

    conn.commit()
    conn.close()
    print(f"Successfully seeded {added} tickets.")


if __name__ == "__main__":
    seed_direct()
