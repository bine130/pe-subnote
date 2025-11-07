from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.bookmark import UserBookmark
from app.models.topic import Topic
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.get("", response_model=List[BookmarkResponse])
async def get_my_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 북마크 목록 조회"""
    bookmarks = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.id
    ).order_by(UserBookmark.created_at.desc()).all()

    return bookmarks


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_bookmark(
    bookmark_data: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """북마크 토글 (추가/제거)"""
    # 토픽 존재 확인
    topic = db.query(Topic).filter(Topic.id == bookmark_data.topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    # 기존 북마크 확인
    existing_bookmark = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.id,
        UserBookmark.topic_id == bookmark_data.topic_id
    ).first()

    if existing_bookmark:
        # 북마크 제거
        db.delete(existing_bookmark)
    else:
        # 북마크 추가
        new_bookmark = UserBookmark(
            user_id=current_user.id,
            topic_id=bookmark_data.topic_id
        )
        db.add(new_bookmark)

    db.commit()
    return None


@router.get("/check/{topic_id}", response_model=bool)
async def check_bookmark(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 토픽 북마크 여부 확인"""
    bookmark = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.id,
        UserBookmark.topic_id == topic_id
    ).first()

    return bookmark is not None
