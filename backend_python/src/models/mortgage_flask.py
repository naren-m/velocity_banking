"""Mortgage model for Flask."""
from datetime import datetime
from .base_flask import db


class Mortgage(db.Model):
    """Mortgage model."""

    __tablename__ = "mortgages"

    id = db.Column(db.String, primary_key=True)
    user_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    principal = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    monthly_payment = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    term_months = db.Column(db.Integer, nullable=False)
    monthly_income = db.Column(db.Float, nullable=True)
    monthly_expenses = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user = db.relationship("User", back_populates="mortgages")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "principal": self.principal,
            "current_balance": self.current_balance,
            "interest_rate": self.interest_rate,
            "monthly_payment": self.monthly_payment,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "term_months": self.term_months,
            "monthly_income": self.monthly_income,
            "monthly_expenses": self.monthly_expenses,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
