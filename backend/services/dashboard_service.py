from datetime import date, datetime, timedelta

from repositories.project_repository import get_all_projects
from repositories.study_repository import get_all_study_sessions


def get_dashboard_data():
    projects = get_all_projects()
    sessions = get_all_study_sessions()

    total_xp = sum(int(session["xp"]) for session in sessions)

    distinct_dates = sorted({session["date"] for session in sessions if session["date"]})
    streak = calculate_streak(distinct_dates)

    consistency = build_consistency_data(sessions)
    recent_studies = build_recent_studies(sessions)

    return {
        "xp": total_xp,
        "streak": streak,
        "projects": len(projects),
        "certificates": 0,
        "consistency": consistency,
        "recentStudies": recent_studies,
    }


def calculate_streak(study_dates):
    if not study_dates:
        return 0

    normalized_dates = {date.fromisoformat(study_date) for study_date in study_dates if study_date}

    if not normalized_dates:
        return 0

    latest_date = max(normalized_dates)
    streak = 0
    current_date = latest_date

    while current_date in normalized_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return streak


def build_consistency_data(sessions):
    grouped = {}

    for session in sessions:
        session_date = session["date"]

        if session_date not in grouped:
            grouped[session_date] = {
                "date": session_date,
                "count": 0,
                "minutes": 0,
                "xp": 0,
            }

        grouped[session_date]["count"] += 1
        grouped[session_date]["minutes"] += int(session["hours"]) * 60 + int(session["minutes"])
        grouped[session_date]["xp"] += int(session["xp"])

    consistency = []

    for session_date in sorted(grouped):
        entry = grouped[session_date]
        entry["level"] = calculate_level(entry["minutes"])
        consistency.append(entry)

    return consistency


def build_recent_studies(sessions):
    recent = []

    for session in sessions[:5]:
        hours = int(session["hours"])
        minutes = int(session["minutes"])
        duration = format_duration(hours, minutes)

        recent.append({
            "id": session["id"],
            "date": session["date"],
            "subject": session["subject"],
            "duration": duration,
            "xp": int(session["xp"]),
            "notes": session["notes"],
        })

    return recent


def calculate_level(minutes):
    if minutes <= 0:
        return 0
    if minutes <= 30:
        return 1
    if minutes <= 60:
        return 2
    if minutes <= 120:
        return 3
    return 4


def format_duration(hours, minutes):
    parts = []

    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}min")

    return " ".join(parts) if parts else "0min"
