from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.comment import Comment, CommentLike
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentUserInfo

router = APIRouter(prefix="/api/topics/{topic_id}/comments", tags=["comments"])


def build_comment_tree(comments: List[Comment], current_user_id: UUID, parent_id: int = None) -> List[CommentResponse]:
    """재귀적으로 댓글 트리 구조 생성"""
    result = []

    for comment in comments:
        if comment.parent_comment_id == parent_id:
            # 현재 사용자가 좋아요 했는지 확인
            is_liked = any(like.user_id == current_user_id for like in comment.likes)

            # 댓글 응답 생성
            comment_response = CommentResponse(
                id=comment.id,
                topic_id=comment.topic_id,
                user_id=comment.user_id,
                parent_comment_id=comment.parent_comment_id,
                content=comment.content,
                likes_count=comment.likes_count,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                user=CommentUserInfo(
                    id=comment.user.id,
                    name=comment.user.name,
                    cohort=comment.user.cohort,
                    role=comment.user.role
                ),
                replies=build_comment_tree(comments, current_user_id, comment.id),
                is_liked=is_liked
            )
            result.append(comment_response)

    return result


@router.get("", response_model=List[CommentResponse])
async def get_comments(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """토픽의 모든 댓글 조회 (트리 구조)"""
    # 모든 댓글을 한 번에 가져오기 (N+1 문제 방지)
    comments = db.query(Comment).filter(
        Comment.topic_id == topic_id
    ).options(
        joinedload(Comment.user),
        joinedload(Comment.likes)
    ).order_by(Comment.created_at.desc()).all()

    # 트리 구조로 변환 (최상위 댓글만)
    return build_comment_tree(comments, current_user.id, parent_id=None)


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    topic_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """댓글 작성"""
    # 부모 댓글이 있다면 유효성 검사
    if comment_data.parent_comment_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_data.parent_comment_id,
            Comment.topic_id == topic_id
        ).first()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )

    # 댓글 생성
    new_comment = Comment(
        topic_id=topic_id,
        user_id=current_user.id,
        parent_comment_id=comment_data.parent_comment_id,
        content=comment_data.content
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # 사용자 정보 로드
    db.refresh(new_comment, ['user'])

    return CommentResponse(
        id=new_comment.id,
        topic_id=new_comment.topic_id,
        user_id=new_comment.user_id,
        parent_comment_id=new_comment.parent_comment_id,
        content=new_comment.content,
        likes_count=new_comment.likes_count,
        created_at=new_comment.created_at,
        updated_at=new_comment.updated_at,
        user=CommentUserInfo(
            id=new_comment.user.id,
            name=new_comment.user.name,
            cohort=new_comment.user.cohort,
            role=new_comment.user.role
        ),
        replies=[],
        is_liked=False
    )


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    topic_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """댓글 수정 (본인만 가능)"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.topic_id == topic_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # 본인 확인
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )

    # 내용 수정
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)

    # 사용자 정보 및 좋아요 로드
    db.refresh(comment, ['user', 'likes'])
    is_liked = any(like.user_id == current_user.id for like in comment.likes)

    return CommentResponse(
        id=comment.id,
        topic_id=comment.topic_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        likes_count=comment.likes_count,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        user=CommentUserInfo(
            id=comment.user.id,
            name=comment.user.name,
            cohort=comment.user.cohort,
            role=comment.user.role
        ),
        replies=[],
        is_liked=is_liked
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    topic_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """댓글 삭제 (본인 또는 관리자만 가능)"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.topic_id == topic_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # 본인 또는 관리자만 삭제 가능
    if comment.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

    db.delete(comment)
    db.commit()

    return None


@router.post("/{comment_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_comment_like(
    topic_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """댓글 좋아요 토글"""
    # 댓글 존재 확인
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.topic_id == topic_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # 기존 좋아요 확인
    existing_like = db.query(CommentLike).filter(
        CommentLike.user_id == current_user.id,
        CommentLike.comment_id == comment_id
    ).first()

    if existing_like:
        # 좋아요 취소
        db.delete(existing_like)
    else:
        # 좋아요 추가
        new_like = CommentLike(
            user_id=current_user.id,
            comment_id=comment_id
        )
        db.add(new_like)

    db.commit()
    return None
