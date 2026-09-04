import { createProject, deleteProject, getProjects, updateProject } from "../services/api.js";

let editingProjectId = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatTechnologies(technologies) {
    if (Array.isArray(technologies)) {
        return technologies;
    }

    if (typeof technologies === "string") {
        return technologies.split(",").map(item => item.trim()).filter(Boolean);
    }

    return [];
}

function renderProjectCards(projects = [], adminMode = false) {
    if (!projects.length) {
        return '<div class="empty-state projects-empty-state">Nenhum projeto publicado ainda.</div>';
    }

    return `
        <div class="projects-grid">
            ${projects.map(project => {
                const techs = formatTechnologies(project.technologies);
                return `
                    <article class="project-showcase-card" data-project-id="${project.id}">
                        <div class="project-showcase-top">
                            <div>
                                <h3>${escapeHtml(project.name || project.title || "Projeto sem título")}</h3>
                                <p>${escapeHtml(project.description || "Descrição em breve.")}</p>
                            </div>
                            <span class="project-showcase-badge">${escapeHtml(project.status || "planning")}</span>
                        </div>
                        <div class="project-showcase-techs">
                            ${techs.map(tech => `<span>${escapeHtml(tech)}</span>`).join("")}
                        </div>
                        ${adminMode ? `
                            <div class="study-edit-actions" style="margin-top: 16px;">
                                <button type="button" class="study-action-btn edit" data-action="edit-project" data-project-id="${project.id}">Editar</button>
                                <button type="button" class="study-action-btn delete" data-action="delete-project" data-project-id="${project.id}">Excluir</button>
                            </div>
                        ` : ""}
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function buildProjectForm(project = null) {
    const technologies = Array.isArray(project?.technologies)
        ? project.technologies.join(", ")
        : String(project?.technologies || "");

    return `
        <section class="projects-page-surface">
            <form class="projects-form" id="projects-form">
                <div class="projects-form-grid">
                    <label>
                        <span>Nome</span>
                        <input type="text" name="name" placeholder="Nome do projeto" value="${escapeHtml(project?.name || project?.title || "")}" required>
                    </label>
                    <label>
                        <span>Status</span>
                        <select name="status">
                            <option value="planning" ${project?.status === "planning" ? "selected" : ""}>Planning</option>
                            <option value="in_progress" ${project?.status === "in_progress" ? "selected" : ""}>In progress</option>
                            <option value="active" ${!project?.status || project?.status === "active" ? "selected" : ""}>Active</option>
                            <option value="completed" ${project?.status === "completed" ? "selected" : ""}>Completed</option>
                            <option value="archived" ${project?.status === "archived" ? "selected" : ""}>Archived</option>
                        </select>
                    </label>
                    <label>
                        <span>Tecnologias</span>
                        <input type="text" name="technologies" placeholder="React, Node.js, Python" value="${escapeHtml(technologies)}">
                    </label>
                    <label>
                        <span>Repositório</span>
                        <input type="url" name="repository_url" placeholder="https://github.com/..." value="${escapeHtml(project?.repository_url || "")}">
                    </label>
                    <label>
                        <span>URL do projeto</span>
                        <input type="url" name="project_url" placeholder="https://..." value="${escapeHtml(project?.project_url || "")}">
                    </label>
                    <label>
                        <span>Data de início</span>
                        <input type="date" name="started_at" value="${escapeHtml(project?.started_at || "")}">
                    </label>
                    <label>
                        <span>Data de conclusão</span>
                        <input type="date" name="completed_at" value="${escapeHtml(project?.completed_at || "")}">
                    </label>
                </div>
                <label class="study-form-full">
                    <span>Descrição</span>
                    <textarea name="description" rows="3" placeholder="Descreva o projeto">${escapeHtml(project?.description || "")}</textarea>
                </label>
                <div class="projects-form-actions">
                    <button type="submit">${project ? "Atualizar projeto" : "Salvar projeto"}</button>
                    ${project ? `<button type="button" id="projects-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="projects-form-feedback"></p>
                </div>
            </form>
        </section>
    `;
}

export async function ProjectsPage() {
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";
    let projects = [];

    try {
        const response = await getProjects();
        projects = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    } catch (error) {
        console.warn("Não foi possível carregar os projetos.", error);
    }

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon project-icon"><i data-lucide="briefcase"></i></span>Portfólio</span>
                        <h1>Publique e destaque seus projetos</h1>
                        <p>Centralize seus principais trabalhos, tecnologias e links em uma seção dedicada para o seu público.</p>
                    </div>
                </section>

                ${adminMode ? buildProjectForm() : ""}

                <section class="projects-page-surface">
                    <div class="projects-page-header">
                        <h2>Projetos publicados</h2>
                        <p>${projects.length} projeto${projects.length === 1 ? "" : "s"} disponível${projects.length === 1 ? "" : "is"}</p>
                    </div>
                    <input type="search" id="projects-search" placeholder="Buscar projeto..." aria-label="Buscar projetos" class="projects-search-input">
                    ${renderProjectCards(projects, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshProjectsPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await ProjectsPage();
    initProjectsPage();
}

function populateProjectForm(project) {
    const form = document.getElementById("projects-form");
    const feedback = document.getElementById("projects-form-feedback");

    if (!form) {
        return;
    }

    editingProjectId = project.id;
    form.querySelector('input[name="name"]').value = project.name || project.title || "";
    form.querySelector('select[name="status"]').value = project.status || "active";
    form.querySelector('input[name="technologies"]').value = Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : String(project.technologies || "");
    form.querySelector('input[name="repository_url"]').value = project.repository_url || "";
    form.querySelector('input[name="project_url"]').value = project.project_url || "";
    form.querySelector('input[name="started_at"]').value = project.started_at || "";
    form.querySelector('input[name="completed_at"]').value = project.completed_at || "";
    form.querySelector('textarea[name="description"]').value = project.description || "";

    if (feedback) {
        feedback.textContent = `Editando ${project.name || project.title || "projeto"}.`;
    }
}

export function initProjectsPage() {
    const container = document.getElementById("page");

    if (!container) {
        return;
    }

    if (container.dataset.projectsListenersAttached === "true") {
        return;
    }

    container.dataset.projectsListenersAttached = "true";

    container.addEventListener("submit", async event => {
        const form = event.target;

        if (!(form instanceof HTMLFormElement) || form.id !== "projects-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("projects-form-feedback");

        const formData = new FormData(form);
        const payload = {
            name: formData.get("name") || "",
            status: formData.get("status") || "active",
            technologies: formData.get("technologies") || "",
            repository_url: formData.get("repository_url") || "",
            project_url: formData.get("project_url") || "",
            started_at: formData.get("started_at") || "",
            completed_at: formData.get("completed_at") || "",
            description: formData.get("description") || "",
        };

        feedback.textContent = editingProjectId ? "Atualizando projeto..." : "Salvando projeto...";

        try {
            if (editingProjectId) {
                await updateProject(editingProjectId, payload);
            } else {
                await createProject(payload);
            }

            editingProjectId = null;
            await refreshProjectsPage();
        } catch (error) {
            feedback.textContent = error.message;
        }
    });

    container.addEventListener("click", async event => {
        const feedback = document.getElementById("projects-form-feedback");
        const editButton = event.target.closest("[data-action='edit-project']");
        const deleteButton = event.target.closest("[data-action='delete-project']");
        const cancelButton = event.target.closest("#projects-cancel-edit");

        if (editButton) {
            const projectId = Number(editButton.dataset.projectId);
            try {
                const response = await getProjects();
                const projects = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
                const project = projects.find(item => Number(item.id) === projectId);
                if (project) {
                    populateProjectForm(project);
                }
            } catch (error) {
                feedback.textContent = error.message;
            }
        }

        if (deleteButton) {
            const projectId = Number(deleteButton.dataset.projectId);
            try {
                await deleteProject(projectId);
                if (editingProjectId === projectId) {
                    editingProjectId = null;
                }
                await refreshProjectsPage();
            } catch (error) {
                feedback.textContent = error.message;
            }
        }

        if (cancelButton) {
            editingProjectId = null;
            await refreshProjectsPage();
        }
    });

    const searchInput = document.getElementById("projects-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            container.querySelectorAll(".project-showcase-card").forEach(card => {
                const text = card.textContent?.toLowerCase() || "";
                card.style.display = text.includes(query) ? "" : "none";
            });
        });
    }
}
