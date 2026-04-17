import sqlite3


def check_alembic_version():
    try:
        conn = sqlite3.connect("backend/tickets.db")
        cursor = conn.cursor()
        cursor.execute("SELECT version_num FROM alembic_version")
        row = cursor.fetchone()
        if row:
            print(f"Current version: {row[0]}")
        else:
            print("alembic_version table is empty")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_alembic_version()
