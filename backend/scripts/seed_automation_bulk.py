import asyncio
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from src.repositories.database import async_session_maker
from src.repositories.models import Ticket, Folder, TicketFolderAssignment

CATEGORIES = [
    "Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access Management"
]

TEMPLATES = {
    "Infrastructure": ["Server {id} reporting high IO wait", "Critical: AWS Zone {id} instability detected"],
    "Application": ["Service {id} Latency Spike", "App-Instance {id} memory leak"],
    "Security": ["Unauthorized access attempt on {id}", "MFA bypass lockout for {id}"],
    "Database": ["DB-Node {id} connection pool leak", "Slow query on cluster {id}"],
    "Storage": ["S3 bucket {id} replication lag", "Volume {id} near capacity (99%)"],
    "Network": ["VPN Gateway {id} tunnel down", "Core Switch {id} flapping"],
    "Access Management": ["Account {id} locked after failed MFA", "Emergency password reset for {id}"]
}

async def seed_automation_tickets():
    print("🚀 Seeding 30 automation-ready tickets with full schema compliance...")
    async with async_session_maker() as session:
        # Get folders map
        folders_res = await session.execute(select(Folder))
        folder_map = {f.name: f.id for f in folders_res.scalars().all()}
        
        count = 30
        new_tickets = []
        now = datetime.utcnow()
        
        for i in range(count):
            category = random.choice(CATEGORIES)
            template = random.choice(TEMPLATES[category])
            t_num = f"TICK-AUTO-{2000 + i}"
            title = template.format(id=t_num)
            
            ticket = Ticket(
                id=str(uuid.uuid4()),
                ticket_number=t_num,
                title=title,
                description=f"Actionable Alert for {title}. Automation engine detected remediation candidate.",
                owner_id="admin",
                category=category,
                status="open",
                routing_status="classified",
                source_channel="web",
                priority=random.choice(["High", "Critical"]),
                confidence_score=round(random.uniform(0.85, 0.99), 2),
                is_automation_candidate=True, # ALWAYS TRUE as requested
                is_repeated_issue=random.random() < 0.3,
                sentiment_score=round(random.uniform(0.1, 0.8), 2),
                impact_score=round(random.uniform(0.4, 0.9), 2),
                intelligence_priority=random.choice(["medium", "high", "urgent"]),
                complexity_score=random.randint(1, 4),
                automation_status="none",
                created_at=now - timedelta(minutes=random.randint(5, 500)),
                updated_at=now
            )
            
            session.add(ticket)
            new_tickets.append(ticket)
            
        await session.flush()
        
        # Folder assignments
        for t in new_tickets:
            # Note: folder names in the DB might be "Category" or "Category Department"
            # seed_enterprise_data uses "Category Department"
            folder_name = t.category
            fid = folder_map.get(folder_name)
            if not fid:
                fid = folder_map.get(f"{t.category} Department")
                
            if fid:
                assignment = TicketFolderAssignment(ticket_id=t.id, folder_id=fid)
                session.add(assignment)
                
        await session.commit()
        print(f"✅ Successfully added 30 automation-ready tickets (is_automation_candidate=True).")

if __name__ == "__main__":
    asyncio.run(seed_automation_tickets())
