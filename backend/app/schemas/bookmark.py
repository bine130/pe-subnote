from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class BookmarkCreate(BaseModel):
    topic_id: int


class BookmarkResponse(BaseModel):
    user_id: UUID
    topic_id: int
    created_at: datetime

    class Config:
        from_attributes = True
