"""
Tests for the Awards refonte (teasing/nominations/selection/vote/ceremony/palmares).
Runs against a dedicated local Postgres test database - see tests/conftest.py.
"""
import uuid
from datetime import datetime, timedelta

from tests.conftest import make_user, make_award_manager_commission_member, auth_headers

from app.models.award import AwardCategory, AwardCandidate, AwardVote, AwardWinner, AwardSettings
from app.models.user_award import UserAwardWin


def make_category(db, **kwargs):
    defaults = dict(id=uuid.uuid4(), name="Monsieur/Madame Test", icon="🏆", target_type="member", order_index=0)
    defaults.update(kwargs)
    category = AwardCategory(**defaults)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_settings(db) -> AwardSettings:
    settings = db.query(AwardSettings).filter(AwardSettings.id == 1).first()
    if not settings:
        settings = AwardSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def make_candidate(db, category, nominee, votes=0):
    candidate = AwardCandidate(id=uuid.uuid4(), category_id=category.id, nominated_user_id=nominee.id, votes=votes)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


# ----------------------------------------------------------------------
# Permissions
# ----------------------------------------------------------------------


def test_vie_asso_commission_member_can_create_category(client, db):
    manager = make_award_manager_commission_member(db)
    resp = client.post(
        "/api/v1/awards/categories",
        json={"name": "Nouveau prix", "targetType": "member"},
        headers=auth_headers(manager),
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["success"] is True


def test_plain_member_forbidden_from_managing_categories(client, db):
    member = make_user(db, role="member")
    resp = client.post(
        "/api/v1/awards/categories",
        json={"name": "Nouveau prix", "targetType": "member"},
        headers=auth_headers(member),
    )
    assert resp.status_code == 403


def test_plain_member_forbidden_from_ceremony_preparation_and_publish(client, db):
    member = make_user(db, role="member")
    assert client.get("/api/v1/awards/ceremony/preparation", headers=auth_headers(member)).status_code == 403
    assert client.get("/api/v1/awards/ceremony", headers=auth_headers(member)).status_code == 403
    assert client.post("/api/v1/awards/publish-all-results", headers=auth_headers(member)).status_code == 403
    assert client.patch("/api/v1/awards/settings", json={"emailMode": "on"}, headers=auth_headers(member)).status_code == 403


def test_reset_all_requires_super_admin(client, db):
    admin = make_user(db, role="admin")
    super_admin = make_user(db, role="super_admin")
    assert client.post("/api/v1/awards/reset-all", headers=auth_headers(admin)).status_code == 403
    resp = client.post("/api/v1/awards/reset-all", headers=auth_headers(super_admin))
    assert resp.status_code == 200, resp.text


# ----------------------------------------------------------------------
# Teasing: server-side field stripping
# ----------------------------------------------------------------------


def test_teasing_strips_fields_until_revealed_for_members(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.teasing_start_at = now - timedelta(days=1)
    settings.nomination_start_at = now + timedelta(days=5)
    db.commit()

    locked = make_category(db, name="Prix Secret", icon="🔒", reveal_at=now + timedelta(days=1), order_index=0)
    revealed = make_category(db, name="Prix Révélé", icon="🎉", reveal_at=now - timedelta(hours=1), order_index=1)

    member = make_user(db, role="member")
    resp = client.get("/api/v1/awards/categories", headers=auth_headers(member))
    assert resp.status_code == 200
    by_id = {c["id"]: c for c in resp.json()["data"]}

    assert by_id[str(locked.id)]["name"] is None
    assert by_id[str(locked.id)]["icon"] is None
    assert by_id[str(locked.id)]["revealed"] is False

    assert by_id[str(revealed.id)]["name"] == "Prix Révélé"
    assert by_id[str(revealed.id)]["revealed"] is True


def test_teasing_does_not_strip_fields_for_award_manager(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.teasing_start_at = now - timedelta(days=1)
    settings.nomination_start_at = now + timedelta(days=5)
    db.commit()

    locked = make_category(db, name="Prix Secret", icon="🔒", reveal_at=now + timedelta(days=1))
    manager = make_award_manager_commission_member(db)

    resp = client.get("/api/v1/awards/categories", headers=auth_headers(manager))
    by_id = {c["id"]: c for c in resp.json()["data"]}
    assert by_id[str(locked.id)]["name"] == "Prix Secret"


# ----------------------------------------------------------------------
# Nominations
# ----------------------------------------------------------------------


def test_member_cannot_nominate_themselves(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.nomination_start_at = now - timedelta(days=1)
    settings.nomination_end_at = now + timedelta(days=1)
    db.commit()

    category = make_category(db)
    member = make_user(db, role="member")
    other = make_user(db, role="member")

    resp = client.post(
        f"/api/v1/awards/categories/{category.id}/nominations",
        json={"nominatedUserId": str(member.id)},
        headers=auth_headers(member),
    )
    assert resp.status_code == 400

    resp = client.post(
        f"/api/v1/awards/categories/{category.id}/nominations",
        json={"nominatedUserId": str(other.id)},
        headers=auth_headers(member),
    )
    assert resp.status_code == 200, resp.text


# ----------------------------------------------------------------------
# Calendar validation
# ----------------------------------------------------------------------


def test_update_settings_rejects_out_of_order_dates(client, db):
    manager = make_award_manager_commission_member(db)
    now = datetime.utcnow()
    resp = client.patch(
        "/api/v1/awards/settings",
        json={
            "teasingStartAt": (now + timedelta(days=5)).isoformat(),
            "nominationStartAt": (now + timedelta(days=1)).isoformat(),  # before teasing: invalid
        },
        headers=auth_headers(manager),
    )
    assert resp.status_code == 400


def test_update_settings_accepts_in_order_dates(client, db):
    manager = make_award_manager_commission_member(db)
    now = datetime.utcnow()
    resp = client.patch(
        "/api/v1/awards/settings",
        json={
            "teasingStartAt": (now + timedelta(days=1)).isoformat(),
            "nominationStartAt": (now + timedelta(days=2)).isoformat(),
            "nominationEndAt": (now + timedelta(days=3)).isoformat(),
        },
        headers=auth_headers(manager),
    )
    assert resp.status_code == 200, resp.text


# ----------------------------------------------------------------------
# Nomination stats: top 3 + tie at cutoff
# ----------------------------------------------------------------------


def test_nomination_stats_flags_top3_and_tie_at_cutoff(client, db):
    from app.models.award import AwardNomination

    category = make_category(db)
    manager = make_award_manager_commission_member(db)
    nominees = [make_user(db) for _ in range(4)]
    proposers = [make_user(db) for _ in range(3)]

    # nominees[0]: 3 proposals, [1]: 2, [2]: 1, [3]: 1 -> 3rd and 4th place tie at 1
    counts = [3, 2, 1, 1]
    for nominee, count in zip(nominees, counts):
        for i in range(count):
            db.add(AwardNomination(
                id=uuid.uuid4(), category_id=category.id, nominated_user_id=nominee.id,
                proposed_by_user_id=proposers[i % len(proposers)].id,
            ))
    db.commit()

    resp = client.get(f"/api/v1/awards/categories/{category.id}/nomination-stats", headers=auth_headers(manager))
    assert resp.status_code == 200, resp.text
    stats = resp.json()["data"]
    assert len(stats) == 4
    assert [s["suggested"] for s in stats] == [True, True, True, False]
    assert all(s["tieAtCutoff"] for s in stats)


# ----------------------------------------------------------------------
# No vote leakage before publication
# ----------------------------------------------------------------------


def test_votes_and_percentage_hidden_before_publication_even_for_managers(client, db):
    category = make_category(db, nominations_open=False)
    nominee = make_user(db)
    make_candidate(db, category, nominee, votes=5)
    manager = make_award_manager_commission_member(db)

    resp = client.get("/api/v1/awards/categories", headers=auth_headers(manager))
    by_id = {c["id"]: c for c in resp.json()["data"]}
    candidates = by_id[str(category.id)]["candidates"]
    assert candidates[0]["votes"] is None
    assert candidates[0]["percentage"] is None


def test_members_get_finalists_not_candidates(client, db):
    category = make_category(db, nominations_open=False)
    nominee = make_user(db)
    make_candidate(db, category, nominee, votes=5)
    member = make_user(db, role="member")

    resp = client.get("/api/v1/awards/categories", headers=auth_headers(member))
    by_id = {c["id"]: c for c in resp.json()["data"]}
    assert by_id[str(category.id)]["candidates"] is None
    assert by_id[str(category.id)]["finalists"][0]["votes"] is None


# ----------------------------------------------------------------------
# Ceremony preparation + publication
# ----------------------------------------------------------------------


def test_ceremony_preparation_exposes_real_votes_to_managers(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.vote_end_at = now - timedelta(hours=1)
    db.commit()

    category = make_category(db, nominations_open=False)
    a, b = make_user(db), make_user(db)
    make_candidate(db, category, a, votes=3)
    make_candidate(db, category, b, votes=1)
    manager = make_award_manager_commission_member(db)

    resp = client.get("/api/v1/awards/ceremony/preparation", headers=auth_headers(manager))
    assert resp.status_code == 200, resp.text
    items = resp.json()["data"]
    assert len(items) == 1
    assert items[0]["tie"] is False
    votes = sorted(c["votes"] for c in items[0]["candidates"])
    assert votes == [1, 3]


def test_publish_blocked_until_tie_is_resolved(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.vote_end_at = now - timedelta(hours=1)
    settings.edition_year = 2026
    db.commit()

    category = make_category(db, nominations_open=False, name="Prix Égalité")
    a, b = make_user(db), make_user(db)
    make_candidate(db, category, a, votes=2)
    make_candidate(db, category, b, votes=2)
    manager = make_award_manager_commission_member(db)

    # Unresolved tie -> publish is rejected
    resp = client.post("/api/v1/awards/publish-all-results", headers=auth_headers(manager))
    assert resp.status_code == 400

    # Resolve as co-winners via the preparation endpoint
    resp = client.put(
        "/api/v1/awards/ceremony/preparation",
        json={"order": [str(category.id)], "resolutions": {str(category.id): {"mode": "co_winners"}}},
        headers=auth_headers(manager),
    )
    assert resp.status_code == 200, resp.text

    resp = client.post("/api/v1/awards/publish-all-results", headers=auth_headers(manager))
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["badgesAwarded"] == 2

    wins = db.query(UserAwardWin).filter(UserAwardWin.award_name == "Prix Égalité").all()
    assert len(wins) == 2
    assert all(w.is_co_winner for w in wins)
    assert all(w.year == 2026 for w in wins)


def test_publish_is_idempotent(client, db):
    now = datetime.utcnow()
    settings = get_settings(db)
    settings.vote_end_at = now - timedelta(hours=1)
    settings.edition_year = 2026
    db.commit()

    category = make_category(db, nominations_open=False, name="Prix Unique")
    winner_user = make_user(db)
    candidate = make_candidate(db, category, winner_user, votes=5)
    db.add(AwardWinner(category_id=category.id, candidate_id=candidate.id))
    db.commit()
    manager = make_award_manager_commission_member(db)

    first = client.post("/api/v1/awards/publish-all-results", headers=auth_headers(manager))
    assert first.status_code == 200
    assert first.json()["data"]["badgesAwarded"] == 1

    # Re-run against the now-already-published category: nothing left to publish
    second = client.post("/api/v1/awards/publish-all-results", headers=auth_headers(manager))
    assert second.status_code == 200
    assert second.json()["data"]["publishedCount"] == 0

    wins = db.query(UserAwardWin).filter(UserAwardWin.award_name == "Prix Unique", UserAwardWin.year == 2026).all()
    assert len(wins) == 1
    assert wins[0].is_co_winner is False


# ----------------------------------------------------------------------
# Email mode (off / test / on)
# ----------------------------------------------------------------------


def test_email_mode_off_sends_nothing(db, mocker):
    from app.services.award_service import AwardService
    from app.services.email_service import ResendEmailService

    mocked = mocker.patch.object(ResendEmailService, "send_award_teasing_started_email")
    settings = get_settings(db)
    settings.email_mode = "off"
    db.commit()

    AwardService(db)._send_award_phase_email("teasing", settings)
    mocked.assert_not_called()


def test_email_mode_test_sends_only_to_super_admins_with_test_flag(db, mocker):
    from app.services.award_service import AwardService
    from app.services.email_service import ResendEmailService

    mocked = mocker.patch.object(ResendEmailService, "send_award_teasing_started_email", return_value=True)
    settings = get_settings(db)
    settings.email_mode = "test"
    db.commit()

    make_user(db, role="member")  # an active member: must NOT receive the test email
    super_admin = make_user(db, role="super_admin")

    AwardService(db)._send_award_phase_email("teasing", settings)

    recipient_emails = {call.kwargs["to_email"] for call in mocked.call_args_list}
    assert recipient_emails == {super_admin.email}
    assert all(call.kwargs["test_mode"] is True for call in mocked.call_args_list)


def test_cron_tick_sends_each_phase_email_only_once(db, mocker):
    from app.services.award_service import AwardService
    from app.services.email_service import ResendEmailService

    mocked = mocker.patch.object(ResendEmailService, "send_award_teasing_started_email", return_value=True)
    settings = get_settings(db)
    settings.email_mode = "on"
    settings.teasing_start_at = datetime.utcnow() - timedelta(hours=1)
    db.commit()
    make_user(db, role="member")

    AwardService(db).run_cron_tick()
    assert mocked.call_count == 1

    # Second tick: teasing_email_sent_at is now set, must not send again
    AwardService(db).run_cron_tick()
    assert mocked.call_count == 1
