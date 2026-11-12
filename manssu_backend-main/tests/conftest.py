"""
Test infra for the Awards test suite.

Runs against a dedicated local Postgres database (manssu_test), never the
development/production database app/database.py connects to by default.
Models use postgresql-dialect columns (UUID, JSONB), so SQLite is not an option.

Setup once, locally: `createdb manssu_test` (trust auth, no password needed).
"""
import os
import uuid
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://localhost/manssu_test")

test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

import app.models  # noqa: E402  (registers all mappers)
import app.models.questionnaire  # noqa: E402  (not re-exported by app.models, needed for User relationships)
from app.database import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.commission import Commission, CommissionMember  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Service code under test calls session.commit() itself, which rules out the usual
    rollback-after-each-test pattern (a commit on a connection-bound session ends the
    outer transaction early). Truncate everything before each test instead."""
    with test_engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
    yield


@pytest.fixture
def db():
    """A plain session behaving exactly like the app's own SessionLocal (commits for real,
    against the test database only). Cleaned up by _clean_tables before the next test."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def _get_test_db():
        try:
            yield db
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = _get_test_db
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.pop(get_db, None)


def make_user(db, role="member", status="active", email=None):
    user = User(
        id=uuid.uuid4(),
        email=email or f"{uuid.uuid4()}@test.local".replace("@test.local", "@example.com"),
        first_name="Test",
        last_name=role.capitalize(),
        role=role,
        status=status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_award_manager_commission_member(db):
    """A plain member whose active "Vie asso" commission membership grants Awards-manager rights."""
    user = make_user(db, role="member")
    commission = Commission(
        id=uuid.uuid4(),
        name="Vie asso",
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(commission)
    db.commit()
    db.add(CommissionMember(id=uuid.uuid4(), commission_id=commission.id, user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user) -> dict:
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"Authorization": f"Bearer {token}"}
