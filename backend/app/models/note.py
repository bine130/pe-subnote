from sqlalchemy import Column, Integer, Text, String, TIMESTAMP, ForeignKey, Float, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class UserNote(Base):
    __tablename__ = "user_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    note_content = Column('note_content', Text, nullable=False)
    position_x = Column(Integer, default=100, nullable=True)
    position_y = Column(Integer, default=100, nullable=True)
    width = Column(Integer, default=192, nullable=True)
    height = Column(Integer, default=192, nullable=True)
    color = Column(String(20), default='yellow', nullable=True)
    opacity = Column(Float, default=1.0, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Python에서는 content로 접근하도록 property 설정
    @property
    def content(self):
        return self.note_content

    @content.setter
    def content(self, value):
        self.note_content = value

    # Relationships
    user = relationship("User")
    topic = relationship("Topic", backref="notes")
