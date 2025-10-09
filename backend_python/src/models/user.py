"""User model."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    mortgages: Mapped[list["Mortgage"]] = relationship(
        "Mortgage", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
