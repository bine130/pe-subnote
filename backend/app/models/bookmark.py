from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    user = relationship("User")
    topic = relationship("Topic", backref="bookmarks")
