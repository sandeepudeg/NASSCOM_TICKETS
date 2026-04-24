import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, delete
from src.repositories.database import async_session_maker
from src.repositories.models import Ticket, Folder, TicketFolderAssignment, PatternAlert, SimilarTicket

# 7 Categories
CATEGORIES = [
    "Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access Management"
]

# Templates for realistic Kaggle-style data
TEMPLATES = {
    "Infrastructure": [
        "Server cluster {id} high CPU usage warning",
        "VPC Peering connection {id} dropped packets detected",
        "Load Balancer {id} health check failures in Region-B",
        "Auto-scaling group failed to provision new instances for {id}",
        "CloudFormation stack {id} rollback in production",
        "Kubernetes node {id} status: NotReady",
        "SSL certificate for internal endpoint {id} expiring in 3 days"
    ],
    "Application": [
        "Payment gateway 500 status on /checkout/{id}",
        "User session timeout issue on mobile app version {id}",
        "API Latency increased for /v1/products/list - {id}",
        "GraphQL fragment resolution error on frontend {id}",
        "Image processing service hung on task {id}",
        "Search index sync delay for catalog {id}",
        "Webhook delivery failure for partner-ID {id}"
    ],
    "Security": [
        "Unusual login activity detected for account {id}",
        "Credential stuffing attempt blocked on IP range {id}.0.0/16",
        "Unauthorized S3 bucket policy modification on {id}",
        "IAM Role {id} elevated permissions alert",
        "Suspected phishing email campaign reported by {id}",
        "WAF blocked SQL injection attempt on endpoint {id}",
        "Brute force attempt on SSH port {id} detected"
    ],
    "Database": [
        "Postgres slow query optimization needed for {id}",
        "Database backup failure for instance {id} on S3",
        "MariaDB slave lag exceeded 300 seconds on {id}",
        "Connection pool exhaustion on microservice {id}",
        "Query timeout on reporting dashboard {id}",
        "Database deadlock detected in transaction {id}",
        "Schema migration failed for {id} in production"
    ],
    "Storage": [
        "S3 bucket {id} access denied for service role",
        "Disk space low (95%) on shared drive {id}",
        "EFS mount failure on instance {id}",
        "Glacier retrieval job {id} failed",
        "RAID array degraded on storage node {id}",
        "IOPS limit reached on volume {id}",
        "Object lifecycle policy not applying to {id}"
    ],
    "Network": [
        "Wireless AP {id} offline in South Wing",
        "VPN tunnel {id} status changed to Down",
        "BGP prefix flap detected for Peer {id}",
        "Network latency spike on backbone link {id}",
        "DNS resolution failure for internal host {id}",
        "Firewall rule block on port {id} causing service outage",
        "Core switch {id} fans failure alarm"
    ],
    "Access Management": [
        "Password reset requested for executive account {id}",
        "New employee AD account creation for user {id}",
        "Role-based access change request for team {id}",
        "MFA device reset for user {id}",
        "SAML integration error with provider {id}",
        "Leaver account deactivation for user {id}",
        "Permission escalation request for project {id}"
    ]
}

async def seed_enterprise_data():
    print("Starting enterprise data seeding...")
    ADMIN_IDS = ["admin", "system"] # Seed for both to ensure UI visibility
    async with async_session_maker() as session:
        # 1. Clear existing demo data
        print("Cleaning old data...")
        await session.execute(delete(TicketFolderAssignment))
        await session.execute(delete(PatternAlert))
        await session.execute(delete(SimilarTicket))
        await session.execute(delete(Ticket))
        await session.commit()

        # 2. Reset departmental folders to ensure zero duplicates
        print(f"Recreating departmental folders for {ADMIN_IDS}...")
        await session.execute(delete(Folder))
        await session.commit()
        
        folder_map = {} # owner:category -> id
        for owner in ADMIN_IDS:
            for cat in CATEGORIES:
                folder_id = str(uuid.uuid4())
                new_folder = Folder(
                    id=folder_id,
                    name=cat,
                    owner_id=owner,
                    version=1
                )
                session.add(new_folder)
                folder_map[f"{owner}:{cat}"] = folder_id
        
        await session.flush()

        tickets_total = 300
        tickets_per_cat = tickets_total // len(CATEGORIES)
        
        all_tickets = []
        
        # 3. Generate 300 tickets
        print(f"Generating {tickets_total} tickets across {len(CATEGORIES)} categories...")
        for category in CATEGORIES:
            for i in range(tickets_per_cat):
                # Random timestamp within last 7 days
                days_ago = random.uniform(0, 7)
                created_at = datetime.utcnow() - timedelta(days=days_ago)
                
                status = random.choice(["open", "in_progress", "resolved", "closed"])
                priority = random.choice(["Low", "Medium", "High", "Critical"])
                
                is_automation = (i < 10) # Force first 10 in every category to be automation-ready
                has_report = is_automation or (random.random() < 0.1)
                
                template = random.choice(TEMPLATES[category])
                ticket_id_str = f"{category[:3]}-{1000 + i}"
                title = template.format(id=ticket_id_str)
                
                res_steps = None
                root_cause = None
                if has_report:
                    res_steps = json.dumps([
                        "1. Identify affected component via monitoring logs.",
                        "2. Verify recent configuration changes in Git audit trail.",
                        "3. Restart microservice instances sequentially.",
                        "4. Validate health check status across all nodes."
                    ])
                    root_cause = f"The issue was triggered by a race condition in {category} microservice during peak traffic load."

                # New Industrial Metrics
                s_score = round(random.uniform(0.1, 0.9), 2)
                i_score = round(random.uniform(0.3, 0.95), 2)
                
                ticket = Ticket(
                    id=str(uuid.uuid4()),
                    ticket_number=f"TICK-{category[:3].upper()}-{1000 + i}",
                    title=title,
                    description=f"Automated alert detected for {title}. Investigation required for {category} department. Metric: latency > 500ms.",
                    owner_id="admin", # Keep tickets owned by admin primarily
                    category=category,
                    status=status,
                    routing_status="classified" if status == "open" else "reviewed",
                    source_channel="web",
                    priority=priority,
                    confidence_score=round(random.uniform(0.75, 0.99), 2),
                    is_automation_candidate=is_automation,
                    resolution_steps_json=res_steps,
                    resolution_root_cause=root_cause,
                    sentiment_score=s_score,
                    impact_score=i_score,
                    intelligence_priority="urgent" if (s_score > 0.7 or i_score > 0.8) else "high" if (s_score > 0.5) else "medium",
                    complexity_score=random.randint(1, 4),
                    automation_status="none",
                    created_at=created_at,
                    updated_at=created_at + timedelta(minutes=random.randint(10, 1000))
                )
                
                session.add(ticket)
                all_tickets.append(ticket)
        
        await session.flush() # Sync IDs
        print("Tickets generated. Creating folder assignments for both admin and system...")
        
        # 4. Create Folder Assignments for BOTH to ensure visibility
        for t in all_tickets:
            for owner in ADMIN_IDS:
                folder_id = folder_map.get(f"{owner}:{t.category}")
                if folder_id:
                    session.add(TicketFolderAssignment(ticket_id=t.id, folder_id=folder_id))

        # 5. Create Pattern Clusters (Simulated Outages)
        print("Creating pattern alerts (Clusters)...")
        patterns = [
            ("Infrastructure", "Core Switch Cluster Failure - Region-A", ["TICK-INF-1001", "TICK-INF-1002", "TICK-INF-1003", "TICK-INF-1004", "TICK-INF-1005"]),
            ("Security", "Credential Stuffing Pattern on Auth APIs", ["TICK-SEC-1010", "TICK-SEC-1011", "TICK-SEC-1012", "TICK-SEC-1013"]),
            ("Network", "Regional CDN Outage - CloudFront Intermittent", ["TICK-NET-1005", "TICK-NET-1006", "TICK-NET-1007", "TICK-NET-1008", "TICK-NET-1009"])
        ]
        
        for cat, title, numbers in patterns:
            # Link to actual tickets
            ids = [t.id for t in all_tickets if t.ticket_number in numbers]
            if ids:
                alert = PatternAlert(
                    cluster_size=len(ids),
                    representative_title=title,
                    category=cat,
                    time_window_days=7,
                    ticket_ids_json=json.dumps(ids),
                    status="active",
                    created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                )
                session.add(alert)
        
        # 6. Create Correlations (Similar Tickets)
        print("Creating semantic correlations...")
        for i in range(50):
            t1 = random.choice(all_tickets)
            t2 = random.choice([t for t in all_tickets if t.category == t1.category and t.id != t1.id])
            
            sim = SimilarTicket(
                ticket_id=t1.id,
                similar_ticket_id=t2.id,
                title=t2.title,
                category=t2.category,
                resolution_summary=t2.resolution_root_cause or "No resolution recorded yet.",
                similarity_score=round(random.uniform(0.85, 0.98), 2)
            )
            session.add(sim)

        await session.commit()
        print(f"Success! 300 tickets seeded for 'admin' across all 7 departments.")

if __name__ == "__main__":
    asyncio.run(seed_enterprise_data())
