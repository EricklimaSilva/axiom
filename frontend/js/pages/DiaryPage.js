import { getDashboardData } from "../dashboard/dashboardApi.js";
import { apiRequest } from "../api.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function createRecentStudiesMarkup(recentStudies) {
    if (!recentStudies || recentStudies.length === 0) {
        return `<p class="empty-state">Nenhuma sessão registrada ainda.</p>`;
    }

    return `
        <ul class="recent-activity-list">
            ${recentStudies.map(study => `
                <li class="recent-activity-item" data-study-id="${study.id}">
                    <div>
                        <strong>${study.subject}</strong>
                        <p>${study.notes || "Sem observações."}</p>
                    </div>
                    <div class="recent-activity-actions">
                        <span>${study.duration}</span>
                        <button type="button" class="study-action-btn edit" data-action="edit" data-study-id="${study.id}">Editar</button>
                        <button type="button" class="study-action-btn delete" data-action="delete" data-study-id="${study.id}">Excluir</button>
                    </div>
                </li>
            `).join("")}
        </ul>
    `;
}

export async function DiaryPage() {
    const response = await getDashboardData();
    const dashboardData = response?.data ?? response;
    const recentStudiesMarkup = createRecentStudiesMarkup(dashboardData.recentStudies ?? []);
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";

    return `
        <div class="page-content">
            <div class="content-container">
                ${adminMode ? `
                <section class="study-form-card">
                    <div class="study-form-header">
                        <div>
                            <h3>Registrar sessão</h3>
                            <p>Adicione uma nova sessão de estudo ao diário.</p>
                        </div>
                    </div>

                    <form id="study-form" class="study-form">
                        <div class="study-form-grid">
                            <label>
                                <span>Data</span>
                                <input type="date" name="date" required>
                            </label>

                            <label>
                                <span>Disciplina</span>
                                <select name="subject" required>
                                    <option value="Backend">Backend</option>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Dados">Dados</option>
                                </select>
                            </label>

                            <label>
                                <span>Horas</span>
                                <input type="number" name="hours" min="0" value="0" required>
                            </label>

                            <label>
                                <span>Minutos</span>
                                <input type="number" name="minutes" min="0" max="59" value="30" required>
                            </label>

                            <label>
                                <span>XP</span>
                                <input type="number" name="xp" min="0" value="0" disabled>
                            </label>
                        </div>

                        <label class="study-form-full">
                            <span>Conteúdo</span>
                            <input type="text" name="content" placeholder="Ex: Python, VSCode, PySpark" required>
                        </label>

                        <label class="study-form-full">
                            <span>Observações</span>
                            <textarea name="notes" rows="3" placeholder="Descreva o que foi estudado..."></textarea>
                        </label>

                        <button type="submit" class="study-submit-btn">Salvar sessão</button>
                        <p id="study-form-message" class="study-form-message"></p>
                    </form>
                </section>

                ` : ""}

                <section class="dashboard-header">
                    <span class="dashboard-date">Diário de Estudos</span>
                    <h1>Registre e acompanhe sua rotina</h1>
                    <p>Use esta página para manter suas sessões de estudo organizadas e acompanhar o histórico recente.</p>
                </section>

                <section class="dashboard-bottom">
                    <div class="recent-activity">
                        <h3>Atividade Recente</h3>
                        ${recentStudiesMarkup}
                    </div>

                    <div class="recent-projects">
                        <h3>Próximos passos</h3>
                        <p class="empty-state">Cada sessão registrada atualiza automaticamente sua consistência e o histórico.</p>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function emitStudiesUpdated() {
    document.dispatchEvent(new CustomEvent("erickos:studies-updated"));
}

export function initDiaryPage() {
    const form = document.getElementById("study-form");
    const message = document.getElementById("study-form-message");
    const diaryContainer = document.getElementById("page");
    const adminMode = localStorage.getItem("erickos-admin-mode") === "true";

    if (!diaryContainer) {
        return;
    }

    if (!adminMode) {
        return;
    }

    if (!form || !message) {
        return;
    }

    const refreshDiary = async () => {
        diaryContainer.innerHTML = await DiaryPage();
        initDiaryPage();
    };

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            date: formData.get("date"),
            subject: formData.get("subject") || "",
            hours: Number(formData.get("hours") || 0),
            minutes: Number(formData.get("minutes") || 0),
            content: formData.get("content") || "",
            notes: formData.get("notes") || "",
        };

        message.textContent = "Salvando sessão...";

        try {
            const result = await apiRequest("/api/studies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            message.textContent = "Sessão salva com sucesso!";
            form.reset();
            const dateInput = form.querySelector('input[name="date"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split("T")[0];
            }

            await refreshDiary();
            emitStudiesUpdated();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    diaryContainer.addEventListener("click", async event => {
        const button = event.target.closest(".study-action-btn");

        if (!button) {
            return;
        }

        const studyId = Number(button.dataset.studyId);
        const action = button.dataset.action;

        if (action === "delete") {
            try {
                await apiRequest(`/api/studies/${studyId}`, {
                    method: "DELETE",
                });

                await refreshDiary();
                emitStudiesUpdated();
            } catch (error) {
                message.textContent = error.message;
            }
        }

        if (action === "edit") {
            try {
                const result = await apiRequest(`/api/studies/${studyId}`);
                const session = result?.data ?? {};
                const item = button.closest(".recent-activity-item");

                if (item) {
                    item.innerHTML = `
                        <form class="study-edit-form" data-study-id="${studyId}">
                            <div class="study-form-grid">
                                <label>
                                    <span>Data</span>
                                    <input type="date" name="date" value="${escapeHtml(session.date || "")}" required>
                                </label>

                                <label>
                                    <span>Disciplina</span>
                                    <select name="subject" required>
                                        <option value="Backend" ${session.subject === "Backend" ? "selected" : ""}>Backend</option>
                                        <option value="Frontend" ${session.subject === "Frontend" ? "selected" : ""}>Frontend</option>
                                        <option value="Dados" ${session.subject === "Dados" ? "selected" : ""}>Dados</option>
                                    </select>
                                </label>

                                <label>
                                    <span>Horas</span>
                                    <input type="number" name="hours" min="0" value="${Number(session.hours || 0)}" required>
                                </label>

                                <label>
                                    <span>Minutos</span>
                                    <input type="number" name="minutes" min="0" max="59" value="${Number(session.minutes || 0)}" required>
                                </label>

                                <label>
                                    <span>XP</span>
                                    <input type="number" name="xp" min="0" value="${Number(session.xp || 0)}" disabled>
                                </label>
                            </div>

                            <label class="study-form-full">
                                <span>Conteúdo</span>
                                <input type="text" name="content" value="${escapeHtml(session.content || "")}" placeholder="Ex: Python, VSCode, PySpark" required>
                            </label>

                            <label class="study-form-full">
                                <span>Observações</span>
                                <textarea name="notes" rows="2">${escapeHtml(session.notes || "")}</textarea>
                            </label>

                            <div class="study-edit-actions">
                                <button type="submit" class="study-action-btn edit">Salvar</button>
                                <button type="button" class="study-action-btn delete" data-action="cancel">Cancelar</button>
                            </div>
                        </form>
                    `;
                }
            } catch (error) {
                message.textContent = error.message;
            }
        }
    });

    diaryContainer.addEventListener("submit", async event => {
        const target = event.target;

        if (!target.classList.contains("study-edit-form")) {
            return;
        }

        event.preventDefault();

        const studyId = Number(target.dataset.studyId);
        const formData = new FormData(target);
        const payload = {
            date: formData.get("date"),
            subject: formData.get("subject") || "",
            hours: Number(formData.get("hours") || 0),
            minutes: Number(formData.get("minutes") || 0),
            content: formData.get("content") || "",
            notes: formData.get("notes") || "",
        };

        try {
            await apiRequest(`/api/studies/${studyId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            await refreshDiary();
            emitStudiesUpdated();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    diaryContainer.addEventListener("click", async event => {
        const button = event.target.closest(".study-edit-form .study-action-btn[data-action='cancel']");

        if (!button) {
            return;
        }

        event.preventDefault();
        await refreshDiary();
    });
}
