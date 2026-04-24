import sqlite3

DB_PATH = "backend/tickets.db"

def cleanup_test_data():
    print(f"Connecting to {DB_PATH} for cleanup...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Target tickets with the specific test description and ticket number pattern
    query = "DELETE FROM tickets WHERE description LIKE '%Automated test ticket for domain%' AND ticket_number LIKE 'TKT-%'"
    
    try:
        cursor.execute(query)
        rows_deleted = cursor.rowcount
        conn.commit()
        print(f"Cleanup successful. Deleted {rows_deleted} test tickets.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup_test_data()
