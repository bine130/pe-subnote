from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.note import UserNote
from app.models.topic import Topic
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=List[NoteResponse])
async def get_my_notes(
    topic_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 포스트잇 메모 목록 조회 (토픽별 필터링 가능)"""
    query = db.query(UserNote).filter(UserNote.user_id == current_user.id)

    if topic_id:
        query = query.filter(UserNote.topic_id == topic_id)

    notes = query.order_by(UserNote.created_at.desc()).all()
    return notes


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """포스트잇 메모 생성"""
    # 토픽 존재 확인
    topic = db.query(Topic).filter(Topic.id == note_data.topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    # 메모 생성
    new_note = UserNote(
        user_id=current_user.id,
        topic_id=note_data.topic_id,
        content=note_data.content,
        position_x=note_data.position_x,
        position_y=note_data.position_y,
        width=note_data.width,
        height=note_data.height,
        color=note_data.color,
        opacity=note_data.opacity
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 포스트잇 메모 조회"""
    note = db.query(UserNote).filter(
        UserNote.id == note_id,
        UserNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    return note


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """포스트잇 메모 수정 (내용, 위치, 색상)"""
    note = db.query(UserNote).filter(
        UserNote.id == note_id,
        UserNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # 업데이트할 필드만 수정
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.position_x is not None:
        note.position_x = note_data.position_x
    if note_data.position_y is not None:
        note.position_y = note_data.position_y
    if note_data.width is not None:
        note.width = note_data.width
    if note_data.height is not None:
        note.height = note_data.height
    if note_data.color is not None:
        note.color = note_data.color
    if note_data.opacity is not None:
        note.opacity = note_data.opacity

    db.commit()
    db.refresh(note)

    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """포스트잇 메모 삭제"""
    note = db.query(UserNote).filter(
        UserNote.id == note_id,
        UserNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return None
