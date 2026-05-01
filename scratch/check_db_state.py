import sqlite3
import json

def check_db():
    conn = sqlite3.connect('tickets.db')
    cursor = conn.cursor()
    
    # Check tickets count
    cursor.execute("SELECT COUNT(*) FROM tickets")
    ticket_count = cursor.fetchone()[0]
    print(f"Total tickets: {ticket_count}")
    
    # Check tickets with embeddings
    cursor.execute("SELECT COUNT(*) FROM tickets WHERE embedding IS NOT NULL")
    embedding_count = cursor.fetchone()[0]
    print(f"Tickets with embeddings: {embedding_count}")
    
    # Check pattern alerts count
    cursor.execute("SELECT COUNT(*) FROM pattern_alerts")
    alert_count = cursor.fetchone()[0]
    print(f"Total pattern alerts: {alert_count}")
    
    # Check active pattern alerts
    cursor.execute("SELECT COUNT(*) FROM pattern_alerts WHERE status = 'active'")
    active_alert_count = cursor.fetchone()[0]
    print(f"Active pattern alerts: {active_alert_count}")
    
    if active_alert_count > 0:
        cursor.execute("SELECT id, representative_title, cluster_size, ticket_ids_json FROM pattern_alerts WHERE status = 'active'")
        alerts = cursor.fetchall()
        for alert in alerts:
            print(f"Alert ID: {alert[0]}, Title: {alert[1]}, Size: {alert[2]}")
            ticket_ids = json.loads(alert[3])
            print(f"  Ticket IDs: {ticket_ids}")
            
    conn.close()

if __name__ == "__main__":
    check_db()
