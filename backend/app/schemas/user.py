from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    name: str
    cohort: int


class UserCreate(UserBase):
    oauth_provider: str  # 'google' or 'apple'
    oauth_id: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    cohort: Optional[int] = None
    role: Optional[str] = None  # 'student' or 'admin'
    approval_status: Optional[str] = None


class User(UserBase):
    id: UUID
    oauth_provider: str
    role: str
    approval_status: str
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(User):
    oauth_id: str


# OAuth 관련 스키마
class OAuthLoginRequest(BaseModel):
    provider: str  # 'google' or 'apple'
    id_token: str  # OAuth provider의 ID 토큰


class OAuthRegisterRequest(BaseModel):
    provider: str
    id_token: str
    name: str
    cohort: int


# 토큰 스키마
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None
