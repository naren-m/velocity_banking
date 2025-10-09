"""Payment model."""
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PaymentType(str, Enum):
    """Payment type enumeration."""

    REGULAR = "regular"
    CHUNK = "chunk"
    EXTRA = "extra"


class PaymentStatus(str, Enum):
    """Payment status enumeration."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Payment(Base):
    """Payment model."""

    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    mortgage_id: Mapped[str] = mapped_column(String, ForeignKey("mortgages.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payment_type: Mapped[PaymentType] = mapped_column(
        SQLEnum(PaymentType), nullable=False, default=PaymentType.REGULAR
    )
    principal_paid: Mapped[float] = mapped_column(Float, nullable=False)
    interest_paid: Mapped[float] = mapped_column(Float, nullable=False)
    remaining_balance: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    mortgage: Mapped["Mortgage"] = relationship("Mortgage", back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, amount={self.amount})>"
