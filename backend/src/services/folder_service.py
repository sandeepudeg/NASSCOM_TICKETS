import re

import structlog
from opentelemetry import trace
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.audit_repository import AuditLogRepository
from src.repositories.folder_repository import FolderRepository
from src.schemas.errors import HTTPError
from src.schemas.folder import (
    FolderCreate,
    FolderListResponse,
    FolderPaginationParams,
    FolderResponse,
    FolderStat,
    FolderStatsResponse,
    FolderUpdate,
)

logger = structlog.get_logger("services.folder")


class FolderService:
    MAX_FOLDERS_PER_USER = 500
    HTML_INJECTION_PATTERN = re.compile(
        r"<[^>]+>|\bjavascript:|on\w+\s*=", re.IGNORECASE
    )

    def __init__(self, session: AsyncSession):
        self.session = session
        self.folder_repo = FolderRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def create_folder(
        self, folder_data: FolderCreate, owner_id: str, source_ip: str | None = None
    ) -> FolderResponse:
        tracer = trace.get_tracer("services.folder")

        with tracer.start_as_current_span("folder.create") as span:
            name = folder_data.name.strip()
            span.set_attribute("folder.name_length", len(name))

            trace_id = span.get_span_context().trace_id
            span_id = span.get_span_context().span_id

            if not name:
                raise HTTPError.validation_error("Folder name cannot be empty")

            if len(name) > 255:
                raise HTTPError.validation_error(
                    "Folder name cannot exceed 255 characters"
                )

            if self.HTML_INJECTION_PATTERN.search(name):
                raise HTTPError.validation_error(
                    "Folder name contains invalid characters"
                )

            existing = await self.folder_repo.get_by_name(name, owner_id)
            if existing:
                raise HTTPError.conflict("Folder with this name already exists")

            count = await self.folder_repo.count_by_owner(owner_id)
            if count >= self.MAX_FOLDERS_PER_USER:
                raise HTTPError.bad_request(
                    f"Maximum folder limit ({self.MAX_FOLDERS_PER_USER}) reached"
                )

            folder = await self.folder_repo.create(name, owner_id)

            await self.audit_repo.create(
                actor_user_id=owner_id,
                action_type="folder_create",
                target_resource_id=folder.id,
                source_ip=source_ip,
                metadata={"folder_name": name},
            )

            span.set_attribute("folder.id", folder.id)
            span.set_attribute("folder.owner_id", owner_id)

            logger.info(
                "folder.created",
                trace_id=f"{trace_id:032x}",
                span_id=f"{span_id:016x}",
                service="folder-manager",
                folder_id=folder.id,
                folder_name=name,
                owner_id=owner_id,
            )

            return FolderResponse.model_validate(folder)

    async def get_folder(
        self, folder_id: str, owner_id: str, include_deleted: bool = False
    ) -> FolderResponse:
        folder = await self.folder_repo.get_by_id(folder_id, owner_id, include_deleted)
        if not folder:
            raise HTTPError.not_found("Folder not found")
        return FolderResponse.model_validate(folder)

    async def list_folders(
        self,
        owner_id: str,
        params: FolderPaginationParams,
    ) -> FolderListResponse:
        tracer = trace.get_tracer("services.folder")

        with tracer.start_as_current_span("folder.list") as span:
            folders, next_cursor = await self.folder_repo.list_folders(
                owner_id=owner_id,
                page_size=params.page_size,
                cursor=params.cursor,
                name_filter=params.name_filter,
                sort_by=params.sort_by,
                sort_dir=params.sort_dir,
                include_deleted=params.include_deleted,
            )

            folder_responses = [FolderResponse.model_validate(f) for f in folders]

            span.set_attribute("folder.count", len(folder_responses))
            span.set_attribute("folder.has_next", next_cursor is not None)

            return FolderListResponse(
                folders=folder_responses,
                next_cursor=next_cursor,
                total=len(folder_responses),
            )

    async def rename_folder(
        self,
        folder_id: str,
        folder_data: FolderUpdate,
        owner_id: str,
        source_ip: str | None = None,
    ) -> FolderResponse:
        tracer = trace.get_tracer("services.folder")

        with tracer.start_as_current_span("folder.rename") as span:
            folder = await self.folder_repo.get_by_id(folder_id, owner_id)
            if not folder:
                raise HTTPError.not_found("Folder not found")

            if folder.version != folder_data.version:
                raise HTTPError.conflict("Folder has been modified by another request")

            name = folder_data.name.strip()

            if not name:
                raise HTTPError.validation_error("Folder name cannot be empty")

            if len(name) > 255:
                raise HTTPError.validation_error(
                    "Folder name cannot exceed 255 characters"
                )

            if self.HTML_INJECTION_PATTERN.search(name):
                raise HTTPError.validation_error(
                    "Folder name contains invalid characters"
                )

            existing = await self.folder_repo.get_by_name(name, owner_id)
            if existing and existing.id != folder_id:
                raise HTTPError.conflict("Folder with this name already exists")

            old_name = folder.name
            folder = await self.folder_repo.update(folder, name)

            await self.audit_repo.create(
                actor_user_id=owner_id,
                action_type="folder_rename",
                target_resource_id=folder.id,
                source_ip=source_ip,
                metadata={"old_name": old_name, "new_name": name},
            )

            span.set_attribute("folder.id", folder_id)
            span.set_attribute("folder.old_name", old_name)
            span.set_attribute("folder.new_name", name)

            return FolderResponse.model_validate(folder)

    async def delete_folder(
        self,
        folder_id: str,
        owner_id: str,
        source_ip: str | None = None,
    ) -> None:
        tracer = trace.get_tracer("services.folder")

        with tracer.start_as_current_span("folder.delete") as span:
            folder = await self.folder_repo.get_by_id(folder_id, owner_id)
            if not folder:
                raise HTTPError.not_found("Folder not found")

            if folder.deleted_at:
                raise HTTPError.not_found("Folder already deleted")

            await self.folder_repo.delete_folder_assignments(folder_id)
            await self.folder_repo.soft_delete(folder)

            await self.audit_repo.create(
                actor_user_id=owner_id,
                action_type="folder_delete",
                target_resource_id=folder.id,
                source_ip=source_ip,
                metadata={"folder_name": folder.name},
            )

            span.set_attribute("folder.id", folder_id)
            span.set_attribute("folder.name", folder.name)

    async def get_folder_ticket_count(self, folder_id: str, owner_id: str) -> int:
        folder = await self.folder_repo.get_by_id(folder_id, owner_id)
        if not folder:
            raise HTTPError.not_found("Folder not found")

        from src.repositories.ticket_repository import TicketAssignmentRepository

        assignment_repo = TicketAssignmentRepository(self.session)
        return await assignment_repo.count_folder_tickets(folder_id)

    async def get_all_folder_stats(self, owner_id: str, ticket_owner_id: str | None = None) -> FolderStatsResponse:
        stats_list = await self.folder_repo.get_all_stats(owner_id, ticket_owner_id)

        stats = [FolderStat(**s) for s in stats_list]
        return FolderStatsResponse(stats=stats, total_folders=len(stats))
