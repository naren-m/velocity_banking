"""Mortgage model."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Mortgage(Base):
    """Mortgage model."""

    __tablename__ = "mortgages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    principal: Mapped[float] = mapped_column(Float, nullable=False)
    current_balance: Mapped[float] = mapped_column(Float, nullable=False)
    interest_rate: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_payment: Mapped[float] = mapped_column(Float, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    term_months: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_income: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    monthly_expenses: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="mortgages")
    helocs: Mapped[list["HELOC"]] = relationship(
        "HELOC", back_populates="mortgage", cascade="all, delete-orphan"
    )
    payment_strategies: Mapped[list["PaymentStrategy"]] = relationship(
        "PaymentStrategy", back_populates="mortgage", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="mortgage", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Mortgage(id={self.id}, balance={self.current_balance})>"
