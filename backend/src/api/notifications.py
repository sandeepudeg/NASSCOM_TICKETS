from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.database import get_db
from src.services.notification_service import NotificationService
from src.schemas.errors import ProblemDetail

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
async def list_notifications(
    unread_only: bool = False,
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """
    List notifications for the current user.
    """
    service = NotificationService(db)
    return await service.list_notifications(x_user_id, unread_only)

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a notification as read.
    """
    service = NotificationService(db)
    await service.mark_as_read(notification_id, x_user_id)
    return {"status": "ok"}

@router.post("/read-all")
async def mark_all_as_read(
    x_user_id: str = Header(default="system"),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all notifications for the current user as read.
    """
    service = NotificationService(db)
    await service.mark_all_as_read(x_user_id)
    return {"status": "ok"}
