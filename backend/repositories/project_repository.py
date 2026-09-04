from database import get_connection


def get_all_projects():
    connection = get_connection()

    try:
        cursor = connection.execute("""
            SELECT *
            FROM projects
            ORDER BY created_at DESC
        """)

        return cursor.fetchall()

    finally:
        connection.close()

def create_project(title, description, technologies, project_url, repository_url, media_url=None, media_type=None, logic_description=None):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO projects (
                title,
                description,
                technologies,
                project_url,
                repository_url,
                media_url,
                media_type,
                logic_description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title,
                description,
                technologies,
                project_url,
                repository_url,
                media_url,
                media_type,
                logic_description,
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()