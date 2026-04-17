import os
import sqlite3

db_path = "tickets.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN ticket_number TEXT;")
        conn.commit()
        print("Column ticket_number added successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
