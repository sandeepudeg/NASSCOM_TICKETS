
import sqlite3
import uuid
import json
from datetime import datetime, timedelta

DB_PATH = "tickets.db"

def seed_demo_stability():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Clean existing demo data to avoid duplicates
    print("Cleaning existing demo escalations and alerts...")
    cursor.execute("DELETE FROM tickets WHERE owner_id = 'demo_system' AND routing_status = 'escalated'")
    cursor.execute("DELETE FROM pattern_alerts WHERE representative_title LIKE '%Widespread%' OR representative_title LIKE '%Company-wide%'")

    # 2. Seed Escalations
    print("Seeding demo Escalations...")
    escalations = [
        {
            "title": "Suspicious login attempts from multiple regions",
            "description": "User reported multiple MFA push notifications that they did not initiate. Source IPs are from varied international locations. Need security review to determine if this is a credential stuffing attack or a legitimate network sync issue.",
            "priority": "High"
        },
        {
            "title": "Internal portal extremely slow for remote employees",
            "description": "Remote users are reporting latency over 5000ms when accessing the main HR portal. Local office users report no issues. AI classified as Infrastructure but confidence is low (62%) due to potential VPN/Network routing issues.",
            "priority": "Medium"
        },
        {
            "title": "Corporate ID card not working for elevator",
            "description": "Employee ID #5532 reports that their badge works for the main door but fails for the north elevator. Ambiguity detected between Access Management (permissions) and Infrastructure (reader hardware).",
            "priority": "Low"
        }
    ]

    for i, esc in enumerate(escalations):
        ticket_id = str(uuid.uuid4())
        ticket_number = f"ESC-DEMO-{int(datetime.utcnow().timestamp())}-{i:02d}"
        cursor.execute("""
            INSERT INTO tickets (
                id, ticket_number, title, description, owner_id, 
                category, status, routing_status, confidence_score, 
                priority, source_channel, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id, ticket_number, esc['title'], esc['description'], 'system',
            'Security', 'open', 'escalated', 0.65,
            esc['priority'], 'web', datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))

    # 3. Seed Pattern Alerts
    print("Seeding demo Pattern Alerts...")
    alerts = [
        {
            "representative_title": "Widespread VPN Authentication Failure",
            "cluster_size": 28,
            "category": "Network",
            "ticket_ids": [str(uuid.uuid4()) for _ in range(5)]
        },
        {
            "representative_title": "Company-wide Email Delivery Delay",
            "cluster_size": 12,
            "category": "Application",
            "ticket_ids": [str(uuid.uuid4()) for _ in range(3)]
        }
    ]

    for alert in alerts:
        cursor.execute("""
            INSERT INTO pattern_alerts (
                id, cluster_size, representative_title, category, 
                time_window_days, ticket_ids_json, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), alert['cluster_size'], alert['representative_title'], alert['category'],
            1, json.dumps(alert['ticket_ids']), 'active', datetime.utcnow().isoformat()
        ))

    conn.commit()
    conn.close()
    print("Successfully seeded persistent demo data.")

if __name__ == "__main__":
    seed_demo_stability()
