import os
import sqlite3
import uuid
from datetime import datetime

DB_PATH = "tickets.db"

CATEGORIES = [
    "Infrastructure",
    "Application",
    "Security",
    "Database",
    "Storage",
    "Network",
    "Access Management",
]


def organize():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Ensure Departmental Folders Exist
    folder_map = {}  # category -> folder_id
    for cat in CATEGORIES:
        folder_name = f"{cat} Department"
        cursor.execute("SELECT id FROM folders WHERE name = ?", (folder_name,))
        row = cursor.fetchone()
        if row:
            folder_map[cat] = row[0]
            print(f"Folder already exists: {folder_name}")
        else:
            folder_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            cursor.execute(
                """
                INSERT INTO folders (id, name, owner_id, created_at, updated_at, version)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                (folder_id, folder_name, "system", now, now, 1),
            )
            folder_map[cat] = folder_id
            print(f"Created folder: {folder_name}")

    # 2. Bulk Assign Kaggle Tickets
    cursor.execute(
        "SELECT id, category FROM tickets WHERE owner_id = 'kaggle_importer'"
    )
    tickets = cursor.fetchall()
    print(f"Total Kaggle tickets found: {len(tickets)}")

    assigned_count = 0
    already_assigned = 0
    for ticket_id, category in tickets:
        if not category or category not in folder_map:
            # Fallback to general if category is weird (shouldn't happen with our seed)
            category = "Application"

        folder_id = folder_map[category]

        # Check if already assigned to this folder
        cursor.execute(
            "SELECT 1 FROM ticket_folder_assignments WHERE ticket_id = ? AND folder_id = ?",
            (ticket_id, folder_id),
        )
        if cursor.fetchone():
            already_assigned += 1
            continue

        assignment_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO ticket_folder_assignments (id, ticket_id, folder_id, assigned_at)
            VALUES (?, ?, ?, ?)
        """,
            (assignment_id, ticket_id, folder_id, datetime.utcnow().isoformat()),
        )
        assigned_count += 1

    conn.commit()
    conn.close()
    print(
        f"Organization complete! Newly assigned: {assigned_count}, Already assigned: {already_assigned}"
    )


if __name__ == "__main__":
    organize()
