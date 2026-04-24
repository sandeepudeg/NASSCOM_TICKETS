import json
import sqlite3
import uuid
import random
from datetime import datetime, timedelta

DB_PATH = "backend/tickets.db"

DOMAINS = {
    "Security": [
        "Unauthorized access attempt detected from IP {ip}",
        "MFA code not received for user {user}",
        "Suspicious password reset request for {email}",
        "Antivirus detected Trojan in temporary folder",
        "Encrypted file found in shared drive with no owner",
        "User {user} reported a phishing email impersonating CEO",
        "Door access control failed for server room",
        "API key exposed in public GitHub repository",
        "Brute force attack blocked on VPN gateway",
        "Data export limit exceeded for user {user}"
    ],
    "Infrastructure": [
        "Server {server} is non-responsive after reboot",
        "Disk space critical on {server} (98% full)",
        "CPU spikes detected on database cluster",
        "Memory leak suspected in background processing service",
        "UPS battery backup failure in rack {rack}",
        "Hardware clock drift detected on {server}",
        "Virtual machine migration failed on host {host}",
        "Cold aisle temperature exceeding 25C",
        "Redundant power supply failure in storage array",
        "ZFS pool status is DEGRADED"
    ],
    "Network": [
        "Slow internet connectivity reported in {region} office",
        "VPN connection drops every 10 minutes",
        "DNS resolution failing for internal domain {domain}",
        "Wireless access point {ap} is offline",
        "Packet loss detected between office and data center",
        "Firewall blocking legitimate traffic to {service}",
        "VLAN tagging issue on port {port}",
        "BGP session down with ISP {isp}",
        "IP address conflict detected for {ip}",
        "VoIP calls dropping in the executive conference room"
    ],
    "Application": [
        "Dashboard failing to load with 500 error",
        "Export to Excel functionality is broken",
        "Search results not appearing for {query}",
        "Application slow for users in {region}",
        "Database connection timeout in {service}",
        "Mobile app crashing on iOS 17",
        "User cannot see 'Admin' tab despite permissions",
        "File upload fails for files larger than 10MB",
        "Report generation stuck at 50%",
        "Email notifications not being sent"
    ],
    "HR/Payroll": [
        "Salary slip for {month} contains incorrect deductions",
        "Employee {user} requesting leave for family emergency",
        "New hire onboarding documents pending for {user}",
        "Insurance claim status update needed for {id}",
        "Bank account change request for payroll",
        "Performance review system is locked for manager {user}",
        "Remote work allowance not applied to {month} paycheck",
        "Tax form {form} missing from employee portal",
        "Resignation notice submitted by {user}",
        "Employee referral bonus not paid for {user}"
    ]
}

USERS = ["Sandeep", "Admin", "JohnDoe", "SarahSmith", "System", "SupportAgent"]
REGIONS = ["Mumbai", "London", "New York", "Singapore", "Berlin"]
SERVERS = ["DB-PROD-01", "APP-WEB-02", "STOR-NAS-05", "VCENTER-MGMT"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
CHANNELS = ["web", "email", "api", "slack", "phone"]

def generate_random_ticket(domain):
    template = random.choice(DOMAINS[domain])
    title = template.format(
        ip=f"192.168.1.{random.randint(1,255)}",
        user=random.choice(USERS),
        email=f"user{random.randint(100,999)}@example.com",
        server=random.choice(SERVERS),
        rack=f"R{random.randint(1,20)}",
        host=f"HOST-{random.randint(1,10)}",
        region=random.choice(REGIONS),
        domain="internal.corp",
        ap=f"AP-{random.randint(1,50)}",
        service="AuthService",
        port=random.randint(1,24),
        isp="Verizon",
        query="Annual Report",
        month="October",
        id=f"CLAIM-{random.randint(1000,9999)}",
        form="W2"
    )
    
    description = f"Automated test ticket for domain {domain}. " + \
                  "Detailed investigation required to resolve this " + \
                  f"issue reported via {random.choice(CHANNELS)}. " + \
                  f"Context: The user reported this during {random.choice(REGIONS)} business hours."
    
    return {
        "id": str(uuid.uuid4()),
        "ticket_number": f"TKT-{random.randint(100000, 999999)}",
        "title": title,
        "description": description,
        "category": domain,
        "priority": random.choice(PRIORITIES),
        "status": "open",
        "owner_id": random.choice(USERS),
        "source_channel": random.choice(CHANNELS),
        "confidence_score": round(random.uniform(0.6, 0.99), 2)
    }

def seed_cross_domain_data(count=300):
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Generating {count} tickets across {len(DOMAINS)} domains...")
    
    tickets_to_insert = []
    domain_list = list(DOMAINS.keys())
    
    for i in range(count):
        domain = domain_list[i % len(domain_list)]
        ticket = generate_random_ticket(domain)
        
        # Randomize created_at over the last 30 days
        days_ago = random.randint(0, 30)
        created_at = (datetime.utcnow() - timedelta(days=days_ago)).isoformat()
        
        tickets_to_insert.append((
            ticket["id"],
            ticket["ticket_number"],
            ticket["title"],
            ticket["description"],
            ticket["owner_id"],
            ticket["category"],
            ticket["status"],
            "triage", # Default routing status
            ticket["confidence_score"],
            ticket["priority"],
            ticket["source_channel"],
            created_at,
            created_at
        ))

    cursor.executemany("""
        INSERT INTO tickets (
            id, ticket_number, title, description, owner_id, 
            category, status, routing_status, confidence_score, 
            priority, source_channel, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tickets_to_insert)

    conn.commit()
    conn.close()
    print(f"Successfully inserted {count} tickets into {DB_PATH}.")

if __name__ == "__main__":
    seed_cross_domain_data(300)
