from sqlalchemy import Column, String, Integer, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Self-referential relationship for tree structure
    parent = relationship("Category", remote_side=[id], backref="children")
