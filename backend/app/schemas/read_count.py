from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ReadCountIncrement(BaseModel):
    topic_id: int


class ReadCountResponse(BaseModel):
    user_id: UUID
    topic_id: int
    count: int
    last_read_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
