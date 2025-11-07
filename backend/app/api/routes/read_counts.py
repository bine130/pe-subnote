from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.read_count import UserReadCount
from app.models.topic import Topic
from app.schemas.read_count import ReadCountIncrement, ReadCountResponse

router = APIRouter(prefix="/api/read-counts", tags=["read-counts"])


@router.get("", response_model=List[ReadCountResponse])
async def get_my_read_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 회독 카운트 목록 조회"""
    read_counts = db.query(UserReadCount).filter(
        UserReadCount.user_id == current_user.id
    ).order_by(UserReadCount.last_read_at.desc()).all()

    return read_counts


@router.post("", response_model=ReadCountResponse)
async def increment_read_count(
    read_count_data: ReadCountIncrement,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회독 카운트 증가"""
    # 토픽 존재 확인
    topic = db.query(Topic).filter(Topic.id == read_count_data.topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    # 기존 회독 카운트 확인
    read_count = db.query(UserReadCount).filter(
        UserReadCount.user_id == current_user.id,
        UserReadCount.topic_id == read_count_data.topic_id
    ).first()

    if read_count:
        # 카운트 증가
        read_count.count += 1
        read_count.last_read_at = func.current_timestamp()
    else:
        # 새로운 회독 카운트 생성
        read_count = UserReadCount(
            user_id=current_user.id,
            topic_id=read_count_data.topic_id,
            count=1
        )
        db.add(read_count)

    db.commit()
    db.refresh(read_count)

    return read_count


@router.get("/{topic_id}", response_model=ReadCountResponse)
async def get_read_count(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 토픽의 내 회독 카운트 조회"""
    read_count = db.query(UserReadCount).filter(
        UserReadCount.user_id == current_user.id,
        UserReadCount.topic_id == topic_id
    ).first()

    if not read_count:
        # 회독 기록이 없으면 0으로 반환
        from datetime import datetime
        return ReadCountResponse(
            user_id=current_user.id,
            topic_id=topic_id,
            count=0,
            last_read_at=datetime.now(),
            created_at=datetime.now()
        )

    return read_count
