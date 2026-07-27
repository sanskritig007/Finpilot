from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True) # Nullable for OAuth support
    auth_provider = Column(String(50), default="email")
    
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
