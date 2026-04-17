from datetime import datetime
from typing import Optional, Any
from uuid import uuid4
import json

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.models import AuditLog, PatternAlert, AgentOverride


class AuditLogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        actor_user_id: str,
        action_type: str,
        target_resource_id: str,
        source_ip: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=str(uuid4()),
            actor_user_id=actor_user_id,
            action_type=action_type,
            target_resource_id=target_resource_id,
            timestamp=datetime.utcnow(),
            source_ip=source_ip,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def list_logs(
        self,
        actor_user_id: Optional[str] = None,
        action_type: Optional[str] = None,
        target_resource_id: Optional[str] = None,
        page_size: int = 50,
        cursor: Optional[str] = None,
    ) -> tuple[list[AuditLog], Optional[str]]:
        query = select(AuditLog)

        if actor_user_id:
            query = query.where(AuditLog.actor_user_id == actor_user_id)
        if action_type:
            query = query.where(AuditLog.action_type == action_type)
        if target_resource_id:
            query = query.where(AuditLog.target_resource_id == target_resource_id)

        query = query.order_by(AuditLog.timestamp.desc()).limit(page_size + 1)

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            query = query.where(AuditLog.timestamp < cursor_time)

        result = await self.session.execute(query)
        logs = list(result.scalars().all())

        next_cursor = None
        if len(logs) > page_size:
            logs = logs[:page_size]
            next_cursor = logs[-1].timestamp.isoformat()

        return logs, next_cursor


class PatternAlertRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        cluster_size: int,
        representative_title: str,
        category: str,
        time_window_days: int,
        ticket_ids: list[str],
    ) -> PatternAlert:
        alert = PatternAlert(
            id=str(uuid4()),
            cluster_size=cluster_size,
            representative_title=representative_title,
            category=category,
            time_window_days=time_window_days,
            ticket_ids_json=json.dumps(ticket_ids),
            status="active",
            created_at=datetime.utcnow(),
        )
        self.session.add(alert)
        await self.session.flush()
        return alert

    async def get_by_id(self, alert_id: str) -> Optional[PatternAlert]:
        query = select(PatternAlert).where(PatternAlert.id == alert_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_active(self, page_size: int = 50) -> list[PatternAlert]:
        query = (
            select(PatternAlert)
            .where(PatternAlert.status == "active")
            .order_by(PatternAlert.cluster_size.desc())
            .limit(page_size)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_status(
        self,
        alert: PatternAlert,
        status: str,
        snooze_until: Optional[datetime] = None,
    ) -> PatternAlert:
        alert.status = status
        if snooze_until:
            alert.snooze_until = snooze_until
        if status == "acknowledged":
            alert.acknowledged_at = datetime.utcnow()
        await self.session.flush()
        return alert


class AgentOverrideRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        ticket_id: str,
        original_category: str,
        corrected_category: str,
        agent_user_id: str,
    ) -> AgentOverride:
        override = AgentOverride(
            id=str(uuid4()),
            ticket_id=ticket_id,
            original_category=original_category,
            corrected_category=corrected_category,
            agent_user_id=agent_user_id,
            timestamp=datetime.utcnow(),
        )
        self.session.add(override)
        await self.session.flush()
        return override

    async def count(self) -> int:
        query = select(func.count(AgentOverride.id))
        result = await self.session.execute(query)
        return result.scalar()

    async def list_recent(self, limit: int = 100) -> list[AgentOverride]:
        query = (
            select(AgentOverride).order_by(AgentOverride.timestamp.desc()).limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
