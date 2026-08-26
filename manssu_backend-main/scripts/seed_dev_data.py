#!/usr/bin/env python3
"""
Seed the local dev database with demo data across every domain.

Idempotent-ish: skips creation if the super admin already exists, but will
happily add duplicate rows otherwise if run twice. Intended for local/dev use.

Usage:
    source .venv/bin/activate
    python -m scripts.seed_dev_data
"""
import sys
import uuid
from pathlib import Path
from datetime import datetime, timedelta, date, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.user import User
from app.models.location import Location
from app.models.session import Session, SessionObjective, SessionRegistration
from app.models.theme import Theme, ThemeProposalWindow
from app.models.resource import Resource
from app.models.feedback import Feedback
from app.models.poll import Poll, PollQuestion, PollOption, PollVote
from app.models.questionnaire import (
    Questionnaire,
    QuestionnaireQuestion,
    QuestionnaireOption,
)
from app.models.commission import Commission, CommissionMember
from app.models.work_group import WorkGroup, WorkGroupMember
from app.models.library import Book, BookWishlistItem
from app.models.activity_template import ActivityTemplate

now = datetime.now(timezone.utc)


def uid():
    return uuid.uuid4()


def make_user(db, email, first_name, last_name, role="member", **kwargs):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing
    user = User(
        id=uid(),
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        status="active",
        password_hash=None,
        member_since=now,
        created_at=now,
        updated_at=now,
        **kwargs,
    )
    db.add(user)
    db.flush()
    return user


def seed():
    db = SessionLocal()
    try:
        print("Seeding users...")
        super_admin = make_user(
            db, "malik.nassourou@yahoo.fr", "Malik", "Nassourou", role="super_admin"
        )
        admin = make_user(db, "admin@manssuetude.com", "Amina", "Diallo", role="admin")
        members = [
            make_user(db, "claire.martin@example.com", "Claire", "Martin"),
            make_user(db, "hugo.bernard@example.com", "Hugo", "Bernard"),
            make_user(db, "lea.dubois@example.com", "Léa", "Dubois"),
            make_user(db, "yanis.moreau@example.com", "Yanis", "Moreau"),
            make_user(db, "sofia.petit@example.com", "Sofia", "Petit"),
            make_user(db, "nathan.roux@example.com", "Nathan", "Roux"),
        ]
        guest = make_user(db, "guest.invite@example.com", "Guest", "Invité", role="guest")
        db.commit()
        all_members = [admin] + members

        print("Seeding locations...")
        loc1 = Location(
            id=uid(),
            name="Salle Manssuétude Centre",
            address="12 rue de la Paix, 75002 Paris",
            instructions="Interphone 'Manssuétude', 2e étage.",
        )
        loc2 = Location(
            id=uid(),
            name="Espace Coworking Belleville",
            address="45 rue de Belleville, 75020 Paris",
            instructions="Accès badge à l'accueil.",
        )
        db.add_all([loc1, loc2])
        db.commit()

        print("Seeding activity templates...")
        templates = [
            ActivityTemplate(
                id=uid(),
                title="Atelier de discussion",
                description="Échange structuré en petit groupe autour d'un thème.",
                color="primary",
                icon="MessageCircle",
                rules=["Respect de la parole de chacun", "Confidentialité des échanges"],
                duration="2h",
                examples=["Débat sur la liberté", "Table ronde éthique"],
            ),
            ActivityTemplate(
                id=uid(),
                title="Conférence",
                description="Intervention d'un invité suivie de questions.",
                color="accent",
                icon="Mic",
                rules=["Questions en fin de session"],
                duration="1h30",
                examples=["Conférence sur la philosophie stoïcienne"],
            ),
        ]
        db.add_all(templates)
        db.commit()

        print("Seeding theme proposal window + themes...")
        window = ThemeProposalWindow(
            id=uid(),
            start_date=now - timedelta(days=10),
            end_date=now + timedelta(days=20),
            is_active=True,
            created_by=admin.id,
        )
        db.add(window)
        db.commit()

        themes = [
            Theme(
                id=uid(),
                title="Le libre arbitre existe-t-il ?",
                description="Discussion sur le déterminisme et la liberté individuelle.",
                category="Philosophie",
                status="current",
                submitted_by=members[0].id,
                window_id=window.id,
                likes=5,
            ),
            Theme(
                id=uid(),
                title="Intelligence artificielle et éthique",
                description="Quels garde-fous moraux pour l'IA ?",
                category="Technologie",
                status="approved",
                submitted_by=members[1].id,
                window_id=window.id,
                likes=8,
            ),
            Theme(
                id=uid(),
                title="La désobéissance civile est-elle légitime ?",
                description="Étude de cas historiques et contemporains.",
                category="Politique",
                status="pending",
                submitted_by=members[2].id,
                window_id=window.id,
                likes=2,
            ),
        ]
        db.add_all(themes)
        db.commit()

        print("Seeding sessions...")
        session_past = Session(
            id=uid(),
            title="Le libre arbitre existe-t-il ?",
            description="Session inaugurale sur le déterminisme.",
            theme="Philosophie",
            type="workshop",
            date=(now - timedelta(days=14)).date(),
            start_time="18:30",
            end_time="20:30",
            duration="2h",
            location_id=loc1.id,
            is_online=False,
            max_participants=20,
            registered=4,
            status="completed",
        )
        session_upcoming = Session(
            id=uid(),
            title="Intelligence artificielle et éthique",
            description="Débat autour des garde-fous moraux de l'IA.",
            theme="Technologie",
            type="conference",
            date=(now + timedelta(days=7)).date(),
            start_time="19:00",
            end_time="21:00",
            duration="2h",
            location_id=loc2.id,
            is_online=False,
            max_participants=30,
            registered=2,
            status="upcoming",
        )
        session_online = Session(
            id=uid(),
            title="Groupe de travail bibliothèque",
            description="Point d'avancement sur les acquisitions.",
            theme="Organisation",
            type="group",
            date=(now + timedelta(days=3)).date(),
            start_time="12:30",
            end_time="13:30",
            duration="1h",
            is_online=True,
            max_participants=10,
            registered=0,
            status="upcoming",
        )
        db.add_all([session_past, session_upcoming, session_online])
        db.commit()

        db.add_all(
            [
                SessionObjective(
                    id=uid(), session_id=session_past.id, objective="Définir le déterminisme", order_index=0
                ),
                SessionObjective(
                    id=uid(), session_id=session_past.id, objective="Explorer les positions compatibilistes", order_index=1
                ),
                SessionObjective(
                    id=uid(), session_id=session_upcoming.id, objective="Cartographier les risques éthiques de l'IA", order_index=0
                ),
            ]
        )
        db.add_all(
            [
                SessionRegistration(
                    id=uid(), session_id=session_past.id, user_id=members[0].id, attended=True, rating=5, comment="Très riche"
                ),
                SessionRegistration(
                    id=uid(), session_id=session_past.id, user_id=members[1].id, attended=True, rating=4
                ),
                SessionRegistration(
                    id=uid(), session_id=session_upcoming.id, user_id=members[2].id
                ),
                SessionRegistration(
                    id=uid(), session_id=session_upcoming.id, user_id=members[3].id
                ),
            ]
        )
        db.commit()

        print("Seeding work groups...")
        wg = WorkGroup(id=uid(), session_id=session_past.id, name="Groupe A", letter="A", color="primary")
        db.add(wg)
        db.commit()
        db.add_all(
            [
                WorkGroupMember(id=uid(), work_group_id=wg.id, user_id=members[0].id, is_leader=True),
                WorkGroupMember(id=uid(), work_group_id=wg.id, user_id=members[1].id),
            ]
        )
        db.commit()

        print("Seeding resources...")
        db.add_all(
            [
                Resource(
                    id=uid(),
                    title="Introduction au déterminisme",
                    description="Article de synthèse sur le sujet.",
                    type="file",
                    link="https://example.com/resources/determinisme.pdf",
                    category="Philosophie",
                    session_id=session_past.id,
                    status="approved",
                    created_by=admin.id,
                ),
                Resource(
                    id=uid(),
                    title="Conférence : IA et société",
                    description="Enregistrement vidéo d'une conférence externe.",
                    type="video",
                    link="https://example.com/videos/ia-societe",
                    category="Technologie",
                    session_id=session_upcoming.id,
                    status="pending",
                    created_by=members[2].id,
                ),
            ]
        )
        db.commit()

        print("Seeding feedbacks...")
        db.add_all(
            [
                Feedback(
                    id=uid(),
                    category="session",
                    type="suggestion",
                    subject="Durée de la session",
                    message="Pourrait être un peu plus longue.",
                    submitted_by=members[0].id,
                    status="new",
                    rating=4,
                    session_id=session_past.id,
                ),
                Feedback(
                    id=uid(),
                    category="general",
                    type="compliment",
                    subject="Super ambiance",
                    message="Bravo pour l'organisation générale.",
                    anonymous=True,
                    status="read",
                ),
            ]
        )
        db.commit()

        print("Seeding poll...")
        poll = Poll(
            id=uid(),
            title="Choix du prochain thème",
            description="Votez pour le thème de la session de rentrée.",
            status="active",
            results_visibility="realtime",
            anonymous=False,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=14),
        )
        db.add(poll)
        db.commit()

        q1 = PollQuestion(
            id=uid(), poll_id=poll.id, question="Quel thème préférez-vous ?", single_response=True, order_index=0
        )
        db.add(q1)
        db.commit()

        opt1 = PollOption(id=uid(), question_id=q1.id, label="Libre arbitre", color="primary", order_index=0)
        opt2 = PollOption(id=uid(), question_id=q1.id, label="IA et éthique", color="accent", order_index=1)
        db.add_all([opt1, opt2])
        db.commit()

        db.add_all(
            [
                PollVote(id=uid(), poll_id=poll.id, question_id=q1.id, option_id=opt1.id, user_id=members[0].id),
                PollVote(id=uid(), poll_id=poll.id, question_id=q1.id, option_id=opt2.id, user_id=members[1].id),
            ]
        )
        db.commit()

        print("Seeding questionnaire...")
        questionnaire = Questionnaire(
            id=uid(),
            title="Questionnaire de satisfaction annuel",
            description="Merci de prendre 5 minutes pour répondre.",
            status="published",
            start_date=now,
            end_date=now + timedelta(days=30),
        )
        db.add(questionnaire)
        db.commit()

        qq1 = QuestionnaireQuestion(
            id=uid(),
            questionnaire_id=questionnaire.id,
            question="Recommanderiez-vous l'association ?",
            type="rating",
            required=True,
            order_index=0,
        )
        qq2 = QuestionnaireQuestion(
            id=uid(),
            questionnaire_id=questionnaire.id,
            question="Quel format préférez-vous ?",
            type="single_choice",
            required=False,
            order_index=1,
        )
        db.add_all([qq1, qq2])
        db.commit()

        db.add_all(
            [
                QuestionnaireOption(id=uid(), question_id=qq2.id, label="Atelier", order_index=0),
                QuestionnaireOption(id=uid(), question_id=qq2.id, label="Conférence", order_index=1),
            ]
        )
        db.commit()

        print("Seeding commissions...")
        commission = Commission(
            id=uid(),
            name="Commission Communication",
            description="Gère la communication externe de l'association.",
            max_members=8,
            leader_id=members[3].id,
            status="active",
        )
        db.add(commission)
        db.commit()
        db.add_all(
            [
                CommissionMember(id=uid(), commission_id=commission.id, user_id=members[3].id),
                CommissionMember(id=uid(), commission_id=commission.id, user_id=members[4].id),
            ]
        )
        db.commit()

        print("Seeding library...")
        book = Book(
            id=uid(),
            owner_id=members[0].id,
            title="Méditations",
            author="Marc Aurèle",
            description="Édition de poche, bon état.",
            category="Philosophie antique",
            page_count=250,
            language="Français",
            condition="good",
            availability_mode="always",
            status="available",
            default_loan_days=21,
        )
        db.add(book)
        db.add(
            BookWishlistItem(
                id=uid(),
                user_id=members[1].id,
                title="Ainsi parlait Zarathoustra",
                author="Nietzsche",
                is_active=True,
            )
        )
        db.commit()

        print("\nSeed complete.")
        print(f"  Super admin: {super_admin.email}")
        print(f"  Admin:       {admin.email}")
        print(f"  Members:     {', '.join(m.email for m in members)}")
        print(f"  Guest:       {guest.email}")
        print("\nLog in with any of these emails via the OTP flow.")
        print("RESEND_API_KEY is empty in .env, so OTP codes are printed to the backend log instead of emailed.")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        import traceback

        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
