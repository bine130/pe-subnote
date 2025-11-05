from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class TemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    content: str
    category: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    category: Optional[str] = None


class TemplateResponse(TemplateBase):
    id: int
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TemplateListItem(BaseModel):
    """리스트 조회용 간략한 정보"""
    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
