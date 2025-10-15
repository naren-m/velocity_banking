"""HELOC model for Flask."""
from datetime import datetime
from models.base_flask import db


class Heloc(db.Model):
    """Home Equity Line of Credit model."""

    __tablename__ = "helocs"

    id = db.Column(db.String, primary_key=True)
    mortgage_id = db.Column(db.String, db.ForeignKey("mortgages.id"), nullable=False)
    credit_limit = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    minimum_payment = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    mortgage = db.relationship("Mortgage", back_populates="helocs")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "mortgage_id": self.mortgage_id,
            "credit_limit": self.credit_limit,
            "current_balance": self.current_balance,
            "interest_rate": self.interest_rate,
            "minimum_payment": self.minimum_payment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Heloc(id={self.id}, limit={self.credit_limit})>"
