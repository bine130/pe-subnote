from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class TopicBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str
    category_id: Optional[int] = None
    is_published: bool = True


class TopicCreate(TopicBase):
    order_index: int = 0


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    order_index: Optional[int] = None


class TopicResponse(TopicBase):
    id: int
    created_by: Optional[UUID] = None
    view_count: int
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TopicListItem(BaseModel):
    """리스트 조회용 간략한 정보"""
    id: int
    title: str
    category_id: Optional[int] = None
    is_published: bool
    view_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
