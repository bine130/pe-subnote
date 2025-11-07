from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    topic = relationship("Topic", backref="comments")
    user = relationship("User", foreign_keys=[user_id])
    parent = relationship("Comment", remote_side=[id], backref="replies")


class CommentLike(Base):
    __tablename__ = "comment_likes"

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    user = relationship("User")
    comment = relationship("Comment", backref="likes")
