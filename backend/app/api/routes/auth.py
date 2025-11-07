from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_id_token
from app.models.user import User
from app.schemas.user import (
    OAuthLoginRequest,
    OAuthRegisterRequest,
    Token,
    User as UserSchema
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/oauth/login", response_model=Token)
async def oauth_login(
    request: OAuthLoginRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth 로그인
    - Google 또는 Apple ID 토큰으로 로그인
    - 기존 사용자: JWT 토큰 발급
    - 신규 사용자: 회원가입 필요 응답
    """
    # ID 토큰 검증 및 디코딩
    oauth_data = decode_id_token(request.provider, request.id_token)
    if not oauth_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token"
        )

    # 이메일과 OAuth ID로 사용자 조회
    user = db.query(User).filter(
        User.email == oauth_data["email"],
        User.oauth_provider == request.provider
    ).first()

    # 신규 사용자인 경우
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first.",
            headers={"X-Registration-Required": "true"}
        )

    # 승인 상태 확인
    if user.approval_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for administrator approval."
        )

    if user.approval_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been rejected. Please contact the administrator."
        )

    # JWT 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "approval_status": user.approval_status
        },
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/oauth/register", response_model=Token)
async def oauth_register(
    request: OAuthRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth 회원가입
    - OAuth 인증 후 추가 정보(이름, 기수) 입력받아 회원가입
    - 자동으로 승인 대기 상태로 생성
    """
    # ID 토큰 검증 및 디코딩
    oauth_data = decode_id_token(request.provider, request.id_token)
    if not oauth_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token"
        )

    # 이미 가입된 사용자인지 확인
    existing_user = db.query(User).filter(
        User.email == oauth_data["email"]
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists. Please login."
        )

    # 새 사용자 생성
    new_user = User(
        email=oauth_data["email"],
        name=request.name,
        cohort=request.cohort,
        oauth_provider=request.provider,
        oauth_id=oauth_data["oauth_id"],
        role="student",  # 기본값: 수강생
        approval_status="pending"  # 기본값: 승인 대기
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # JWT 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "approval_status": new_user.approval_status
        },
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    현재 로그인한 사용자 정보 조회
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    로그아웃
    JWT는 stateless이므로 클라이언트에서 토큰 삭제하면 됨
    """
    return {"message": "Logged out successfully"}
