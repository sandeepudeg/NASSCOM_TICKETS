import sqlite3
import uuid
from datetime import datetime
import os

DB_PATH = os.path.join(os.getcwd(), "backend", "tickets.db")

AUTOMATION_TICKETS = [
    {
        "title": "VPN Connection Timeout - GlobalProtect",
        "description": "Users in the Bangalore office are reporting intermittent timeouts when connecting to GlobalProtect VPN. Authentication succeeds but tunnel drops after 30 seconds.",
        "category": "Network",
        "confidence_score": 0.98,
        "is_repeated_issue": True
    },
    {
        "title": "Password Reset - SAP Production",
        "description": "Request for password reset in SAP Production environment due to account lockout after 3 failed attempts.",
        "category": "Access Management",
        "confidence_score": 0.99,
        "is_repeated_issue": True
    },
    {
        "title": "Disk Space Critical - DB Server 04",
        "description": "Log partition /var/log/syslog is at 98% capacity on db-prod-04. Alert triggered by Zabbix.",
        "category": "Infrastructure",
        "confidence_score": 0.97,
        "is_repeated_issue": False
    },
    {
        "title": "SSL Certificate Expiration - API Gateway",
        "description": "The SSL certificate for api.enterprise.com is expiring in 5 days. Need to renew and update the load balancer.",
        "category": "Security",
        "confidence_score": 0.96,
        "is_repeated_issue": True
    }
]

def seed_automation():
    print(f"Connecting to {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Seeding automation candidate tickets...")
    added = 0
    for i, data in enumerate(AUTOMATION_TICKETS):
        ticket_id = str(uuid.uuid4())
        ticket_number = f"AUTO-{int(datetime.utcnow().timestamp())}-{i:02d}"
        now = datetime.utcnow().isoformat()
        
        try:
            cursor.execute("""
                INSERT INTO tickets (
                    id, ticket_number, title, description, owner_id, 
                    category, status, routing_status, confidence_score, 
                    is_automation_candidate, is_repeated_issue,
                    priority, source_channel, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ticket_id,
                ticket_number,
                data['title'],
                data['description'],
                "admin",
                data['category'],
                "open",
                "classified",
                data['confidence_score'],
                1, # is_automation_candidate
                1 if data['is_repeated_issue'] else 0,
                "medium",
                "web",
                now,
                now
            ))
            added += 1
        except Exception as e:
            print(f"Error adding ticket {i}: {e}")

    conn.commit()
    conn.close()
    print(f"Successfully seeded {added} automation candidate tickets.")

if __name__ == "__main__":
    seed_automation()
