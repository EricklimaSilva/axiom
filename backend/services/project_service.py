from repositories.project_repository import (
    get_all_projects,
    create_project,
)


def list_projects():
    return get_all_projects()

def add_project(
    title,
    description,
    technologies,
    project_url,
    repository_url,
    media_url,
    media_type,
    logic_description,
):
    return create_project(
        title=title,
        description=description,
        technologies=technologies,
        project_url=project_url,
        repository_url=repository_url,
        media_url=media_url,
        media_type=media_type,
        logic_description=logic_description,
    )