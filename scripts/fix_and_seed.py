import sqlite3
import pandas as pd
import json
import uuid
import os
from datetime import datetime

KAGGLE_PATH = (
    r"d:\Learning\Self_learning\Nasscom\Tickets\data\kaggle\multilingual_tickets.csv"
)
DB_PATH = "tickets.db"


def fix_and_seed():
    if not os.path.exists(KAGGLE_PATH):
        print(f"Error: Kaggle dataset not found at {KAGGLE_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Fix Schema
    print("Checking for source_channel column...")
    cursor.execute("PRAGMA table_info(tickets)")
    columns = [col[1] for col in cursor.fetchall()]
    if "source_channel" not in columns:
        print("Adding source_channel column...")
        cursor.execute(
            "ALTER TABLE tickets ADD COLUMN source_channel VARCHAR(50) DEFAULT 'web' NOT NULL"
        )
        conn.commit()
    else:
        print("source_channel column already exists.")

    # 2. Load Data
    print("Loading Kaggle dataset...")
    df = pd.read_csv(KAGGLE_PATH)
    df_en = df[df["language"] == "en"].dropna(subset=["answer", "tag_1"])
    sampled_df = df_en.head(300)

    # 3. Cleanup
    print("Cleaning existing kaggle tickets...")
    cursor.execute("DELETE FROM tickets WHERE owner_id = 'kaggle_importer'")
    conn.commit()

    # 4. Ingest
    print(f"Inserting {len(sampled_df)} tickets...")
    added = 0
    for i, row in sampled_df.iterrows():
        try:
            ticket_id = str(uuid.uuid4())
            ts = int(datetime.utcnow().timestamp())
            ticket_number = f"KAG-{ts}-{i:04d}"
            title = str(row["subject"])[:500]
            description = str(row["body"])
            resolution = str(row["answer"])

            # Simple Category Mapping
            tag = str(row["tag_1"]).lower()
            category = "Application"
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
        except Exception:
            # Silence most errors to keep log clean
            pass

    conn.commit()
    conn.close()
    print(f"Successfully seeded {added} resolved tickets for the Intelligence Report.")


if __name__ == "__main__":
    fix_and_seed()
