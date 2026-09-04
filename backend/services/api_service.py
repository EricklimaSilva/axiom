from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import func

from axiom_models import (
    Certificate,
    CodeProject,
    DashboardProject,
    LanguageStudy,
    Project,
    Setting,
    Site,
    StudyEntry,
    as_technology_list,
)
from extensions import db


class ValidationError(Exception):
    pass


class NotFoundError(Exception):
    pass


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

def _ensure_dict(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("Payload inválido.")
    return payload


def _string(value: Any, field_name: str, required: bool = False) -> str | None:
    if value is None:
        if required:
            raise ValidationError(f"O campo '{field_name}' é obrigatório.")
        return None

    if not isinstance(value, str):
        raise ValidationError(f"O campo '{field_name}' deve ser texto.")

    normalized = value.strip()
    if required and not normalized:
        raise ValidationError(f"O campo '{field_name}' é obrigatório.")

    return normalized or None


def _date(value: Any, field_name: str, required: bool = False) -> date | None:
    if value in (None, ""):
        if required:
            raise ValidationError(f"O campo '{field_name}' é obrigatório.")
        return None

    if isinstance(value, date) and not isinstance(value, datetime):
        return value

    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError as exc:
            raise ValidationError(f"O campo '{field_name}' deve estar no formato YYYY-MM-DD.") from exc

    raise ValidationError(f"O campo '{field_name}' deve ser uma data válida.")


def _integer(value: Any, field_name: str, required: bool = False, minimum: int | None = None) -> int | None:
    if value in (None, ""):
        if required:
            raise ValidationError(f"O campo '{field_name}' é obrigatório.")
        return None

    if isinstance(value, bool):
        raise ValidationError(f"O campo '{field_name}' deve ser um número inteiro.")

    try:
        normalized = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"O campo '{field_name}' deve ser um número inteiro.") from exc

    if minimum is not None and normalized < minimum:
        raise ValidationError(f"O campo '{field_name}' deve ser maior ou igual a {minimum}.")

    return normalized


def _status(value: Any) -> str:
    normalized = _string(value, "status", required=False) or "planning"
    allowed = {"planning", "in_progress", "active", "completed", "archived"}
    if normalized not in allowed:
        raise ValidationError("Status inválido.")
    return normalized


def _code_type(value: Any) -> str:
    normalized = _string(value, "type", required=False) or "AUTHOR"
    allowed = {"AUTHOR", "AI_ASSISTED"}
    if normalized not in allowed:
        raise ValidationError("Tipo de código inválido.")
    return normalized


def _duration_from_payload(payload: dict[str, Any]) -> tuple[int, int | None, int | None]:
    duration_minutes = _integer(payload.get("duration_minutes"), "duration_minutes")
    hours = _integer(payload.get("hours"), "hours")
    minutes = _integer(payload.get("minutes"), "minutes")

    if duration_minutes is None:
        if hours is None and minutes is None:
            raise ValidationError("Informe a duração em minutos ou em horas e minutos.")
        hours = hours or 0
        minutes = minutes or 0
        duration_minutes = (hours * 60) + minutes
    elif duration_minutes < 1:
        raise ValidationError("A duração deve ser maior que zero.")

    if duration_minutes < 1:
        raise ValidationError("A duração deve ser maior que zero.")

    return duration_minutes, hours, minutes


def _pagination_sort(items: list[Any], key_name: str = "created_at") -> list[Any]:
    return sorted(items, key=lambda item: getattr(item, key_name) or datetime.min, reverse=True)


def _save(instance):
    db.session.add(instance)
    db.session.commit()
    return instance


def _delete(instance):
    db.session.delete(instance)
    db.session.commit()


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def serialize_study(study: StudyEntry) -> dict[str, Any]:
    duration_minutes = int(study.duration_minutes or 0)
    hours, minutes = divmod(duration_minutes, 60)
    return {
        "id": study.id,
        "date": study.date.isoformat() if study.date else None,
        "category": study.category,
        "technology": study.technology,
        "subject": study.subject,
        "duration_minutes": duration_minutes,
        "hours": hours,
        "minutes": minutes,
        "duration": f"{duration_minutes // 60}h{duration_minutes % 60:02d}" if duration_minutes >= 60 else f"{duration_minutes}min",
        "description": study.description,
        "content": study.content,
        "notes": study.notes,
        "xp": study.xp if study.xp is not None else duration_minutes * 10,
        "created_at": study.created_at.isoformat() if study.created_at else None,
        "updated_at": study.updated_at.isoformat() if study.updated_at else None,
    }


def serialize_project(project: Project) -> dict[str, Any]:
    return {
        "id": project.id,
        "name": project.name,
        "title": project.title or project.name,
        "description": project.description,
        "status": project.status,
        "technologies": project.technologies or [],
        "repository_url": project.repository_url,
        "project_url": project.project_url,
        "started_at": project.started_at.isoformat() if project.started_at else None,
        "completed_at": project.completed_at.isoformat() if project.completed_at else None,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


def serialize_language(language: LanguageStudy) -> dict[str, Any]:
    return {
        "id": language.id,
        "language": language.language,
        "level": language.level,
        "activity": language.activity,
        "duration_minutes": language.duration_minutes,
        "date": language.date.isoformat() if language.date else None,
        "notes": language.notes,
        "created_at": language.created_at.isoformat() if language.created_at else None,
        "updated_at": language.updated_at.isoformat() if language.updated_at else None,
    }


def serialize_certificate(certificate: Certificate) -> dict[str, Any]:
    return {
        "id": certificate.id,
        "name": certificate.name,
        "institution": certificate.institution,
        "issue_date": certificate.issue_date.isoformat() if certificate.issue_date else None,
        "certificate_url": certificate.certificate_url,
        "description": certificate.description,
        "created_at": certificate.created_at.isoformat() if certificate.created_at else None,
        "updated_at": certificate.updated_at.isoformat() if certificate.updated_at else None,
    }


def serialize_code(code: CodeProject) -> dict[str, Any]:
    return {
        "id": code.id,
        "title": code.title,
        "description": code.description,
        "code_content": code.code_content,
        "type": code.type,
        "technology": code.technology,
        "repository_url": code.repository_url,
        "created_at": code.created_at.isoformat() if code.created_at else None,
        "updated_at": code.updated_at.isoformat() if code.updated_at else None,
    }


def serialize_site(site: Site) -> dict[str, Any]:
    return {
        "id": site.id,
        "name": site.name,
        "description": site.description,
        "url": site.url,
        "repository_url": site.repository_url,
        "technologies": site.technologies or [],
        "status": site.status,
        "created_at": site.created_at.isoformat() if site.created_at else None,
        "updated_at": site.updated_at.isoformat() if site.updated_at else None,
    }


def serialize_dashboard_project(dashboard_project: DashboardProject) -> dict[str, Any]:
    return {
        "id": dashboard_project.id,
        "name": dashboard_project.name,
        "description": dashboard_project.description,
        "tool": dashboard_project.tool,
        "project_url": dashboard_project.project_url,
        "image_url": dashboard_project.image_url,
        "created_at": dashboard_project.created_at.isoformat() if dashboard_project.created_at else None,
        "updated_at": dashboard_project.updated_at.isoformat() if dashboard_project.updated_at else None,
    }


def serialize_setting(setting: Setting) -> dict[str, Any]:
    return {
        "id": setting.id,
        "key": setting.key,
        "value": setting.value,
        "created_at": setting.created_at.isoformat() if setting.created_at else None,
        "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
    }


# ---------------------------------------------------------------------------
# Study CRUD
# ---------------------------------------------------------------------------

def list_studies() -> list[dict[str, Any]]:
    studies = StudyEntry.query.order_by(StudyEntry.date.desc(), StudyEntry.created_at.desc()).all()
    return [serialize_study(study) for study in studies]


def get_study(study_id: int) -> dict[str, Any] | None:
    study = db.session.get(StudyEntry, study_id)
    if study is None:
        return None
    return serialize_study(study)


def create_study(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    duration_minutes, hours, minutes = _duration_from_payload(data)

    study = StudyEntry(
        date=_date(data.get("date"), "date", required=True),
        category=_string(data.get("category") or data.get("subject") or "Geral", "category", required=True),
        technology=_string(data.get("technology"), "technology"),
        subject=_string(data.get("subject") or data.get("content") or data.get("description") or "Estudo", "subject", required=True),
        duration_minutes=duration_minutes,
        description=_string(data.get("description") or data.get("content") or data.get("notes"), "description"),
        hours=hours,
        minutes=minutes,
        content=_string(data.get("content"), "content"),
        notes=_string(data.get("notes"), "notes"),
        xp=_integer(data.get("xp"), "xp") or (duration_minutes * 10),
    )
    _save(study)
    return serialize_study(study)


def update_study(study_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    study = db.session.get(StudyEntry, study_id)
    if study is None:
        return None

    data = _ensure_dict(payload)
    duration_minutes, hours, minutes = _duration_from_payload(data)

    study.date = _date(data.get("date"), "date", required=True)
    study.category = _string(data.get("category") or data.get("subject") or "Geral", "category", required=True)
    study.technology = _string(data.get("technology"), "technology")
    study.subject = _string(data.get("subject") or data.get("content") or data.get("description") or "Estudo", "subject", required=True)
    study.duration_minutes = duration_minutes
    study.description = _string(data.get("description") or data.get("content") or data.get("notes"), "description")
    study.hours = hours
    study.minutes = minutes
    study.content = _string(data.get("content"), "content")
    study.notes = _string(data.get("notes"), "notes")
    study.xp = _integer(data.get("xp"), "xp") or (duration_minutes * 10)

    _save(study)
    return serialize_study(study)


def delete_study(study_id: int) -> bool:
    study = db.session.get(StudyEntry, study_id)
    if study is None:
        return False
    _delete(study)
    return True


# ---------------------------------------------------------------------------
# Project CRUD
# ---------------------------------------------------------------------------

def list_projects() -> list[dict[str, Any]]:
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return [serialize_project(project) for project in projects]


def get_project(project_id: int) -> dict[str, Any] | None:
    project = db.session.get(Project, project_id)
    if project is None:
        return None
    return serialize_project(project)


def create_project(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    technologies = as_technology_list(data.get("technologies"))
    project = Project(
        name=_string(data.get("name") or data.get("title"), "name", required=True),
        title=_string(data.get("title") or data.get("name"), "title"),
        description=_string(data.get("description"), "description"),
        status=_status(data.get("status")),
        technologies=technologies,
        repository_url=_string(data.get("repository_url"), "repository_url"),
        project_url=_string(data.get("project_url"), "project_url"),
        started_at=_date(data.get("started_at"), "started_at"),
        completed_at=_date(data.get("completed_at"), "completed_at"),
        history=_string(data.get("history"), "history"),
        media_url=_string(data.get("media_url"), "media_url"),
        media_type=_string(data.get("media_type"), "media_type"),
        logic_description=_string(data.get("logic_description"), "logic_description"),
    )
    _save(project)
    return serialize_project(project)


def update_project(project_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    project = db.session.get(Project, project_id)
    if project is None:
        return None

    data = _ensure_dict(payload)
    project.name = _string(data.get("name") or data.get("title"), "name", required=True)
    project.title = _string(data.get("title") or data.get("name"), "title")
    project.description = _string(data.get("description"), "description")
    project.status = _status(data.get("status"))
    project.technologies = as_technology_list(data.get("technologies"))
    project.repository_url = _string(data.get("repository_url"), "repository_url")
    project.project_url = _string(data.get("project_url"), "project_url")
    project.started_at = _date(data.get("started_at"), "started_at")
    project.completed_at = _date(data.get("completed_at"), "completed_at")
    project.history = _string(data.get("history"), "history")
    project.media_url = _string(data.get("media_url"), "media_url")
    project.media_type = _string(data.get("media_type"), "media_type")
    project.logic_description = _string(data.get("logic_description"), "logic_description")

    _save(project)
    return serialize_project(project)


def delete_project(project_id: int) -> bool:
    project = db.session.get(Project, project_id)
    if project is None:
        return False
    _delete(project)
    return True


# ---------------------------------------------------------------------------
# Language CRUD
# ---------------------------------------------------------------------------

def list_languages() -> list[dict[str, Any]]:
    languages = LanguageStudy.query.order_by(LanguageStudy.date.desc(), LanguageStudy.id.desc()).all()
    return [serialize_language(language) for language in languages]


def get_language(language_id: int) -> dict[str, Any] | None:
    language = db.session.get(LanguageStudy, language_id)
    if language is None:
        return None
    return serialize_language(language)


def create_language(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    duration_value = _integer(data.get("duration_minutes"), "duration_minutes")
    if duration_value is None:
        legacy_hours = data.get("hours")
        duration_value = int(round(float(legacy_hours or 0) * 60)) if legacy_hours is not None else 60

    language = LanguageStudy(
        language=_string(data.get("language"), "language", required=True),
        level=_string(data.get("level") or data.get("topic") or "beginner", "level", required=True),
        activity=_string(data.get("activity") or data.get("topic") or "estudo", "activity", required=True),
        duration_minutes=duration_value,
        date=_date(data.get("date"), "date", required=True),
        notes=_string(data.get("notes") or data.get("certificate"), "notes"),
    )
    if language.duration_minutes < 1:
        raise ValidationError("A duração deve ser maior que zero.")
    _save(language)
    return serialize_language(language)


def update_language(language_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    language = db.session.get(LanguageStudy, language_id)
    if language is None:
        return None

    data = _ensure_dict(payload)
    duration_value = _integer(data.get("duration_minutes"), "duration_minutes")
    if duration_value is None:
        legacy_hours = data.get("hours")
        duration_value = int(round(float(legacy_hours or 0) * 60)) if legacy_hours is not None else 60

    language.language = _string(data.get("language"), "language", required=True)
    language.level = _string(data.get("level") or data.get("topic") or "beginner", "level", required=True)
    language.activity = _string(data.get("activity") or data.get("topic") or "estudo", "activity", required=True)
    language.duration_minutes = duration_value
    language.date = _date(data.get("date"), "date", required=True)
    language.notes = _string(data.get("notes") or data.get("certificate"), "notes")

    if language.duration_minutes < 1:
        raise ValidationError("A duração deve ser maior que zero.")
    _save(language)
    return serialize_language(language)


def delete_language(language_id: int) -> bool:
    language = db.session.get(LanguageStudy, language_id)
    if language is None:
        return False
    _delete(language)
    return True


# ---------------------------------------------------------------------------
# Certificates CRUD
# ---------------------------------------------------------------------------

def list_certificates() -> list[dict[str, Any]]:
    certificates = Certificate.query.order_by(Certificate.issue_date.desc().nullslast(), Certificate.id.desc()).all()
    return [serialize_certificate(certificate) for certificate in certificates]


def get_certificate(certificate_id: int) -> dict[str, Any] | None:
    certificate = db.session.get(Certificate, certificate_id)
    if certificate is None:
        return None
    return serialize_certificate(certificate)


def create_certificate(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    certificate = Certificate(
        name=_string(data.get("name") or data.get("title"), "name", required=True),
        institution=_string(data.get("institution"), "institution"),
        issue_date=_date(data.get("issue_date") or data.get("completedAt"), "issue_date"),
        certificate_url=_string(data.get("certificate_url") or data.get("image"), "certificate_url"),
        description=_string(data.get("description") or data.get("synopsis"), "description"),
    )
    _save(certificate)
    return serialize_certificate(certificate)


def update_certificate(certificate_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    certificate = db.session.get(Certificate, certificate_id)
    if certificate is None:
        return None

    data = _ensure_dict(payload)
    certificate.name = _string(data.get("name") or data.get("title"), "name", required=True)
    certificate.institution = _string(data.get("institution"), "institution")
    certificate.issue_date = _date(data.get("issue_date") or data.get("completedAt"), "issue_date")
    certificate.certificate_url = _string(data.get("certificate_url") or data.get("image"), "certificate_url")
    certificate.description = _string(data.get("description") or data.get("synopsis"), "description")

    _save(certificate)
    return serialize_certificate(certificate)


def delete_certificate(certificate_id: int) -> bool:
    certificate = db.session.get(Certificate, certificate_id)
    if certificate is None:
        return False
    _delete(certificate)
    return True


# ---------------------------------------------------------------------------
# Codes CRUD
# ---------------------------------------------------------------------------

def list_codes(code_type: str | None = None) -> list[dict[str, Any]]:
    query = CodeProject.query
    if code_type:
        query = query.filter(CodeProject.type == _code_type(code_type))
    codes = query.order_by(CodeProject.created_at.desc(), CodeProject.id.desc()).all()
    return [serialize_code(code) for code in codes]


def get_code(code_id: int) -> dict[str, Any] | None:
    code = db.session.get(CodeProject, code_id)
    if code is None:
        return None
    return serialize_code(code)


def create_code(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    code = CodeProject(
        title=_string(data.get("title"), "title", required=True),
        description=_string(data.get("description"), "description"),
        code_content=_string(data.get("code_content") or data.get("repository_url"), "code_content"),
        type=_code_type(data.get("type")),
        technology=_string(data.get("technology") or data.get("language"), "technology"),
        repository_url=_string(data.get("repository_url"), "repository_url"),
    )
    _save(code)
    return serialize_code(code)


def update_code(code_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    code = db.session.get(CodeProject, code_id)
    if code is None:
        return None

    data = _ensure_dict(payload)
    code.title = _string(data.get("title"), "title", required=True)
    code.description = _string(data.get("description"), "description")
    code.code_content = _string(data.get("code_content") or data.get("repository_url"), "code_content")
    code.type = _code_type(data.get("type"))
    code.technology = _string(data.get("technology") or data.get("language"), "technology")
    code.repository_url = _string(data.get("repository_url"), "repository_url")

    _save(code)
    return serialize_code(code)


def delete_code(code_id: int) -> bool:
    code = db.session.get(CodeProject, code_id)
    if code is None:
        return False
    _delete(code)
    return True


# ---------------------------------------------------------------------------
# Sites CRUD
# ---------------------------------------------------------------------------

def list_sites() -> list[dict[str, Any]]:
    sites = Site.query.order_by(Site.created_at.desc(), Site.id.desc()).all()
    return [serialize_site(site) for site in sites]


def get_site(site_id: int) -> dict[str, Any] | None:
    site = db.session.get(Site, site_id)
    if site is None:
        return None
    return serialize_site(site)


def create_site(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    site = Site(
        name=_string(data.get("name") or data.get("title"), "name", required=True),
        description=_string(data.get("description"), "description"),
        url=_string(data.get("url"), "url", required=True),
        repository_url=_string(data.get("repository_url"), "repository_url"),
        technologies=as_technology_list(data.get("technologies")),
        status=_string(data.get("status"), "status") or "active",
    )
    _save(site)
    return serialize_site(site)


def update_site(site_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    site = db.session.get(Site, site_id)
    if site is None:
        return None

    data = _ensure_dict(payload)
    site.name = _string(data.get("name") or data.get("title"), "name", required=True)
    site.description = _string(data.get("description"), "description")
    site.url = _string(data.get("url"), "url", required=True)
    site.repository_url = _string(data.get("repository_url"), "repository_url")
    site.technologies = as_technology_list(data.get("technologies"))
    site.status = _string(data.get("status"), "status") or "active"

    _save(site)
    return serialize_site(site)


def delete_site(site_id: int) -> bool:
    site = db.session.get(Site, site_id)
    if site is None:
        return False
    _delete(site)
    return True


# ---------------------------------------------------------------------------
# Dashboards CRUD
# ---------------------------------------------------------------------------

def list_dashboard_projects() -> list[dict[str, Any]]:
    dashboards = DashboardProject.query.order_by(DashboardProject.created_at.desc(), DashboardProject.id.desc()).all()
    return [serialize_dashboard_project(dashboard) for dashboard in dashboards]


def get_dashboard_project(dashboard_id: int) -> dict[str, Any] | None:
    dashboard = db.session.get(DashboardProject, dashboard_id)
    if dashboard is None:
        return None
    return serialize_dashboard_project(dashboard)


def create_dashboard_project(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    dashboard = DashboardProject(
        name=_string(data.get("name") or data.get("title"), "name", required=True),
        description=_string(data.get("description"), "description"),
        tool=_string(data.get("tool"), "tool"),
        project_url=_string(data.get("project_url") or data.get("url"), "project_url"),
        image_url=_string(data.get("image_url"), "image_url"),
    )
    _save(dashboard)
    return serialize_dashboard_project(dashboard)


def update_dashboard_project(dashboard_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    dashboard = db.session.get(DashboardProject, dashboard_id)
    if dashboard is None:
        return None

    data = _ensure_dict(payload)
    dashboard.name = _string(data.get("name") or data.get("title"), "name", required=True)
    dashboard.description = _string(data.get("description"), "description")
    dashboard.tool = _string(data.get("tool"), "tool")
    dashboard.project_url = _string(data.get("project_url") or data.get("url"), "project_url")
    dashboard.image_url = _string(data.get("image_url"), "image_url")

    _save(dashboard)
    return serialize_dashboard_project(dashboard)


def delete_dashboard_project(dashboard_id: int) -> bool:
    dashboard = db.session.get(DashboardProject, dashboard_id)
    if dashboard is None:
        return False
    _delete(dashboard)
    return True


# ---------------------------------------------------------------------------
# Settings CRUD
# ---------------------------------------------------------------------------

def list_settings() -> list[dict[str, Any]]:
    settings = Setting.query.order_by(Setting.key.asc(), Setting.id.asc()).all()
    return [serialize_setting(setting) for setting in settings]


def get_setting(setting_id: int) -> dict[str, Any] | None:
    setting = db.session.get(Setting, setting_id)
    if setting is None:
        return None
    return serialize_setting(setting)


def create_setting(payload: dict[str, Any]) -> dict[str, Any]:
    data = _ensure_dict(payload)
    key = _string(data.get("key"), "key", required=True)
    existing = Setting.query.filter(func.lower(Setting.key) == key.lower()).first()
    if existing is not None:
        raise ValidationError("Já existe uma configuração com essa chave.")

    setting = Setting(
        key=key,
        value=_string(data.get("value"), "value", required=True),
    )
    _save(setting)
    return serialize_setting(setting)


def update_setting(setting_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
    setting = db.session.get(Setting, setting_id)
    if setting is None:
        return None

    data = _ensure_dict(payload)
    key = _string(data.get("key"), "key", required=True)
    existing = Setting.query.filter(func.lower(Setting.key) == key.lower(), Setting.id != setting_id).first()
    if existing is not None:
        raise ValidationError("Já existe uma configuração com essa chave.")

    setting.key = key
    setting.value = _string(data.get("value"), "value", required=True)

    _save(setting)
    return serialize_setting(setting)


def delete_setting(setting_id: int) -> bool:
    setting = db.session.get(Setting, setting_id)
    if setting is None:
        return False
    _delete(setting)
    return True


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------

def _format_duration_minutes(total_minutes: int) -> str:
    hours, minutes = divmod(total_minutes, 60)
    if hours and minutes:
        return f"{hours}h{minutes:02d}m"
    if hours:
        return f"{hours}h"
    return f"{minutes}min"


def _group_minutes_by_field(studies: list[StudyEntry], field_name: str) -> list[dict[str, Any]]:
    buckets: dict[str, int] = defaultdict(int)
    for study in studies:
        key = getattr(study, field_name) or "Sem categoria"
        buckets[str(key)] += int(study.duration_minutes or 0)

    return [
        {
            "label": key,
            "minutes": minutes,
            "hours": round(minutes / 60, 2),
        }
        for key, minutes in sorted(buckets.items(), key=lambda item: item[1], reverse=True)
    ]


def _build_daily_series(studies: list[StudyEntry], days: int) -> list[dict[str, Any]]:
    today = date.today()
    start = today - timedelta(days=days - 1)
    grouped: dict[date, dict[str, Any]] = {}

    for study in studies:
        if not study.date or study.date < start:
            continue
        bucket = grouped.setdefault(study.date, {"date": study.date.isoformat(), "count": 0, "minutes": 0})
        bucket["count"] += 1
        bucket["minutes"] += int(study.duration_minutes or 0)

    series = []
    for offset in range(days):
        current = start + timedelta(days=offset)
        current_bucket = grouped.get(current, {"date": current.isoformat(), "count": 0, "minutes": 0})
        series.append(
            {
                "date": current_bucket["date"],
                "count": current_bucket["count"],
                "minutes": current_bucket["minutes"],
                "hours": round(current_bucket["minutes"] / 60, 2),
            }
        )
    return series


def _calculate_streak(studies: list[StudyEntry]) -> int:
    unique_dates = {study.date for study in studies if study.date}
    if not unique_dates:
        return 0

    streak = 0
    cursor = max(unique_dates)
    while cursor in unique_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def get_dashboard_summary() -> dict[str, Any]:
    studies = StudyEntry.query.order_by(StudyEntry.date.asc(), StudyEntry.created_at.asc()).all()
    projects = Project.query.count()
    certificates = Certificate.query.count()

    total_minutes = sum(int(study.duration_minutes or 0) for study in studies)
    total_studies = len(studies)
    study_days = len({study.date for study in studies if study.date})
    streak = _calculate_streak(studies)
    hours_by_technology = _group_minutes_by_field(studies, "technology")
    hours_by_category = _group_minutes_by_field(studies, "category")
    recent_studies = [serialize_study(study) for study in studies[-5:]][::-1]

    consistency = []
    day_map: dict[date, dict[str, Any]] = {}
    for study in studies:
        if not study.date:
            continue
        entry = day_map.setdefault(
            study.date,
            {"date": study.date.isoformat(), "count": 0, "minutes": 0, "category": study.category, "technology": study.technology},
        )
        entry["count"] += 1
        entry["minutes"] += int(study.duration_minutes or 0)
        entry["hours"] = round(entry["minutes"] / 60, 2)
        entry["level"] = 1 if entry["minutes"] < 60 else 2 if entry["minutes"] < 120 else 3 if entry["minutes"] < 240 else 4
    for current_date in sorted(day_map):
        consistency.append(day_map[current_date])

    summary = {
        "xp": total_minutes * 10,
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 2),
        "total_studies": total_studies,
        "projects": projects,
        "certificates": certificates,
        "study_days": study_days,
        "streak": streak,
        "studies_last_7_days": _build_daily_series(studies, 7),
        "studies_last_30_days": _build_daily_series(studies, 30),
        "hours_by_technology": hours_by_technology,
        "hours_by_category": hours_by_category,
        "consistency": consistency,
        "recentStudies": recent_studies,
    }

    return summary
