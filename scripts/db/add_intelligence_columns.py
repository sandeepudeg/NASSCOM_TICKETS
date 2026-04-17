import os
import sqlite3

DB_PATH = "tickets.db"


def add_columns():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("accuracy", "FLOAT"),
        ("f1_score", "FLOAT"),
        ("semantic_similarity", "FLOAT"),
        ("resolution_steps_json", "TEXT"),
    ]

    print(f"Checking columns in {DB_PATH}...")
    cursor.execute("PRAGMA table_info(tickets)")
    existing_columns = [col[1] for col in cursor.fetchall()]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} ({col_type})...")
            try:
                cursor.execute(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added {col_name}.")
            except Exception as e:
                print(f"Failed to add {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Database schema update complete.")


if __name__ == "__main__":
    add_columns()
