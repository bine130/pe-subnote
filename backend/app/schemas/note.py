from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class NoteBase(BaseModel):
    content: str
    position_x: int = 100
    position_y: int = 100
    width: int = 192
    height: int = 192
    color: str = 'yellow'
    opacity: float = 1.0


class NoteCreate(NoteBase):
    topic_id: int


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    color: Optional[str] = None
    opacity: Optional[float] = None


class NoteResponse(NoteBase):
    id: UUID
    user_id: UUID
    topic_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
