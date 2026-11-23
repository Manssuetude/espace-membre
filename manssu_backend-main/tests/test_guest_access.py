"""Guest access: guests only reach the sessions they were invited to, and lose access
shortly after their last session ends. A new invite restores it."""
import uuid
from datetime import datetime, timedelta

from app.models.session import Session as SessionModel, SessionRegistration
from app.models.session_invite import SessionInvite
from app.services.invite_service import InviteService
from app.services.session_service import SESSION_TIMEZONE, GUEST_ACCESS_GRACE
from tests.conftest import make_user, auth_headers


def make_session(db, start: datetime, end: datetime, status="upcoming"):
    session = SessionModel(
        id=uuid.uuid4(),
        title="Séance",
        type="workshop",
        date=end.date(),
        start_time=start.time(),
        end_time=end.time(),
        max_participants=30,
        registered=0,
        status=status,
    )
    db.add(session)
    db.commit()
    return session


def register(db, session, user):
    db.add(SessionRegistration(session_id=session.id, user_id=user.id))
    session.registered += 1
    db.commit()


def now_paris():
    return datetime.now(SESSION_TIMEZONE).replace(tzinfo=None)


def test_guest_keeps_access_during_grace_then_loses_it(client, db):
    guest = make_user(db, role="guest")
    # Ended within the grace period: still allowed
    end = now_paris() - GUEST_ACCESS_GRACE + timedelta(minutes=30)
    session = make_session(db, end - timedelta(hours=2), end)
    register(db, session, guest)
    assert client.get("/api/v1/sessions", headers=auth_headers(guest)).status_code == 200

    # Ended more than the grace period ago: access revoked
    end = now_paris() - GUEST_ACCESS_GRACE - timedelta(minutes=30)
    session.date, session.end_time = end.date(), end.time()
    db.commit()
    assert client.get("/api/v1/sessions", headers=auth_headers(guest)).status_code == 401


def test_guest_without_session_has_no_access_but_member_does(client, db):
    guest = make_user(db, role="guest")
    member = make_user(db, role="member")
    assert client.get("/api/v1/sessions", headers=auth_headers(guest)).status_code == 401
    assert client.get("/api/v1/sessions", headers=auth_headers(member)).status_code == 200


def test_new_invite_restores_access_after_revocation(client, db):
    guest = make_user(db, role="guest")
    past_end = now_paris() - timedelta(days=3)
    past = make_session(db, past_end - timedelta(hours=2), past_end, status="completed")
    register(db, past, guest)
    assert client.get("/api/v1/sessions", headers=auth_headers(guest)).status_code == 401

    future_start = now_paris() + timedelta(days=10)
    future = make_session(db, future_start, future_start + timedelta(hours=2))
    register(db, future, guest)  # what the invite link / admin "add session" does
    assert client.get("/api/v1/sessions", headers=auth_headers(guest)).status_code == 200


def test_guest_only_sees_invited_sessions_and_cannot_self_register(client, db):
    guest = make_user(db, role="guest")
    start = now_paris() + timedelta(days=5)
    invited = make_session(db, start, start + timedelta(hours=2))
    other = make_session(db, start, start + timedelta(hours=2))
    register(db, invited, guest)

    listed = client.get("/api/v1/sessions", headers=auth_headers(guest)).json()["data"]["data"]
    assert [s["id"] for s in listed] == [str(invited.id)]
    assert client.get(f"/api/v1/sessions/{other.id}", headers=auth_headers(guest)).status_code == 404
    assert client.post(f"/api/v1/sessions/{other.id}/register", headers=auth_headers(guest)).status_code == 403


def test_guest_can_be_invited_to_two_sessions_at_once(db, monkeypatch):
    admin = make_user(db, role="admin")
    start = now_paris() + timedelta(days=5)
    first = make_session(db, start, start + timedelta(hours=2))
    second = make_session(db, start + timedelta(days=7), start + timedelta(days=7, hours=2))
    monkeypatch.setattr(InviteService, "_send_invite_email", lambda *args, **kwargs: None)

    service = InviteService(db)
    service.create_invite("guest@example.com", str(first.id), str(admin.id))
    service.create_invite("guest@example.com", str(second.id), str(admin.id))
    assert db.query(SessionInvite).filter(SessionInvite.email == "guest@example.com").count() == 2


def test_guest_is_kept_out_of_the_rest_of_the_member_area(client, db):
    guest = make_user(db, role="guest")
    start = now_paris() + timedelta(days=5)
    register(db, make_session(db, start, start + timedelta(hours=2)), guest)
    headers = auth_headers(guest)

    # Allowed: own profile and invited sessions
    assert client.get("/api/v1/users/me", headers=headers).status_code == 200
    assert client.get("/api/v1/sessions", headers=headers).status_code == 200

    # Everything else is members-only
    for path in [
        "/api/v1/users",
        "/api/v1/resources",
        "/api/v1/polls",
        "/api/v1/themes",
        "/api/v1/commissions",
        "/api/v1/library/books",
        "/api/v1/questionnaires",
        "/api/v1/dashboard/member",
        "/api/v1/activity-templates",
        "/api/v1/locations",
        "/api/v1/award-wins/me",
    ]:
        assert client.get(path, headers=headers).status_code == 403, path


def test_members_are_not_affected_by_the_guest_block(client, db):
    member = make_user(db, role="member")
    headers = auth_headers(member)
    for path in ["/api/v1/users", "/api/v1/resources", "/api/v1/polls", "/api/v1/commissions"]:
        assert client.get(path, headers=headers).status_code == 200, path
