"""Flask-SQLAlchemy database setup."""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


def init_db():
    """Initialize database tables and create demo user."""
    db.create_all()

    # Import models here to avoid circular imports
    from .user_flask import User
    from .mortgage_flask import Mortgage
    from .heloc_flask import Heloc

    # Create demo user if it doesn't exist
    demo_user = User.query.filter_by(email="demo@example.com").first()
    if not demo_user:
        demo_user = User(
            id="demo-user",
            email="demo@example.com",
            name="Demo User",
            password_hash="demo123",  # In production, this should be hashed
        )
        db.session.add(demo_user)
        
        # Also create a test user
        test_user = User(
            id="test-user-id",
            email="test@example.com",
            name="Test User",
            password_hash="test123",  # In production, this should be hashed
        )
        db.session.add(test_user)
        
        # Create sample mortgage for test user
        test_mortgage = Mortgage(
            id="test-mortgage-id",
            user_id="test-user-id",
            principal=400000.0,
            current_balance=350000.0,
            interest_rate=4.5,
            monthly_payment=2500.0,
            start_date=datetime(2022, 1, 1),
            term_months=360,
            monthly_income=8000.0,
            monthly_expenses=4500.0,
        )
        db.session.add(test_mortgage)
        
        # Create sample HELOC for test mortgage
        test_heloc = Heloc(
            id="test-heloc-id",
            mortgage_id="test-mortgage-id",
            credit_limit=75000.0,
            current_balance=0.0,
            interest_rate=5.5,
            minimum_payment=200.0,
        )
        db.session.add(test_heloc)
        
        db.session.commit()
