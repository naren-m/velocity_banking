"""Payment strategy model."""
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class StrategyType(str, Enum):
    """Strategy type enumeration."""

    STANDARD = "standard"
    VELOCITY = "velocity"
    CUSTOM = "custom"


class PaymentFrequency(str, Enum):
    """Payment frequency enumeration."""

    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class PaymentStrategy(Base):
    """Payment strategy model."""

    __tablename__ = "payment_strategies"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    mortgage_id: Mapped[str] = mapped_column(String, ForeignKey("mortgages.id"), nullable=False)
    strategy_type: Mapped[StrategyType] = mapped_column(
        SQLEnum(StrategyType), nullable=False, default=StrategyType.STANDARD
    )
    chunk_amount: Mapped[float] = mapped_column(Float, nullable=False)
    frequency: Mapped[PaymentFrequency] = mapped_column(
        SQLEnum(PaymentFrequency), nullable=False, default=PaymentFrequency.MONTHLY
    )
    projected_months_to_payoff: Mapped[int] = mapped_column(Integer, nullable=False)
    total_interest_saved: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    mortgage: Mapped["Mortgage"] = relationship("Mortgage", back_populates="payment_strategies")

    def __repr__(self) -> str:
        return f"<PaymentStrategy(id={self.id}, type={self.strategy_type})>"
