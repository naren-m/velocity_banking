"""Payment model for Flask."""
from datetime import datetime
from models.base_flask import db


class Payment(db.Model):
    """Payment tracking model."""

    __tablename__ = "payments"

    id = db.Column(db.String, primary_key=True)
    mortgage_id = db.Column(db.String, db.ForeignKey("mortgages.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_type = db.Column(db.String, nullable=False)  # regular, chunk, extra
    payment_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    principal_amount = db.Column(db.Float, nullable=True)
    interest_amount = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    mortgage = db.relationship("Mortgage", backref="payments")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "mortgage_id": self.mortgage_id,
            "amount": self.amount,
            "payment_type": self.payment_type,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "principal_amount": self.principal_amount,
            "interest_amount": self.interest_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, amount={self.amount})>"
