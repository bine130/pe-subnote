from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class CategoryInfo(BaseModel):
    """카테고리 정보"""
    id: int
    name: str

    model_config = {"from_attributes": True}


class TopicBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str
    keywords: Optional[str] = Field(None, max_length=500)
    mnemonic: Optional[str] = None
    category_id: Optional[int] = None
    is_published: bool = True
    importance_level: int = Field(default=3, ge=1, le=5)


class TopicCreate(TopicBase):
    order_index: int = 0


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    keywords: Optional[str] = Field(None, max_length=500)
    mnemonic: Optional[str] = None
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    order_index: Optional[int] = None
    importance_level: Optional[int] = Field(None, ge=1, le=5)


class TopicResponse(TopicBase):
    id: int
    created_by: Optional[UUID] = None
    view_count: int
    order_index: int
    importance_level: int
    category: Optional[CategoryInfo] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TopicListItem(BaseModel):
    """리스트 조회용 간략한 정보"""
    id: int
    title: str
    category_id: Optional[int] = None
    category: Optional[CategoryInfo] = None
    is_published: bool
    view_count: int
    importance_level: int
    keywords: Optional[str] = None
    mnemonic: Optional[str] = None
    comments_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
