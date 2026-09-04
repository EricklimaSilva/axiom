from database import get_connection


def get_all_study_sessions():
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            SELECT *
            FROM study_sessions
            ORDER BY date DESC, created_at DESC
            """
        )

        return cursor.fetchall()

    finally:
        connection.close()


def get_study_session_by_id(study_id):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            SELECT *
            FROM study_sessions
            WHERE id = ?
            """,
            (study_id,),
        )

        return cursor.fetchone()

    finally:
        connection.close()


def create_study_session(date, subject, hours, minutes, xp, content, notes):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO study_sessions (
                date,
                subject,
                hours,
                minutes,
                xp,
                content,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                date,
                subject,
                hours,
                minutes,
                xp,
                content,
                notes,
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


def update_study_session(study_id, date, subject, hours, minutes, xp, content, notes):
    connection = get_connection()

    try:
        connection.execute(
            """
            UPDATE study_sessions
            SET date = ?,
                subject = ?,
                hours = ?,
                minutes = ?,
                xp = ?,
                content = ?,
                notes = ?
            WHERE id = ?
            """,
            (
                date,
                subject,
                hours,
                minutes,
                xp,
                content,
                notes,
                study_id,
            ),
        )

        connection.commit()

    finally:
        connection.close()


def delete_study_session(study_id):
    connection = get_connection()

    try:
        connection.execute(
            """
            DELETE FROM study_sessions
            WHERE id = ?
            """,
            (study_id,),
        )

        connection.commit()

    finally:
        connection.close()
