from datetime import datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.models import Folder, TicketFolderAssignment


class FolderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str, owner_id: str) -> Folder:
        folder = Folder(
            id=str(uuid4()),
            name=name.strip(),
            owner_id=owner_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version=1,
        )
        self.session.add(folder)
        await self.session.flush()
        return folder

    async def get_by_id(
        self, folder_id: str, owner_id: str, include_deleted: bool = False
    ) -> Folder | None:
        query = select(Folder).where(
            Folder.id == folder_id, Folder.owner_id == owner_id
        )
        if not include_deleted:
            query = query.where(Folder.deleted_at.is_(None))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_name(
        self, name: str, owner_id: str, include_deleted: bool = False
    ) -> Folder | None:
        query = select(Folder).where(
            Folder.name == name.strip(), Folder.owner_id == owner_id
        )
        if not include_deleted:
            query = query.where(Folder.deleted_at.is_(None))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def count_by_owner(self, owner_id: str, include_deleted: bool = False) -> int:
        query = select(func.count(Folder.id)).where(Folder.owner_id == owner_id)
        if not include_deleted:
            query = query.where(Folder.deleted_at.is_(None))
        result = await self.session.execute(query)
        return result.scalar()

    async def list_folders(
        self,
        owner_id: str,
        page_size: int = 50,
        cursor: str | None = None,
        name_filter: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        include_deleted: bool = False,
    ) -> tuple[list[Folder], str | None]:
        query = select(Folder).where(Folder.owner_id == owner_id)

        if not include_deleted:
            query = query.where(Folder.deleted_at.is_(None))

        if name_filter:
            query = query.where(Folder.name.ilike(f"{name_filter}%"))

        if sort_by == "name":
            order_col = Folder.name
        else:
            order_col = Folder.created_at

        if sort_dir == "desc":
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        query = query.limit(page_size + 1)

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            if sort_dir == "desc":
                query = query.where(order_col < cursor_time)
            else:
                query = query.where(order_col > cursor_time)

        result = await self.session.execute(query)
        folders = list(result.scalars().all())

        next_cursor = None
        if len(folders) > page_size:
            folders = folders[:page_size]
            last_folder = folders[-1]
            next_cursor = last_folder.created_at.isoformat()

        return folders, next_cursor

    async def update(
        self,
        folder: Folder,
        new_name: str,
    ) -> Folder:
        folder.name = new_name.strip()
        folder.updated_at = datetime.utcnow()
        folder.version += 1
        await self.session.flush()
        return folder

    async def soft_delete(self, folder: Folder) -> None:
        folder.deleted_at = datetime.utcnow()
        folder.updated_at = datetime.utcnow()
        folder.version += 1
        await self.session.flush()

    async def delete_folder_assignments(self, folder_id: str) -> None:
        query = select(TicketFolderAssignment).where(
            TicketFolderAssignment.folder_id == folder_id
        )
        result = await self.session.execute(query)
        assignments = list(result.scalars().all())
        for assignment in assignments:
            await self.session.delete(assignment)
        await self.session.flush()

    async def get_all_stats(self, owner_id: str) -> list[dict]:
        """Aggregate statistics for all folders owned by a user."""
        from src.repositories.models import Ticket

        # Base query to get folders and their counts
        query = (
            select(
                Folder.id,
                Folder.name,
                func.count(Ticket.id).label("total_tickets"),
                func.count(func.nullif(Ticket.status == "resolved", False)).label(
                    "resolved_tickets"
                ),
                func.count(func.nullif(Ticket.status != "resolved", False)).label(
                    "open_tickets"
                ),
            )
            .outerjoin(
                TicketFolderAssignment, Folder.id == TicketFolderAssignment.folder_id
            )
            .outerjoin(Ticket, TicketFolderAssignment.ticket_id == Ticket.id)
            .where(Folder.owner_id == owner_id, Folder.deleted_at.is_(None))
            .group_by(Folder.id, Folder.name)
        )

        result = await self.session.execute(query)
        stats = []
        for row in result.all():
            total = row[2]
            resolved = row[3]
            efficiency = (resolved / total * 100) if total > 0 else 0.0

            stats.append(
                {
                    "id": row[0],
                    "name": row[1],
                    "total_tickets": total,
                    "resolved_tickets": resolved,
                    "open_tickets": row[4],
                    "efficiency": round(efficiency, 1),
                }
            )
        return stats
