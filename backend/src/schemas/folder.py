from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    version: int = Field(..., gt=0)


class FolderResponse(FolderBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    version: int
    deleted_at: Optional[datetime] = None


class FolderListResponse(BaseModel):
    folders: list[FolderResponse]
    next_cursor: Optional[str] = None
    total: int


class FolderPaginationParams(BaseModel):
    page_size: int = Field(default=50, ge=1, le=200)
    cursor: Optional[str] = None
    name_filter: Optional[str] = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|name)$")
    sort_dir: str = Field(default="desc", pattern="^(asc|desc)$")
    include_deleted: bool = False


class FolderStat(BaseModel):
    id: str
    name: str
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    efficiency: float


class FolderStatsResponse(BaseModel):
    stats: list[FolderStat]
    total_folders: int
