"""Pytest configuration and fixtures for Flask app."""
import sys
import os
import pytest

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Don't import the async models
sys.modules['models.base'] = None

from app import create_app
from models.base_flask import db as _db


@pytest.fixture(scope="session")
def app():
    """Create application for testing."""
    # Suppress warnings about base module
    import warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)

    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    return app


@pytest.fixture(scope="function")
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    """Create database for testing."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def test_user(db):
    """Create a test user."""
    from models.user_flask import User

    user = User(
        id="test-user-123",
        email="test@example.com",
        name="Test User",
    )
    db.session.add(user)
    db.session.commit()
    return user
