import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Notification

logger = structlog.get_logger("services.notification")

class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_notification(
        self,
        user_id: str,
        notif_type: str,
        title: str,
        message: str,
        ticket_id: str | None = None
    ) -> Notification:
        """
        Creates a new notification for a specific user.
        """
        notif = Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            ticket_id=ticket_id
        )
        self.session.add(notif)
        await self.session.commit()
        await self.session.refresh(notif)
        
        logger.info("notification.created", user_id=user_id, type=notif_type, ticket_id=ticket_id)
        return notif

    async def list_notifications(self, user_id: str, unread_only: bool = False) -> list[Notification]:
        """
        Lists notifications for a user.
        """
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        
        stmt = stmt.order_by(Notification.created_at.desc()).limit(50)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def mark_as_read(self, notification_id: str, user_id: str):
        """
        Marks a specific notification as read.
        """
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def mark_all_as_read(self, user_id: str):
        """
        Marks all notifications for a user as read.
        """
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        await self.session.execute(stmt)
        await self.session.commit()
