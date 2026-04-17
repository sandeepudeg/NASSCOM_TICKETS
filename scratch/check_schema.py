import sqlite3


def check_schema():
    try:
        conn = sqlite3.connect("backend/tickets.db")
        cursor = conn.cursor()

        # Check mapping_configs
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='mapping_configs'"
        )
        if cursor.fetchone():
            print("Table 'mapping_configs' exists.")

        # Check tickets columns
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Tickets columns: {columns}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_schema()
