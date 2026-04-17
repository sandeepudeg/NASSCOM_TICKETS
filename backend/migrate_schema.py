import sqlite3
import os

db_path = "d:/Learning/Self_learning/Nasscom/Tickets/backend/tickets.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding 'resolution_root_cause' column...")
    cursor.execute("ALTER TABLE tickets ADD COLUMN resolution_root_cause TEXT")
    print("Column 'resolution_root_cause' added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column 'resolution_root_cause' already exists.")
    else:
        print(f"Error adding 'resolution_root_cause': {e}")

try:
    print("Adding 'is_automation_candidate' column...")
    cursor.execute("ALTER TABLE tickets ADD COLUMN is_automation_candidate BOOLEAN DEFAULT 0 NOT NULL")
    print("Column 'is_automation_candidate' added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column 'is_automation_candidate' already exists.")
    else:
        print(f"Error adding 'is_automation_candidate': {e}")

conn.commit()
conn.close()
print("Migration complete.")
