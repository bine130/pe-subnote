from sqlalchemy import Column, String, Integer, Text, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)  # Markdown 또는 JSON 문자열
    keywords = Column(String(500), nullable=True)  # 쉼표로 구분된 키워드
    mnemonic = Column(Text, nullable=True)  # 암기두음법
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    is_published = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    order_index = Column(Integer, default=0)
    importance_level = Column(Integer, default=3)  # 1~5 별점
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    category = relationship("Category", backref="topics")
    creator = relationship("User", foreign_keys=[created_by])
