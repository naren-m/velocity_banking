"""Flask-SQLAlchemy database setup."""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


def init_db():
    """Initialize database tables and create demo user."""
    db.create_all()

    # Import models here to avoid circular imports
    from .user_flask import User

    # Create demo user if it doesn't exist
    demo_user = User.query.filter_by(email="demo@example.com").first()
    if not demo_user:
        demo_user = User(
            id="demo-user",
            email="demo@example.com",
            name="Demo User",
        )
        db.session.add(demo_user)
        db.session.commit()
