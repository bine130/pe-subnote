from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import TopicCreate, TopicUpdate, TopicResponse, TopicListItem
from app.api.deps import require_admin, get_current_user

router = APIRouter()


@router.get("/", response_model=List[TopicListItem])
async def get_topics(
    category_id: Optional[int] = Query(None),
    is_published: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    서브노트 목록 조회 (필터링 지원)
    """
    query = db.query(Topic)

    if category_id is not None:
        query = query.filter(Topic.category_id == category_id)

    if is_published is not None:
        query = query.filter(Topic.is_published == is_published)

    topics = query.order_by(Topic.order_index, Topic.created_at.desc()).offset(skip).limit(limit).all()
    return topics


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: int, db: Session = Depends(get_db)):
    """
    특정 서브노트 조회
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # 조회수 증가
    topic.view_count += 1
    db.commit()

    return topic


@router.post("/", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic_data: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    새 서브노트 생성 (관리자만)
    """
    # category_id가 있다면 존재하는지 확인
    if topic_data.category_id:
        from app.models.category import Category
        category = db.query(Category).filter(Category.id == topic_data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # order_index가 지정되지 않았다면 마지막으로 설정
    if topic_data.order_index == 0:
        max_order = db.query(Topic).filter(
            Topic.category_id == topic_data.category_id
        ).count()
        topic_data.order_index = max_order

    topic = Topic(
        **topic_data.model_dump(),
        created_by=current_user.id
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: int,
    topic_data: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    서브노트 수정 (관리자만)
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # category_id가 변경되었다면 존재하는지 확인
    if topic_data.category_id is not None and topic_data.category_id != topic.category_id:
        from app.models.category import Category
        category = db.query(Category).filter(Category.id == topic_data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # 업데이트
    update_data = topic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    서브노트 삭제 (관리자만)
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()


@router.post("/{topic_id}/publish", response_model=TopicResponse)
async def toggle_publish(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    서브노트 공개/비공개 토글 (관리자만)
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.is_published = not topic.is_published
    db.commit()
    db.refresh(topic)
    return topic
