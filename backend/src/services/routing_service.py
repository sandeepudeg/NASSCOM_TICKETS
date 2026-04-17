import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.folder_repository import FolderRepository
from src.repositories.models import Folder
from src.schemas.ticket import Category

logger = logging.getLogger(__name__)

class RoutingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.folder_repo = FolderRepository(session)

    async def get_or_create_department_folder(
        self, category: str, owner_id: str
    ) -> Folder:
        """
        Ensures a departmental folder exists for the given category.
        Standardizes naming as '[Category] Department'.
        """
        folder_name = f"{category} Department"
        
        # Check if folder already exists
        folder = await self.folder_repo.get_by_name(folder_name, owner_id)
        if not folder:
            logger.info(f"Creating department folder: {folder_name} for user {owner_id}")
            folder = await self.folder_repo.create(folder_name, owner_id)
            
        return folder

    async def get_routing_status_message(self, ticket_id: str, category: str) -> str:
        """Returns a string describing the current routing state."""
        return f"Ticket {ticket_id} has been transferred and routed to the {category} Department."

routing_service = RoutingService
