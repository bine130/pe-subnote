from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class CommentUserInfo(BaseModel):
    """댓글 작성자 정보"""
    id: UUID
    name: str
    cohort: int
    role: str  # 관리자 배지 표시용

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    parent_comment_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(CommentBase):
    id: int
    topic_id: int
    user_id: UUID
    parent_comment_id: Optional[int]
    likes_count: int
    created_at: datetime
    updated_at: datetime
    user: CommentUserInfo
    replies: List['CommentResponse'] = []  # 재귀 구조
    is_liked: bool = False  # 현재 사용자가 좋아요 했는지

    class Config:
        from_attributes = True


# 재귀 타입 업데이트
CommentResponse.model_rebuild()
