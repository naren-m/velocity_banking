"""User model for Flask."""
from datetime import datetime
from .base_flask import db


class User(db.Model):
    """User model."""

    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=True)
    email = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=True)
    password_hash = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    mortgages = db.relationship("Mortgage", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
