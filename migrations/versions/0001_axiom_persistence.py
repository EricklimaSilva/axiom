"""Create Axiom persistence schema.

Revision ID: 0001_axiom_persistence
Revises: 
Create Date: 2026-09-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_axiom_persistence"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "study_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("technology", sa.String(length=120), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("hours", sa.Integer(), nullable=True),
        sa.Column("minutes", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("xp", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("duration_minutes >= 1", name="study_sessions_duration_minutes_check"),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default=sa.text("'planning'")),
        sa.Column("technologies", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("repository_url", sa.Text(), nullable=True),
        sa.Column("project_url", sa.Text(), nullable=True),
        sa.Column("started_at", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.Date(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("history", sa.Text(), nullable=True),
        sa.Column("media_url", sa.Text(), nullable=True),
        sa.Column("media_type", sa.String(length=80), nullable=True),
        sa.Column("logic_description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(
            "status IN ('planning', 'in_progress', 'active', 'completed', 'archived')",
            name="projects_status_check",
        ),
    )

    op.create_table(
        "language_studies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("language", sa.String(length=120), nullable=False),
        sa.Column("level", sa.String(length=80), nullable=False),
        sa.Column("activity", sa.String(length=120), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("duration_minutes >= 1", name="language_studies_duration_minutes_check"),
    )

    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("institution", sa.String(length=255), nullable=True),
        sa.Column("issue_date", sa.Date(), nullable=True),
        sa.Column("certificate_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "code_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("code_content", sa.Text(), nullable=True),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("technology", sa.String(length=120), nullable=True),
        sa.Column("repository_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("type IN ('AUTHOR', 'AI_ASSISTED')", name="code_projects_type_check"),
    )

    op.create_table(
        "sites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("repository_url", sa.Text(), nullable=True),
        sa.Column("technologies", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("status", sa.String(length=80), nullable=False, server_default=sa.text("'active'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "dashboard_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tool", sa.String(length=120), nullable=True),
        sa.Column("project_url", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=255), nullable=False, unique=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )


def downgrade():
    op.drop_table("settings")
    op.drop_table("dashboard_projects")
    op.drop_table("sites")
    op.drop_table("code_projects")
    op.drop_table("certificates")
    op.drop_table("language_studies")
    op.drop_table("projects")
    op.drop_table("study_sessions")
