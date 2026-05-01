import asyncio
import json
from src.repositories.database import async_session_maker
from src.repositories.ticket_repository import TicketRepository
from src.repositories.audit_repository import PatternAlertRepository
from src.ml.pattern_detection import pattern_detection_service

async def force_detect():
    async with async_session_maker() as session:
        ticket_repo = TicketRepository(session)
        alert_repo = PatternAlertRepository(session)
        
        # 1. Fetch tickets
        tickets = await ticket_repo.get_tickets_with_embeddings(limit=500)
        print(f"Fetched {len(tickets)} tickets with embeddings.")
        
        if not tickets:
            print("No tickets with embeddings found. Run fix_embeddings.py first.")
            return
            
        # 2. Detect
        new_alerts_data = await pattern_detection_service.detect_patterns(tickets)
        print(f"Detected {len(new_alerts_data)} patterns.")
        
        # 3. Save
        existing_alerts = await alert_repo.list_active(page_size=100)
        existing_titles = {a.representative_title for a in existing_alerts}
        print(f"Existing titles in DB: {existing_titles}")
        
        count = 0
        for alert_data in new_alerts_data:
            print(f"Checking pattern: {alert_data['representative_title']}")
            if alert_data["representative_title"] not in existing_titles:
                await alert_repo.create(
                    cluster_size=alert_data["cluster_size"],
                    representative_title=alert_data["representative_title"],
                    category=alert_data["category"],
                    time_window_days=alert_data["time_window_days"],
                    ticket_ids=alert_data["ticket_ids"]
                )
                count += 1
                print(f"  -> Added new pattern.")
            else:
                print(f"  -> Pattern already exists.")
        
        await session.commit()
        print(f"Saved {count} new patterns to database.")

if __name__ == "__main__":
    asyncio.run(force_detect())
