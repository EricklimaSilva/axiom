import { createCode, deleteCode, getCodes, updateCode } from "../services/api.js";

let editingCodeId = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeCodes(response) {
    return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
}

function createAuthorCodesMarkup(items = [], adminMode = false) {
    if (!items.length) {
        return `<div class="empty-state">Nenhum código autoral registrado ainda.</div>`;
    }

    return `
        <div class="author-codes-list">
            ${items.map(item => `
                <article class="author-code-card" data-code-id="${item.id}">
                    <div class="author-code-header">
                        <div>
                            <h3>${escapeHtml(item.title)}</h3>
                            <p class="author-code-language">${escapeHtml(item.technology || "Sem tecnologia")}</p>
                        </div>
                        <span class="author-code-badge">Autor</span>
                    </div>
                    <div class="author-code-editor">
                        <pre><code>${escapeHtml(item.code_content || "Código não informado")}</code></pre>
                    </div>
                    <div class="author-code-panel">
                        <div>
                            <h4>Como funciona</h4>
                            <p>${escapeHtml(item.description || "Sem descrição.")}</p>
                        </div>
                        <div>
                            <h4>Tipo</h4>
                            <p>${escapeHtml(item.type)}</p>
                        </div>
                    </div>
                    ${adminMode ? `
                        <div class="study-edit-actions" style="margin-top: 16px;">
                            <button type="button" class="study-action-btn edit" data-action="edit-code" data-code-id="${item.id}">Editar</button>
                            <button type="button" class="study-action-btn delete" data-action="delete-code" data-code-id="${item.id}">Excluir</button>
                        </div>
                    ` : ""}
                </article>
            `).join("")}
        </div>
    `;
}

function buildCodeForm(code = null) {
    return `
        <section class="projects-page-surface">
            <form id="code-form" class="projects-form">
                <div class="projects-form-grid">
                    <label>
                        <span>Título</span>
                        <input type="text" name="title" required value="${escapeHtml(code?.title || "")}">
                    </label>
                    <label>
                        <span>Tecnologia</span>
                        <input type="text" name="technology" value="${escapeHtml(code?.technology || "")}">
                    </label>
                </div>
                <label class="study-form-full">
                    <span>Código completo</span>
                    <textarea name="code_content" rows="10" spellcheck="false">${escapeHtml(code?.code_content || "")}</textarea>
                </label>
                <label class="study-form-full">
                    <span>Como funciona</span>
                    <textarea name="description" rows="4">${escapeHtml(code?.description || "")}</textarea>
                </label>
                <div class="projects-form-actions">
                    <button type="submit">${code ? "Atualizar código" : "Salvar código"}</button>
                    ${code ? `<button type="button" id="code-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="code-form-feedback"></p>
                </div>
            </form>
        </section>
    `;
}

async function loadCodes() {
    try {
        return normalizeCodes(await getCodes("AUTHOR"));
    } catch (error) {
        console.warn("Não foi possível carregar códigos autorais.", error);
        return [];
    }
}

export async function AuthorCodesPage() {
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";
    const authorCodes = await loadCodes();

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon xp-icon"><i data-lucide="code-2"></i></span>Códigos autorais</span>
                        <h1>Guarde seus trechos e explique a lógica</h1>
                        <p>Use esta área para colar códigos, indicar a linguagem e descrever o que cada bloco faz.</p>
                    </div>
                </section>

                ${adminMode ? buildCodeForm() : ""}

                <section class="projects-page-surface">
                    <input type="search" id="author-code-search" placeholder="Buscar código autoral..." aria-label="Buscar códigos autorais" class="projects-search-input">
                    ${createAuthorCodesMarkup(authorCodes, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshAuthorCodesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await AuthorCodesPage();
    initAuthorCodesPage();
}

function populateCodeForm(code) {
    const form = document.getElementById("code-form");
    const feedback = document.getElementById("code-form-feedback");

    if (!form) {
        return;
    }

    editingCodeId = code.id;
    form.querySelector('input[name="title"]').value = code.title || "";
    form.querySelector('input[name="technology"]').value = code.technology || "";
    form.querySelector('textarea[name="code_content"]').value = code.code_content || "";
    form.querySelector('textarea[name="description"]').value = code.description || "";

    if (feedback) {
        feedback.textContent = `Editando ${code.title || "código"}.`;
    }
}

export function initAuthorCodesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    if (container.dataset.authorCodeListenersAttached === "true") {
        return;
    }

    container.dataset.authorCodeListenersAttached = "true";

    container.addEventListener("submit", async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== "code-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("code-form-feedback");
        const formData = new FormData(form);
        const payload = {
            title: formData.get("title") || "",
            technology: formData.get("technology") || "",
            code_content: formData.get("code_content") || "",
            description: formData.get("description") || "",
            type: "AUTHOR",
        };

        if (feedback) {
            feedback.textContent = editingCodeId ? "Atualizando código..." : "Salvando código...";
        }

        try {
            if (editingCodeId) {
                await updateCode(editingCodeId, payload);
            } else {
                await createCode(payload);
            }

            editingCodeId = null;
            await refreshAuthorCodesPage();
        } catch (error) {
            if (feedback) {
                feedback.textContent = error.message;
            }
        }
    });

    container.addEventListener("click", async event => {
        const feedback = document.getElementById("code-form-feedback");
        const editButton = event.target.closest("[data-action='edit-code']");
        const deleteButton = event.target.closest("[data-action='delete-code']");
        const cancelButton = event.target.closest("#code-cancel-edit");

        if (editButton) {
            const codeId = Number(editButton.dataset.codeId);
            const codes = await loadCodes();
            const code = codes.find(item => Number(item.id) === codeId);
            if (code) {
                populateCodeForm(code);
            }
        }

        if (deleteButton) {
            const codeId = Number(deleteButton.dataset.codeId);
            try {
                await deleteCode(codeId);
                if (editingCodeId === codeId) {
                    editingCodeId = null;
                }
                await refreshAuthorCodesPage();
            } catch (error) {
                if (feedback) {
                    feedback.textContent = error.message;
                }
            }
        }

        if (cancelButton) {
            editingCodeId = null;
            await refreshAuthorCodesPage();
        }
    });

    const searchInput = document.getElementById("author-code-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            container.querySelectorAll(".author-code-card").forEach(card => {
                const text = card.textContent?.toLowerCase() || "";
                card.style.display = text.includes(query) ? "" : "none";
            });
        });
    }
}
