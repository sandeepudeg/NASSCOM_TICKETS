import sqlite3
import os

db_path = "d:/Learning/Self_learning/Nasscom/Tickets/backend/tickets.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

new_columns = [
    ("resolution_details", "TEXT"),
    ("hold_type", "VARCHAR(50)"),
    ("status_changed_at", "DATETIME")
]

for col_name, col_type in new_columns:
    try:
        print(f"Adding '{col_name}' column...")
        cursor.execute(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}")
        print(f"Column '{col_name}' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column '{col_name}' already exists.")
        else:
            print(f"Error adding '{col_name}': {e}")

# Initialize status_changed_at for existing tickets
cursor.execute("UPDATE tickets SET status_changed_at = created_at WHERE status_changed_at IS NULL")

conn.commit()
conn.close()
print("Enterprise flow migration complete.")
