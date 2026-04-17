import sqlite3


def check():
    conn = sqlite3.connect("tickets.db")
    cursor = conn.cursor()

    # Check counts by status and intelligence population
    cursor.execute("""
        SELECT
            status,
            COUNT(id) as total,
            SUM(CASE WHEN resolution_steps_json IS NOT NULL THEN 1 ELSE 0 END) as has_resolution,
            SUM(CASE WHEN confidence_score > 0 THEN 1 ELSE 0 END) as has_confidence
        FROM tickets
        GROUP BY status
    """)
    stats = cursor.fetchall()
    print("Ticket Stats By Status:")
    for row in stats:
        print(
            f"Status: {row[0]}, Total: {row[1]}, Has Resolution: {row[2]}, Has Confidence: {row[3]}"
        )

    # Check similar_tickets table
    cursor.execute("SELECT COUNT(*) FROM similar_tickets")
    sim_count = cursor.fetchone()[0]
    print(f"\nSimilar Tickets Count (Total entries in relationship table): {sim_count}")

    # Sample a resolved ticket
    cursor.execute(
        "SELECT id, title, status, resolution_steps_json FROM tickets WHERE status='resolved' LIMIT 1"
    )
    sample = cursor.fetchone()
    if sample:
        print(f"\nSample Resolved Ticket: {sample[1]}")
        print(f"Resolution Steps: {sample[3]}")

    conn.close()


if __name__ == "__main__":
    check()
