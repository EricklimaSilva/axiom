import { createSite, deleteSite, getSites, updateSite } from "../services/api.js";

let editingSiteId = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeSites(response) {
    return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
}

function listToString(value) {
    if (Array.isArray(value)) {
        return value.join(", ");
    }

    return String(value ?? "");
}

function createSitesMarkup(items = [], adminMode = false) {
    if (!items.length) {
        return `<div class="empty-state">Nenhum site registrado ainda.</div>`;
    }

    return `
        <div class="sites-grid">
            ${items.map(item => `
                <article class="site-card" data-site-id="${item.id}">
                    <div class="site-card-header">
                        <h3>${escapeHtml(item.name)}</h3>
                        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Abrir site</a>
                    </div>
                    <p>${escapeHtml(item.description || "")}</p>
                    <div class="site-features">
                        <h4>${escapeHtml(item.status || "active")}</h4>
                        <ul>
                            ${(Array.isArray(item.technologies) ? item.technologies : []).map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}
                        </ul>
                    </div>
                    ${adminMode ? `
                        <div class="study-edit-actions" style="margin-top: 16px;">
                            <button type="button" class="study-action-btn edit" data-action="edit-site" data-site-id="${item.id}">Editar</button>
                            <button type="button" class="study-action-btn delete" data-action="delete-site" data-site-id="${item.id}">Excluir</button>
                        </div>
                    ` : ""}
                </article>
            `).join("")}
        </div>
    `;
}

function buildSiteForm(site = null) {
    return `
        <section class="projects-page-surface">
            <form id="site-form" class="projects-form">
                <div class="projects-form-grid">
                    <label>
                        <span>Nome</span>
                        <input type="text" name="name" required value="${escapeHtml(site?.name || "")}">
                    </label>
                    <label>
                        <span>Status</span>
                        <input type="text" name="status" value="${escapeHtml(site?.status || "active")}">
                    </label>
                    <label>
                        <span>URL</span>
                        <input type="url" name="url" required value="${escapeHtml(site?.url || "")}">
                    </label>
                    <label>
                        <span>Repositório</span>
                        <input type="url" name="repository_url" value="${escapeHtml(site?.repository_url || "")}">
                    </label>
                    <label>
                        <span>Tecnologias</span>
                        <input type="text" name="technologies" value="${escapeHtml(listToString(site?.technologies))}">
                    </label>
                </div>
                <label class="study-form-full">
                    <span>Descrição</span>
                    <textarea name="description" rows="3">${escapeHtml(site?.description || "")}</textarea>
                </label>
                <div class="projects-form-actions">
                    <button type="submit">${site ? "Atualizar site" : "Salvar site"}</button>
                    ${site ? `<button type="button" id="site-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="site-form-feedback"></p>
                </div>
            </form>
        </section>
    `;
}

async function loadSites() {
    try {
        return normalizeSites(await getSites());
    } catch (error) {
        console.warn("Não foi possível carregar sites.", error);
        return [];
    }
}

export async function SitesPage() {
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";
    const sites = await loadSites();

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon project-icon"><i data-lucide="globe-2"></i></span>Sites</span>
                        <h1>Centralize seus sites e suas funcionalidades</h1>
                        <p>Guarde links, descrições e os principais recursos de cada projeto web que você criou.</p>
                    </div>
                </section>

                ${adminMode ? buildSiteForm() : ""}

                <section class="projects-page-surface">
                    <input type="search" id="site-search" placeholder="Buscar site..." aria-label="Buscar sites" class="projects-search-input">
                    ${createSitesMarkup(sites, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshSitesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await SitesPage();
    initSitesPage();
}

function populateSiteForm(site) {
    const form = document.getElementById("site-form");
    const feedback = document.getElementById("site-form-feedback");

    if (!form) {
        return;
    }

    editingSiteId = site.id;
    form.querySelector('input[name="name"]').value = site.name || "";
    form.querySelector('input[name="status"]').value = site.status || "active";
    form.querySelector('input[name="url"]').value = site.url || "";
    form.querySelector('input[name="repository_url"]').value = site.repository_url || "";
    form.querySelector('input[name="technologies"]').value = listToString(site.technologies);
    form.querySelector('textarea[name="description"]').value = site.description || "";

    if (feedback) {
        feedback.textContent = `Editando ${site.name || "site"}.`;
    }
}

export function initSitesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    if (container.dataset.siteListenersAttached === "true") {
        return;
    }

    container.dataset.siteListenersAttached = "true";

    container.addEventListener("submit", async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== "site-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("site-form-feedback");
        const formData = new FormData(form);
        const payload = {
            name: formData.get("name") || "",
            description: formData.get("description") || "",
            url: formData.get("url") || "",
            repository_url: formData.get("repository_url") || "",
            technologies: formData.get("technologies") || "",
            status: formData.get("status") || "active",
        };

        if (feedback) {
            feedback.textContent = editingSiteId ? "Atualizando site..." : "Salvando site...";
        }

        try {
            if (editingSiteId) {
                await updateSite(editingSiteId, payload);
            } else {
                await createSite(payload);
            }

            editingSiteId = null;
            await refreshSitesPage();
        } catch (error) {
            if (feedback) {
                feedback.textContent = error.message;
            }
        }
    });

    container.addEventListener("click", async event => {
        const feedback = document.getElementById("site-form-feedback");
        const editButton = event.target.closest("[data-action='edit-site']");
        const deleteButton = event.target.closest("[data-action='delete-site']");
        const cancelButton = event.target.closest("#site-cancel-edit");

        if (editButton) {
            const siteId = Number(editButton.dataset.siteId);
            const sites = await loadSites();
            const site = sites.find(item => Number(item.id) === siteId);
            if (site) {
                populateSiteForm(site);
            }
        }

        if (deleteButton) {
            const siteId = Number(deleteButton.dataset.siteId);
            try {
                await deleteSite(siteId);
                if (editingSiteId === siteId) {
                    editingSiteId = null;
                }
                await refreshSitesPage();
            } catch (error) {
                if (feedback) {
                    feedback.textContent = error.message;
                }
            }
        }

        if (cancelButton) {
            editingSiteId = null;
            await refreshSitesPage();
        }
    });

    const searchInput = document.getElementById("site-search");
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
