"""HELOC model."""
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class HELOC(Base):
    """Home Equity Line of Credit model."""

    __tablename__ = "helocs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    mortgage_id: Mapped[str] = mapped_column(String, ForeignKey("mortgages.id"), nullable=False)
    credit_limit: Mapped[float] = mapped_column(Float, nullable=False)
    current_balance: Mapped[float] = mapped_column(Float, nullable=False)
    interest_rate: Mapped[float] = mapped_column(Float, nullable=False)
    minimum_payment: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    mortgage: Mapped["Mortgage"] = relationship("Mortgage", back_populates="helocs")

    def __repr__(self) -> str:
        return f"<HELOC(id={self.id}, limit={self.credit_limit})>"
