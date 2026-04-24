from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from src.repositories.database import get_db
from src.repositories.models import Ticket
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard-summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    
    # 1. Hourly Distribution (Real Data)
    # We group tickets created in the last 24h by hour
    query = (
        select(
            func.date_trunc('hour', Ticket.created_at).label('hour'),
            func.count(Ticket.id).label('count')
        )
        .where(Ticket.created_at >= last_24h)
        .group_by('hour')
        .order_by('hour')
    )
    result = await db.execute(query)
    hourly_counts = {row.hour.hour: row.count for row in result}
    
    # Fill in missing hours with 0
    trend_data = []
    for i in range(24):
        hour_time = (last_24h + timedelta(hours=i)).hour
        trend_data.append({
            "name": f"{hour_time:02d}:00",
            "value": hourly_counts.get(hour_time, 0)
        })

    # 2. Average Sentiment (Real Data)
    sentiment_query = select(func.avg(Ticket.sentiment_score)).where(Ticket.sentiment_score.isnot(None))
    sentiment_result = await db.execute(sentiment_query)
    avg_sentiment = sentiment_result.scalar() or 0.5
    
    # 3. Throughput (Tickets per hour in last 24h)
    total_24h = sum(hourly_counts.values())
    throughput = round(total_24h / 24, 1)

    return {
        "trend_24h": trend_data,
        "avg_sentiment_percent": round(avg_sentiment * 100),
        "throughput_per_hour": throughput,
        "system_status": "Optimal"
    }
