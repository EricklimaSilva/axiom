import { createDashboard, deleteDashboard, getDashboards, updateDashboard } from "../services/api.js";

let editingDashboardId = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeDashboards(response) {
    return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
}

function createDashboardsMarkup(items = [], adminMode = false) {
    if (!items.length) {
        return `<div class="empty-state">Nenhum dashboard registrado ainda.</div>`;
    }

    return `
        <div class="sites-grid">
            ${items.map(item => `
                <article class="site-card" data-dashboard-id="${item.id}">
                    <div class="site-card-header">
                        <h3>${escapeHtml(item.name)}</h3>
                        <a href="${escapeHtml(item.project_url || "#")}" target="_blank" rel="noopener noreferrer">Abrir painel</a>
                    </div>
                    <p>${escapeHtml(item.description || "")}</p>
                    <div class="site-features">
                        <h4>${escapeHtml(item.tool || "Ferramenta")}</h4>
                        <ul>
                            ${item.image_url ? `<li>${escapeHtml(item.image_url)}</li>` : ""}
                        </ul>
                    </div>
                    ${adminMode ? `
                        <div class="study-edit-actions" style="margin-top: 16px;">
                            <button type="button" class="study-action-btn edit" data-action="edit-dashboard" data-dashboard-id="${item.id}">Editar</button>
                            <button type="button" class="study-action-btn delete" data-action="delete-dashboard" data-dashboard-id="${item.id}">Excluir</button>
                        </div>
                    ` : ""}
                </article>
            `).join("")}
        </div>
    `;
}

function buildDashboardForm(dashboard = null) {
    return `
        <section class="projects-page-surface">
            <form id="dashboard-form" class="projects-form">
                <div class="projects-form-grid">
                    <label>
                        <span>Nome</span>
                        <input type="text" name="name" required value="${escapeHtml(dashboard?.name || "")}">
                    </label>
                    <label>
                        <span>Ferramenta</span>
                        <input type="text" name="tool" value="${escapeHtml(dashboard?.tool || "")}">
                    </label>
                    <label>
                        <span>URL do projeto</span>
                        <input type="url" name="project_url" value="${escapeHtml(dashboard?.project_url || "")}">
                    </label>
                    <label>
                        <span>Imagem</span>
                        <input type="url" name="image_url" value="${escapeHtml(dashboard?.image_url || "")}">
                    </label>
                </div>
                <label class="study-form-full">
                    <span>Descrição</span>
                    <textarea name="description" rows="3">${escapeHtml(dashboard?.description || "")}</textarea>
                </label>
                <div class="projects-form-actions">
                    <button type="submit">${dashboard ? "Atualizar dashboard" : "Salvar dashboard"}</button>
                    ${dashboard ? `<button type="button" id="dashboard-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="dashboard-form-feedback"></p>
                </div>
            </form>
        </section>
    `;
}

async function loadDashboards() {
    try {
        return normalizeDashboards(await getDashboards());
    } catch (error) {
        console.warn("Não foi possível carregar dashboards.", error);
        return [];
    }
}

export async function DashboardsPage() {
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";
    const dashboards = await loadDashboards();

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon certificate-icon"><i data-lucide="bar-chart-3"></i></span>Dashboards</span>
                        <h1>Organize seus painéis e ferramentas</h1>
                        <p>Liste seus dashboards do Power BI, Looker Studio, Tableau e outras ferramentas em um só lugar.</p>
                    </div>
                </section>

                ${adminMode ? buildDashboardForm() : ""}

                <section class="projects-page-surface">
                    <input type="search" id="dashboard-search" placeholder="Buscar dashboard..." aria-label="Buscar dashboards" class="projects-search-input">
                    ${createDashboardsMarkup(dashboards, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshDashboardsPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await DashboardsPage();
    initDashboardsPage();
}

function populateDashboardForm(dashboard) {
    const form = document.getElementById("dashboard-form");
    const feedback = document.getElementById("dashboard-form-feedback");

    if (!form) {
        return;
    }

    editingDashboardId = dashboard.id;
    form.querySelector('input[name="name"]').value = dashboard.name || "";
    form.querySelector('input[name="tool"]').value = dashboard.tool || "";
    form.querySelector('input[name="project_url"]').value = dashboard.project_url || "";
    form.querySelector('input[name="image_url"]').value = dashboard.image_url || "";
    form.querySelector('textarea[name="description"]').value = dashboard.description || "";

    if (feedback) {
        feedback.textContent = `Editando ${dashboard.name || "dashboard"}.`;
    }
}

export function initDashboardsPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    if (container.dataset.dashboardListenersAttached === "true") {
        return;
    }

    container.dataset.dashboardListenersAttached = "true";

    container.addEventListener("submit", async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== "dashboard-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("dashboard-form-feedback");
        const formData = new FormData(form);
        const payload = {
            name: formData.get("name") || "",
            tool: formData.get("tool") || "",
            project_url: formData.get("project_url") || "",
            image_url: formData.get("image_url") || "",
            description: formData.get("description") || "",
        };

        if (feedback) {
            feedback.textContent = editingDashboardId ? "Atualizando dashboard..." : "Salvando dashboard...";
        }

        try {
            if (editingDashboardId) {
                await updateDashboard(editingDashboardId, payload);
            } else {
                await createDashboard(payload);
            }

            editingDashboardId = null;
            await refreshDashboardsPage();
        } catch (error) {
            if (feedback) {
                feedback.textContent = error.message;
            }
        }
    });

    container.addEventListener("click", async event => {
        const feedback = document.getElementById("dashboard-form-feedback");
        const editButton = event.target.closest("[data-action='edit-dashboard']");
        const deleteButton = event.target.closest("[data-action='delete-dashboard']");
        const cancelButton = event.target.closest("#dashboard-cancel-edit");

        if (editButton) {
            const dashboardId = Number(editButton.dataset.dashboardId);
            const dashboards = await loadDashboards();
            const dashboard = dashboards.find(item => Number(item.id) === dashboardId);
            if (dashboard) {
                populateDashboardForm(dashboard);
            }
        }

        if (deleteButton) {
            const dashboardId = Number(deleteButton.dataset.dashboardId);
            try {
                await deleteDashboard(dashboardId);
                if (editingDashboardId === dashboardId) {
                    editingDashboardId = null;
                }
                await refreshDashboardsPage();
            } catch (error) {
                if (feedback) {
                    feedback.textContent = error.message;
                }
            }
        }

        if (cancelButton) {
            editingDashboardId = null;
            await refreshDashboardsPage();
        }
    });

    const searchInput = document.getElementById("dashboard-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            container.querySelectorAll(".site-card").forEach(card => {
                const text = card.textContent?.toLowerCase() || "";
                card.style.display = text.includes(query) ? "" : "none";
            });
        });
    }
}
