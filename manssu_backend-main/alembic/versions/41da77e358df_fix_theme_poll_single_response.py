"""fix_theme_poll_single_response

Revision ID: 41da77e358df
Revises: d4d72a157570
Create Date: 2026-01-08 12:20:12.950466

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41da77e358df'
down_revision: Union[str, None] = 'd4d72a157570'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update questions for the specific poll to allow multiple responses
    # Poll ID: 88a6c301-4930-4f7e-b843-7fef2763adbe
    connection = op.get_bind()
    
    # Check if poll exists and update its questions
    poll_exists = connection.execute(
        sa.text("SELECT COUNT(*) FROM polls WHERE id = CAST(:poll_id AS uuid)"),
        {"poll_id": "88a6c301-4930-4f7e-b843-7fef2763adbe"}
    ).scalar()
    
    if poll_exists > 0:
        # Update all questions for this poll to allow multiple responses
        result = connection.execute(
            sa.text("""
                UPDATE poll_questions
                SET single_response = false
                WHERE poll_id = CAST(:poll_id AS uuid)
            """),
            {"poll_id": "88a6c301-4930-4f7e-b843-7fef2763adbe"}
        )
        print(f"Updated {result.rowcount} question(s) for poll 88a6c301-4930-4f7e-b843-7fef2763adbe to allow multiple responses")
    else:
        print("Poll 88a6c301-4930-4f7e-b843-7fef2763adbe not found, skipping update")


def downgrade() -> None:
    # Revert questions for the specific poll back to single response
    connection = op.get_bind()
    
    poll_exists = connection.execute(
        sa.text("SELECT COUNT(*) FROM polls WHERE id = CAST(:poll_id AS uuid)"),
        {"poll_id": "88a6c301-4930-4f7e-b843-7fef2763adbe"}
    ).scalar()
    
    if poll_exists > 0:
        connection.execute(
            sa.text("""
                UPDATE poll_questions
                SET single_response = true
                WHERE poll_id = CAST(:poll_id AS uuid)
            """),
            {"poll_id": "88a6c301-4930-4f7e-b843-7fef2763adbe"}
        )

