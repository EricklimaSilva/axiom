from repositories.study_repository import (
    create_study_session,
    delete_study_session,
    get_all_study_sessions,
    get_study_session_by_id,
    update_study_session,
)


class ValidationError(Exception):
    pass


def list_study_sessions_service():
    return get_all_study_sessions()


def get_study_session_service(study_id):
    if not isinstance(study_id, int):
        raise ValidationError("ID inválido.")

    session = get_study_session_by_id(study_id)

    if not session:
        raise ValidationError("Sessão não encontrada.")

    return dict(session)


def create_study_session_service(data):
    if not isinstance(data, dict):
        raise ValidationError("Payload inválido.")

    date = data.get("date")
    subject = data.get("subject")
    hours = data.get("hours")
    minutes = data.get("minutes")
    xp = data.get("xp")
    content = data.get("content")
    notes = data.get("notes")

    if not date or not isinstance(date, str):
        raise ValidationError("A data é obrigatória.")

    if not subject or not isinstance(subject, str) or not subject.strip():
        raise ValidationError("A disciplina é obrigatória.")

    if not isinstance(hours, int) or hours < 0:
        raise ValidationError("Horas inválidas.")

    if not isinstance(minutes, int) or minutes < 0 or minutes > 59:
        raise ValidationError("Minutos inválidos.")

    if xp is not None and (not isinstance(xp, int) or xp < 0):
        raise ValidationError("XP inválido.")

    if hours == 0 and minutes == 0:
        raise ValidationError("A sessão deve ter pelo menos 1 minuto de duração.")

    if content is not None and not isinstance(content, str):
        raise ValidationError("O conteúdo deve ser texto.")

    if notes is not None and not isinstance(notes, str):
        raise ValidationError("As observações devem ser texto.")

    normalized_content = content.strip() if isinstance(content, str) else None
    normalized_notes = notes.strip() if isinstance(notes, str) else None
    calculated_xp = (hours * 60 + minutes) * 10

    return create_study_session(
        date=date,
        subject=subject.strip(),
        hours=hours,
        minutes=minutes,
        xp=calculated_xp,
        content=normalized_content,
        notes=normalized_notes,
    )


def update_study_session_service(study_id, data):
    if not isinstance(study_id, int):
        raise ValidationError("ID inválido.")

    if not isinstance(data, dict):
        raise ValidationError("Payload inválido.")

    existing_session = get_study_session_by_id(study_id)
    if not existing_session:
        raise ValidationError("Sessão não encontrada.")

    date = data.get("date")
    subject = data.get("subject")
    hours = data.get("hours")
    minutes = data.get("minutes")
    xp = data.get("xp")
    content = data.get("content")
    notes = data.get("notes")

    if not date or not isinstance(date, str):
        raise ValidationError("A data é obrigatória.")

    if not subject or not isinstance(subject, str) or not subject.strip():
        raise ValidationError("A disciplina é obrigatória.")

    if not isinstance(hours, int) or hours < 0:
        raise ValidationError("Horas inválidas.")

    if not isinstance(minutes, int) or minutes < 0 or minutes > 59:
        raise ValidationError("Minutos inválidos.")

    if xp is not None and (not isinstance(xp, int) or xp < 0):
        raise ValidationError("XP inválido.")

    if hours == 0 and minutes == 0:
        raise ValidationError("A sessão deve ter pelo menos 1 minuto de duração.")

    if content is not None and not isinstance(content, str):
        raise ValidationError("O conteúdo deve ser texto.")

    if notes is not None and not isinstance(notes, str):
        raise ValidationError("As observações devem ser texto.")

    normalized_content = content.strip() if isinstance(content, str) else None
    normalized_notes = notes.strip() if isinstance(notes, str) else None
    calculated_xp = (hours * 60 + minutes) * 10

    update_study_session(
        study_id,
        date,
        subject.strip(),
        hours,
        minutes,
        calculated_xp,
        normalized_content,
        normalized_notes,
    )

    return get_study_session_by_id(study_id)


def delete_study_session_service(study_id):
    if not isinstance(study_id, int):
        raise ValidationError("ID inválido.")

    existing_session = get_study_session_by_id(study_id)
    if not existing_session:
        raise ValidationError("Sessão não encontrada.")

    delete_study_session(study_id)
    return True
