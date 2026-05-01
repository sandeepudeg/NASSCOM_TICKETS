
import asyncio
import random
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy import select
from src.repositories.database import async_session_maker, engine
from src.repositories.models import Ticket, Folder, TicketFolderAssignment, TicketEmbedding
from src.ml.embedding_service import embedding_service

CATEGORIES = ["Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access"]

TEMPLATES = {
    "Infrastructure": ["Server cluster {id} high CPU usage warning", "VPC Peering failure {id}", "Load Balancer {id} health failure"],
    "Application": ["Payment gateway 500 error /checkout/{id}", "User session timeout issue v{id}", "API Latency spike {id}"],
    "Security": ["Unusual login activity {id}", "Credential stuffing attempt {id}", "Unauthorized S3 access {id}"],
    "Database": ["Postgres slow query {id}", "Database backup failure {id}", "Connection pool exhausted {id}"],
    "Storage": ["S3 bucket {id} access denied", "Disk space low (95%) on {id}", "EFS mount failure {id}"],
    "Network": ["Wireless AP {id} offline", "VPN tunnel {id} status Down", "DNS resolution failure {id}"],
    "Access": ["Password reset for {id}", "New employee AD creation {id}", "MFA device reset {id}"]
}

async def seed_user_tickets():
    users = [f"user{i}" for i in range(1, 11)]
    tickets_per_user = 50
    
    async with async_session_maker() as session:
        try:
            print(f"Starting seeding for users: {users}")
            
            # 1. Ensure folders exist for each user
            for user_id in users:
                for cat in CATEGORIES:
                    stmt = select(Folder).where(Folder.name == cat, Folder.owner_id == user_id)
                    result = await session.execute(stmt)
                    if not result.scalar_one_or_none():
                        session.add(Folder(id=str(uuid.uuid4()), name=cat, owner_id=user_id))
            
            await session.flush()
            
            # 2. Get folder map for quick lookup
            stmt = select(Folder).where(Folder.owner_id.in_(users))
            result = await session.execute(stmt)
            all_folders = result.scalars().all()
            folder_map = {(f.owner_id, f.name): f.id for f in all_folders}
            
            # 3. Generate tickets
            for user_id in users:
                print(f"Generating {tickets_per_user} tickets for {user_id}...")
                for i in range(tickets_per_user):
                    cat = random.choice(CATEGORIES)
                    template = random.choice(TEMPLATES[cat])
                    ticket_id = str(uuid.uuid4())
                    title = template.format(id=f"{cat[:3]}-{user_id[-1]}-{1000+i}")
                    
                    ticket = Ticket(
                        id=ticket_id,
                        ticket_number=f"TICK-{cat[:3].upper()}-{user_id.upper()}-{1000+i}",
                        title=title,
                        description=f"Automated test ticket for {user_id} in category {cat}. Reference ID: {ticket_id}",
                        owner_id=user_id,
                        category=cat,
                        status=random.choice(["open", "in_progress", "resolved"]),
                        priority=random.choice(["High", "Medium", "Low"]),
                        confidence_score=round(random.uniform(0.7, 0.99), 2),
                        created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 100))
                    )
                    session.add(ticket)
                    
                    # Add assignment
                    fid = folder_map.get((user_id, cat))
                    if fid:
                        session.add(TicketFolderAssignment(id=str(uuid.uuid4()), ticket_id=ticket_id, folder_id=fid))
                    
                    # Add embedding (essential for many features)
                    full_text = f"{ticket.title}. {ticket.description}"
                    emb = embedding_service.get_embedding(full_text)
                    session.add(TicketEmbedding(
                        id=str(uuid.uuid4()),
                        ticket_id=ticket_id,
                        embedding=json.dumps(emb.tolist()),
                        model_version=embedding_service.model_name
                    ))
                
                await session.flush() # Flush per user to avoid massive single flush
            
            await session.commit()
            print("Successfully seeded 500 tickets (50 per user for user1-10).")
            
        except Exception as e:
            print(f"Error during seeding: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(seed_user_tickets())
