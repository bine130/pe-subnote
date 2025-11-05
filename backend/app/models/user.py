from sqlalchemy import Column, String, Integer, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    cohort = Column(Integer, nullable=False)  # 기수
    oauth_provider = Column(String(20), nullable=False)  # 'google' or 'apple'
    oauth_id = Column(String(255), nullable=False)  # OAuth provider의 user ID
    role = Column(String(20), nullable=False, default='student')  # 'student' or 'admin'
    approval_status = Column(String(20), nullable=False, default='pending')  # 'pending', 'approved', 'rejected'
    approved_by = Column(UUID(as_uuid=True), nullable=True)  # FK to users.id
    approved_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
