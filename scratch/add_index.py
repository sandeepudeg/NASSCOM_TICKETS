import sqlite3
import os

db_path = "tickets.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS ix_tickets_routing_status ON tickets (routing_status);"
        )
        conn.commit()
        print("Index ix_tickets_routing_status created successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
