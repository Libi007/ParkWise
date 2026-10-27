import pytest
from app import create_app
from app.extensions import db
from app.config import TestingConfig
from app.services.facility_service import seed_facilities_if_needed


@pytest.fixture(scope="session")
def app():
    """Create Flask application configured for testing with in-memory SQLite."""
    application = create_app(TestingConfig)
    with application.app_context():
        db.create_all()
        seed_facilities_if_needed()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Test client for issuing requests."""
    return app.test_client()


@pytest.fixture(scope="function")
def session(app):
    """Clean database session per test function."""
    with app.app_context():
        # Ensure seed facilities are present
        seed_facilities_if_needed()
        yield db.session
        db.session.rollback()
