from __future__ import annotations

import uuid

from sqlalchemy import BigInteger, CheckConstraint, Date, ForeignKey, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import Computed

from backend.extensions import db


class User(db.Model):
	__tablename__ = "users"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	full_name: Mapped[str] = mapped_column(db.String, nullable=False)
	email: Mapped[str | None] = mapped_column(db.String, unique=True)
	password_hash: Mapped[str | None] = mapped_column(Text)
	is_admin: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("false"))
	is_active: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	profile: Mapped[Profile | None] = relationship("Profile", back_populates="user", uselist=False)
	settings: Mapped[UserSettings | None] = relationship("UserSettings", back_populates="user", uselist=False)
	media_assets: Mapped[list[MediaAsset]] = relationship("MediaAsset", back_populates="user")
	study_sessions: Mapped[list[StudySession]] = relationship("StudySession", back_populates="user")
	projects: Mapped[list[Project]] = relationship("Project", back_populates="user")
	certificates: Mapped[list[Certificate]] = relationship("Certificate", back_populates="user")
	language_sessions: Mapped[list[LanguageSession]] = relationship("LanguageSession", back_populates="user")
	code_entries: Mapped[list[CodeEntry]] = relationship("CodeEntry", back_populates="user")
	websites: Mapped[list[Website]] = relationship("Website", back_populates="user")
	dashboards: Mapped[list[Dashboard]] = relationship("Dashboard", back_populates="user")
	activities: Mapped[list[Activity]] = relationship("Activity", back_populates="user")


class Profile(db.Model):
	__tablename__ = "profiles"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="CASCADE"),
		nullable=False,
		unique=True,
	)
	display_name: Mapped[str] = mapped_column(db.String, nullable=False)
	headline: Mapped[str | None] = mapped_column(db.String)
	biography: Mapped[str | None] = mapped_column(Text)
	purpose: Mapped[str | None] = mapped_column(Text)
	profile_image_url: Mapped[str | None] = mapped_column(Text)
	birth_date: Mapped[object | None] = mapped_column(Date)
	location: Mapped[str | None] = mapped_column(db.String)
	technologies: Mapped[list[str]] = mapped_column(
		ARRAY(Text), nullable=False, server_default=text("ARRAY[]::text[]")
	)
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="profile")


class MediaAsset(db.Model):
	__tablename__ = "media_assets"
	__table_args__ = (
		CheckConstraint(
			"category IN ('profile_image', 'certificate_image', 'certificate_pdf', 'project_video', 'site_video', 'dashboard_video')",
			name="media_assets_category_check",
		),
		CheckConstraint(
			"duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 60)",
			name="media_assets_duration_check",
		),
		CheckConstraint("size_bytes >= 0", name="media_assets_size_check"),
		CheckConstraint(
			"category NOT IN ('project_video', 'site_video', 'dashboard_video') OR duration_seconds IS NOT NULL",
			name="media_assets_video_duration_required_check",
		),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	category: Mapped[str] = mapped_column(db.String, nullable=False)
	original_name: Mapped[str] = mapped_column(db.String, nullable=False)
	stored_name: Mapped[str] = mapped_column(db.String, nullable=False)
	storage_path: Mapped[str] = mapped_column(Text, nullable=False)
	mime_type: Mapped[str] = mapped_column(db.String, nullable=False)
	size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
	duration_seconds: Mapped[int | None] = mapped_column(db.Integer)
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="media_assets")
	certificates: Mapped[list[Certificate]] = relationship("Certificate", back_populates="asset")
	project_videos: Mapped[list[Project]] = relationship(
		"Project",
		back_populates="video_asset",
		foreign_keys="Project.video_asset_id",
	)
	website_videos: Mapped[list[Website]] = relationship(
		"Website",
		back_populates="video_asset",
		foreign_keys="Website.video_asset_id",
	)
	dashboard_videos: Mapped[list[Dashboard]] = relationship(
		"Dashboard",
		back_populates="video_asset",
		foreign_keys="Dashboard.video_asset_id",
	)


class StudySession(db.Model):
	__tablename__ = "study_sessions"
	__table_args__ = (
		CheckConstraint("hours >= 0 AND hours <= 23", name="study_sessions_hours_check"),
		CheckConstraint("minutes >= 0 AND minutes <= 59", name="study_sessions_minutes_check"),
		CheckConstraint("(hours * 60) + minutes > 0", name="study_sessions_duration_check"),
		CheckConstraint("btrim(subject) <> ''", name="study_sessions_subject_not_empty"),
		CheckConstraint("btrim(content) <> ''", name="study_sessions_content_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	study_date: Mapped[object] = mapped_column(Date, nullable=False)
	subject: Mapped[str] = mapped_column(db.String, nullable=False)
	hours: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
	minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
	total_minutes: Mapped[int] = mapped_column(
		db.Integer,
		Computed("((hours)::integer * 60) + (minutes)::integer", persisted=True),
	)
	xp: Mapped[int] = mapped_column(
		db.Integer,
		Computed("(((hours)::integer * 60) + (minutes)::integer) * 10", persisted=True),
	)
	content: Mapped[str] = mapped_column(Text, nullable=False)
	notes: Mapped[str | None] = mapped_column(Text)
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="study_sessions")


class Project(db.Model):
	__tablename__ = "projects"
	__table_args__ = (
		CheckConstraint(
			"status IN ('planning', 'in_progress', 'active', 'completed', 'archived')",
			name="projects_status_check",
		),
		CheckConstraint("btrim(title) <> ''", name="projects_title_not_empty"),
		CheckConstraint("btrim(history) <> ''", name="projects_history_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	technologies: Mapped[list[str]] = mapped_column(
		ARRAY(Text), nullable=False, server_default=text("ARRAY[]::text[]")
	)
	history: Mapped[str] = mapped_column(Text, nullable=False)
	video_asset_id: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="SET NULL")
	)
	status: Mapped[str] = mapped_column(
		db.String, nullable=False, server_default=text("'active'::character varying")
	)
	is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="projects")
	video_asset: Mapped[MediaAsset | None] = relationship(
		"MediaAsset",
		back_populates="project_videos",
		foreign_keys=[video_asset_id],
	)


class Certificate(db.Model):
	__tablename__ = "certificates"
	__table_args__ = (
		CheckConstraint("btrim(title) <> ''", name="certificates_title_not_empty"),
		CheckConstraint("btrim(description) <> ''", name="certificates_description_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	institution: Mapped[str | None] = mapped_column(db.String)
	certificate_date: Mapped[object | None] = mapped_column(Date)
	asset_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False
	)
	is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="certificates")
	asset: Mapped[MediaAsset] = relationship("MediaAsset", back_populates="certificates")
	language_sessions: Mapped[list[LanguageSession]] = relationship(
		"LanguageSession", back_populates="certificate"
	)


class LanguageSession(db.Model):
	__tablename__ = "language_sessions"
	__table_args__ = (
		CheckConstraint("hours >= 0 AND hours <= 23", name="language_sessions_hours_check"),
		CheckConstraint("minutes >= 0 AND minutes <= 59", name="language_sessions_minutes_check"),
		CheckConstraint("(hours * 60) + minutes > 0", name="language_sessions_duration_check"),
		CheckConstraint(
			"language IN ('english', 'spanish')",
			name="language_sessions_language_check",
		),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	session_date: Mapped[object] = mapped_column(Date, nullable=False)
	language: Mapped[str] = mapped_column(db.String, nullable=False)
	hours: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
	minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
	total_minutes: Mapped[int] = mapped_column(
		db.Integer,
		Computed("((hours)::integer * 60) + (minutes)::integer", persisted=True),
	)
	certificate_id: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True), ForeignKey("certificates.id", ondelete="SET NULL")
	)
	notes: Mapped[str | None] = mapped_column(Text)
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="language_sessions")
	certificate: Mapped[Certificate | None] = relationship("Certificate", back_populates="language_sessions")


class CodeEntry(db.Model):
	__tablename__ = "code_entries"
	__table_args__ = (
		CheckConstraint("origin IN ('author', 'ai')", name="code_entries_origin_check"),
		CheckConstraint("btrim(title) <> ''", name="code_entries_title_not_empty"),
		CheckConstraint("btrim(language) <> ''", name="code_entries_language_not_empty"),
		CheckConstraint("btrim(code) <> ''", name="code_entries_code_not_empty"),
		CheckConstraint("btrim(explanation) <> ''", name="code_entries_explanation_not_empty"),
		CheckConstraint(
			"origin <> 'author' OR (ai_tool IS NULL AND prompt_used IS NULL)",
			name="code_entries_ai_metadata_check",
		),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	origin: Mapped[str] = mapped_column(db.String, nullable=False)
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	language: Mapped[str] = mapped_column(db.String, nullable=False)
	code: Mapped[str] = mapped_column(Text, nullable=False)
	explanation: Mapped[str] = mapped_column(Text, nullable=False)
	ai_tool: Mapped[str | None] = mapped_column(db.String)
	prompt_used: Mapped[str | None] = mapped_column(Text)
	is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="code_entries")


class Website(db.Model):
	__tablename__ = "websites"
	__table_args__ = (
		CheckConstraint("btrim(title) <> ''", name="websites_title_not_empty"),
		CheckConstraint("btrim(url) <> ''", name="websites_url_not_empty"),
		CheckConstraint("url ~* '^https?://'", name="websites_url_format_check"),
		CheckConstraint("btrim(description) <> ''", name="websites_description_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	url: Mapped[str] = mapped_column(Text, nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	video_asset_id: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="SET NULL")
	)
	is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="websites")
	video_asset: Mapped[MediaAsset | None] = relationship(
		"MediaAsset",
		back_populates="website_videos",
		foreign_keys=[video_asset_id],
	)


class Dashboard(db.Model):
	__tablename__ = "dashboards"
	__table_args__ = (
		CheckConstraint("btrim(title) <> ''", name="dashboards_title_not_empty"),
		CheckConstraint("btrim(link) <> ''", name="dashboards_link_not_empty"),
		CheckConstraint("link ~* '^https?://'", name="dashboards_link_format_check"),
		CheckConstraint("btrim(description) <> ''", name="dashboards_description_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	link: Mapped[str] = mapped_column(Text, nullable=False)
	description: Mapped[str] = mapped_column(Text, nullable=False)
	tool: Mapped[str | None] = mapped_column(db.String)
	video_asset_id: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="SET NULL")
	)
	is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, server_default=text("true"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="dashboards")
	video_asset: Mapped[MediaAsset | None] = relationship(
		"MediaAsset",
		back_populates="dashboard_videos",
		foreign_keys=[video_asset_id],
	)


class Activity(db.Model):
	__tablename__ = "activities"
	__table_args__ = (
		CheckConstraint(
			"module IN ('study', 'project', 'language', 'certificate', 'author_code', 'ai_code', 'website', 'dashboard', 'profile')",
			name="activities_module_check",
		),
		CheckConstraint(
			"action IN ('created', 'updated', 'deleted', 'completed', 'published')",
			name="activities_action_check",
		),
		CheckConstraint("btrim(title) <> ''", name="activities_title_not_empty"),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
	)
	module: Mapped[str] = mapped_column(db.String, nullable=False)
	action: Mapped[str] = mapped_column(db.String, nullable=False)
	entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
	title: Mapped[str] = mapped_column(db.String, nullable=False)
	description: Mapped[str | None] = mapped_column(Text)
	metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
	occurred_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="activities")


class UserSettings(db.Model):
	__tablename__ = "user_settings"
	__table_args__ = (
		CheckConstraint(
			"preferred_theme IN ('dark', 'light', 'system')",
			name="user_settings_theme_check",
		),
	)

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		server_default=text("gen_random_uuid()"),
	)
	user_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="CASCADE"),
		nullable=False,
		unique=True,
	)
	admin_mode_enabled: Mapped[bool] = mapped_column(
		db.Boolean, nullable=False, server_default=text("true")
	)
	public_profile_enabled: Mapped[bool] = mapped_column(
		db.Boolean, nullable=False, server_default=text("true")
	)
	preferred_theme: Mapped[str] = mapped_column(
		db.String, nullable=False, server_default=text("'dark'::character varying")
	)
	preferred_language: Mapped[str] = mapped_column(
		db.String, nullable=False, server_default=text("'pt-BR'::character varying")
	)
	settings: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
	created_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)
	updated_at: Mapped[object] = mapped_column(
		TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
	)

	user: Mapped[User] = relationship("User", back_populates="settings")


__all__ = [
	"Activity",
	"Certificate",
	"CodeEntry",
	"Dashboard",
	"LanguageSession",
	"MediaAsset",
	"Profile",
	"Project",
	"StudySession",
	"User",
	"UserSettings",
	"Website",
]
