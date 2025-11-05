from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    order_index: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = None
    order_index: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryTree(CategoryResponse):
    children: List['CategoryTree'] = []

    model_config = {"from_attributes": True}


# For updating order (drag & drop)
class CategoryReorder(BaseModel):
    id: int
    parent_id: Optional[int] = None
    order_index: int
