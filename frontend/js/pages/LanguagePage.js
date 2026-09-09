import { createConsistencyComponent } from "../dashboard/Consistency.js";
import { destroySnake, initializeSnake, updateSnake } from "../dashboard/githubSnake.js";
import { createLanguage, deleteLanguage, getLanguages, updateLanguage } from "../services/api.js";

let editingLanguageId = null;
let languageEntries = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toLanguageEntries(apiPayload) {
    const items = Array.isArray(apiPayload?.data) ? apiPayload.data : (Array.isArray(apiPayload) ? apiPayload : []);
    return items.map(item => ({
        ...item,
        duration_minutes: Number(item.duration_minutes || 0),
    }));
}

function getActiveDays(items = languageEntries) {
    return new Set(items.map(item => item.date).filter(Boolean)).size;
}

function getTotalHours(items = languageEntries) {
    const totalMinutes = items.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
    return (totalMinutes / 60).toFixed(1);
}

function getLanguagesCount(items = languageEntries) {
    return new Set(items.map(item => item.language).filter(Boolean)).size;
}

function getCertificates(items = languageEntries) {
    return items.filter(item => item.notes && item.notes.trim()).length;
}

function getLevelFromMinutes(minutes) {
    const numericMinutes = Number(minutes || 0);
    if (numericMinutes >= 180) {
        return 4;
    }
    if (numericMinutes >= 120) {
        return 3;
    }
    if (numericMinutes >= 60) {
        return 2;
    }
    return 1;
}

function toCalendarDateKey(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return null;
        }

        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, "0");
        const day = String(value.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const normalized = String(value).trim();
    const directMatch = normalized.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (directMatch) {
        const [, year, month, day] = directMatch;
        return `${year}-${month}-${day}`;
    }

    const brazilianMatch = normalized.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (brazilianMatch) {
        const [, day, month, year] = brazilianMatch;
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function buildLanguageStudyDays(items = languageEntries) {
    return items.reduce((accumulator, item) => {
        const dateKey = toCalendarDateKey(item.date);
        if (!dateKey) {
            return accumulator;
        }

        const level = getLevelFromMinutes(item.duration_minutes);
        const previousLevel = Number(accumulator[dateKey] || 0);
        accumulator[dateKey] = Math.max(previousLevel, level);

        return accumulator;
    }, {});
}

function createLanguageList(items = languageEntries, adminMode = false) {
    if (!items.length) {
        return `<p class="empty-state">Nenhuma sessão registrada ainda.</p>`;
    }

    return `
        <ul class="language-session-list">
            ${items.map(item => `
                <li class="language-session-item" data-language-id="${item.id}">
                    <div class="language-session-main">
                        <div class="language-session-title-row">
                            <strong>${escapeHtml(item.language)}</strong>
                            <span class="language-session-chip">${escapeHtml(item.level)}</span>
                        </div>
                        <p>${escapeHtml(item.activity)}</p>
                    </div>
                    <div class="language-session-meta">
                        <span>Data: ${escapeHtml(item.date)}</span>
                        <span>Duração: ${(Number(item.duration_minutes || 0) / 60).toFixed(1)}h</span>
                        ${item.notes ? `<span>Notas: ${escapeHtml(item.notes)}</span>` : ""}
                        ${adminMode ? `
                        <div class="language-session-actions">
                            <button type="button" class="study-action-btn edit" data-action="edit-language" data-language-id="${item.id}">Editar</button>
                            <button type="button" class="study-action-btn delete" data-action="delete-language" data-language-id="${item.id}">Excluir</button>
                        </div>
                        ` : ""}
                    </div>
                </li>
            `).join("")}
        </ul>
    `;
}

function createLanguageSnake(items = languageEntries) {
    const studyDays = buildLanguageStudyDays(items);

    return `
        <div class="consistency-page-surface language-consistency-shell">
            <div id="language-consistency-root">
                ${createConsistencyComponent(studyDays, new Date().getFullYear())}
            </div>
        </div>
    `;
}

function renderLanguageConsistency() {
    const container = document.getElementById("language-consistency-root");

    if (!container) {
        return;
    }

    const studyDays = buildLanguageStudyDays(languageEntries);
    container.innerHTML = createConsistencyComponent(studyDays, new Date().getFullYear());

    // Wait for the new heatmap layout to settle before measuring cell positions.
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            destroySnake();
            initializeSnake();
            updateSnake();
        });
    });
}

function buildLanguageForm(language = null) {
    return `
        <div class="language-form-card">
            <div class="language-section-header">
                <h3>${language ? "Editar sessão" : "Nova sessão"}</h3>
                <p>${language ? "Ajuste os dados e salve a alteração." : "Registre uma nova prática de idioma."}</p>
            </div>

            <form class="language-form" id="language-form">
                <div class="language-form-grid">
                    <label>
                        <span>Data</span>
                        <input type="date" name="date" value="${escapeHtml(language?.date || new Date().toISOString().split("T")[0])}" required>
                    </label>
                    <label>
                        <span>Idioma</span>
                        <select name="language" required>
                            <option value="Inglês" ${language?.language === "Inglês" ? "selected" : ""}>Inglês</option>
                            <option value="Espanhol" ${language?.language === "Espanhol" ? "selected" : ""}>Espanhol</option>
                            <option value="Francês" ${language?.language === "Francês" ? "selected" : ""}>Francês</option>
                            <option value="Outro" ${language?.language === "Outro" ? "selected" : ""}>Outro</option>
                        </select>
                    </label>
                    <label>
                        <span>Nível</span>
                        <select name="level" required>
                            <option value="beginner" ${language?.level === "beginner" ? "selected" : ""}>Beginner</option>
                            <option value="intermediate" ${language?.level === "intermediate" ? "selected" : ""}>Intermediate</option>
                            <option value="advanced" ${language?.level === "advanced" ? "selected" : ""}>Advanced</option>
                        </select>
                    </label>
                    <label>
                        <span>Duração em minutos</span>
                        <input type="number" name="duration_minutes" min="1" step="1" value="${Number(language?.duration_minutes || 60)}" required>
                    </label>
                </div>

                <label class="study-form-full">
                    <span>Atividade</span>
                    <input type="text" name="activity" placeholder="Ex: leitura, conversação, listening" value="${escapeHtml(language?.activity || "")}" required>
                </label>

                <label class="study-form-full">
                    <span>Observações / certificado</span>
                    <textarea name="notes" rows="3" placeholder="Anotações da sessão, curso ou certificado">${escapeHtml(language?.notes || "")}</textarea>
                </label>

                <div class="projects-form-actions">
                    <button type="submit">${language ? "Atualizar" : "Adicionar"}</button>
                    ${language ? `<button type="button" id="language-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="language-form-feedback"></p>
                </div>
            </form>
        </div>
    `;
}

export async function LanguagePage() {
    try {
        const response = await getLanguages();
        languageEntries = toLanguageEntries(response);
    } catch (error) {
        console.warn("Não foi possível carregar os registros de idioma.", error);
        languageEntries = [];
    }

    const adminMode = sessionStorage.getItem("erickos-admin-mode") === "true";

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero language-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon certificate-icon"><i data-lucide="languages"></i></span>Idiomas</span>
                        <h1>Seu painel de estudo de inglês e espanhol</h1>
                        <p>Registre os dias em que você praticou cada idioma, acompanhe sua evolução e mantenha seus certificados em um só lugar.</p>
                    </div>
                </section>

                <section class="dashboard-stats language-stats">
                    <article class="stat-card">
                        <div class="stat-icon xp-icon"><i data-lucide="book-open"></i></div>
                        <span class="stat-title">Sessões</span>
                        <h2>${getActiveDays()}</h2>
                        <small>dias registrados</small>
                    </article>
                    <article class="stat-card">
                        <div class="stat-icon streak-icon"><i data-lucide="clock-3"></i></div>
                        <span class="stat-title">Horas</span>
                        <h2>${getTotalHours()}</h2>
                        <small>de prática</small>
                    </article>
                    <article class="stat-card">
                        <div class="stat-icon project-icon"><i data-lucide="globe-2"></i></div>
                        <span class="stat-title">Idiomas</span>
                        <h2>${getLanguagesCount()}</h2>
                        <small>em estudo</small>
                    </article>
                    <article class="stat-card">
                        <div class="stat-icon certificate-icon"><i data-lucide="award"></i></div>
                        <span class="stat-title">Certificados</span>
                        <h2>${getCertificates()}</h2>
                        <small>registrado</small>
                    </article>
                </section>

                <section class="language-consistency-section">
                    ${createLanguageSnake()}
                </section>

                ${adminMode ? `
                <section class="language-form-section">
                    ${buildLanguageForm()}
                </section>
                ` : ""}

                <section class="recent-activity language-records-card language-records-section">
                    <div class="language-section-header">
                        <h3>Últimos registros</h3>
                        <p>Registros mais recentes do idioma selecionado.</p>
                    </div>
                    ${createLanguageList(languageEntries, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshLanguagePage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await LanguagePage();
    initLanguagePage();
}

function populateLanguageForm(language) {
    const form = document.getElementById("language-form");
    const feedback = document.getElementById("language-form-feedback");

    if (!form) {
        return;
    }

    editingLanguageId = language.id;
    form.querySelector('input[name="date"]').value = language.date || new Date().toISOString().split("T")[0];
    form.querySelector('select[name="language"]').value = language.language || "Inglês";
    form.querySelector('select[name="level"]').value = language.level || "beginner";
    form.querySelector('input[name="activity"]').value = language.activity || "";
    form.querySelector('input[name="duration_minutes"]').value = Number(language.duration_minutes || 60);
    form.querySelector('input[name="notes"]').value = language.notes || "";

    if (feedback) {
        feedback.textContent = `Editando ${language.language || "registro"}.`;
    }
}

export function initLanguagePage() {
    destroySnake();

    const languageContainer = document.getElementById("page");

    if (!languageContainer) {
        return;
    }

    if (languageContainer.dataset.languageListenersAttached === "true") {
        return;
    }

    const adminMode = sessionStorage.getItem("erickos-admin-mode") === "true";

    languageContainer.dataset.languageListenersAttached = "true";

    if (!adminMode) {
        window.requestAnimationFrame(() => {
            renderLanguageConsistency();
        });
        return;
    }

    languageContainer.addEventListener("submit", async event => {
        const form = event.target;

        if (!(form instanceof HTMLFormElement) || form.id !== "language-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("language-form-feedback");

        const formData = new FormData(form);
        const payload = {
            date: formData.get("date") || new Date().toISOString().split("T")[0],
            language: formData.get("language") || "Inglês",
            level: formData.get("level") || "beginner",
            activity: formData.get("activity") || "Estudo",
            duration_minutes: Number(formData.get("duration_minutes") || 0),
            notes: formData.get("notes") || "",
        };

        feedback.textContent = editingLanguageId ? "Atualizando sessão..." : "Salvando sessão...";

        try {
            if (editingLanguageId) {
                await updateLanguage(editingLanguageId, payload);
            } else {
                await createLanguage(payload);
            }

            editingLanguageId = null;
            await refreshLanguagePage();
        } catch (error) {
            feedback.textContent = error.message;
        }
    });

    languageContainer.addEventListener("click", async event => {
        const feedback = document.getElementById("language-form-feedback");
        const editButton = event.target.closest("[data-action='edit-language']");
        const deleteButton = event.target.closest("[data-action='delete-language']");
        const cancelButton = event.target.closest("#language-cancel-edit");

        if (editButton) {
            const languageId = Number(editButton.dataset.languageId);
            const current = languageEntries.find(item => Number(item.id) === languageId);
            if (current) {
                populateLanguageForm(current);
            }
        }

        if (deleteButton) {
            const languageId = Number(deleteButton.dataset.languageId);
            try {
                await deleteLanguage(languageId);
                if (editingLanguageId === languageId) {
                    editingLanguageId = null;
                }
                await refreshLanguagePage();
            } catch (error) {
                feedback.textContent = error.message;
            }
        }

        if (cancelButton) {
            editingLanguageId = null;
            await refreshLanguagePage();
        }
    });

    window.requestAnimationFrame(() => {
        renderLanguageConsistency();
    });
}
