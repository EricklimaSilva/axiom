from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint
from sqlalchemy import text

from extensions import db


STATUS_VALUES = ("planning", "in_progress", "active", "completed", "archived")
CODE_TYPE_VALUES = ("AUTHOR", "AI_ASSISTED")


class TimestampMixin:
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.current_timestamp(),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )


class StudyEntry(db.Model, TimestampMixin):
    __tablename__ = "study_sessions"
    __table_args__ = (
        CheckConstraint("duration_minutes >= 1", name="study_sessions_duration_minutes_check"),
    )

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    category = db.Column(db.String(120), nullable=False)
    technology = db.Column(db.String(120), nullable=True)
    subject = db.Column(db.String(255), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Legacy-compatible fields kept so older imports and future data migrations have room.
    hours = db.Column(db.Integer, nullable=True)
    minutes = db.Column(db.Integer, nullable=True)
    content = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    xp = db.Column(db.Integer, nullable=True)


class Project(db.Model, TimestampMixin):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(40), nullable=False, server_default=text("'planning'"))
    technologies = db.Column(db.JSON, nullable=False, server_default=text("'[]'"))
    repository_url = db.Column(db.Text, nullable=True)
    project_url = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.Date, nullable=True)
    completed_at = db.Column(db.Date, nullable=True)

    title = db.Column(db.String(255), nullable=True)
    history = db.Column(db.Text, nullable=True)
    media_url = db.Column(db.Text, nullable=True)
    media_type = db.Column(db.String(80), nullable=True)
    logic_description = db.Column(db.Text, nullable=True)
    is_public = db.Column(db.Boolean, nullable=False, server_default=db.text("true"))

    __table_args__ = (
        CheckConstraint(
            "status IN ('planning', 'in_progress', 'active', 'completed', 'archived')",
            name="projects_status_check",
        ),
    )


class LanguageStudy(db.Model, TimestampMixin):
    __tablename__ = "language_studies"

    id = db.Column(db.Integer, primary_key=True)
    language = db.Column(db.String(120), nullable=False)
    level = db.Column(db.String(80), nullable=False)
    activity = db.Column(db.String(120), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=True)


class Certificate(db.Model, TimestampMixin):
    __tablename__ = "certificates"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    institution = db.Column(db.String(255), nullable=True)
    issue_date = db.Column(db.Date, nullable=True)
    certificate_url = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    cover_image_path = db.Column(db.Text, nullable=True)


class CodeProject(db.Model, TimestampMixin):
    __tablename__ = "code_projects"
    __table_args__ = (
        CheckConstraint(
            "type IN ('AUTHOR', 'AI_ASSISTED')",
            name="code_projects_type_check",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    code_content = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(40), nullable=False)
    technology = db.Column(db.String(120), nullable=True)
    repository_url = db.Column(db.Text, nullable=True)


class Site(db.Model, TimestampMixin):
    __tablename__ = "sites"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.Text, nullable=False)
    repository_url = db.Column(db.Text, nullable=True)
    technologies = db.Column(db.JSON, nullable=False, server_default=text("'[]'"))
    status = db.Column(db.String(80), nullable=False, server_default=text("'active'"))


class DashboardProject(db.Model, TimestampMixin):
    __tablename__ = "dashboard_projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tool = db.Column(db.String(120), nullable=True)
    project_url = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.Text, nullable=True)


class Setting(db.Model, TimestampMixin):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(255), nullable=False, unique=True)
    value = db.Column(db.Text, nullable=False)


def as_technology_list(value):
    if value in (None, ""):
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, tuple):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, str):
        parts = [part.strip() for part in value.split(",")]
        return [part for part in parts if part]

    return [str(value).strip()]


def to_iso_date(value):
    if value is None:
        return None

    if isinstance(value, str):
        return value

    if isinstance(value, datetime):
        return value.date().isoformat()

    return value.isoformat()
