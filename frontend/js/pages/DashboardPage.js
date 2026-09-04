import { initTooltip } from "../dashboard/tooltip.js";
import { destroySnake } from "../dashboard/githubSnake.js";

import {
    initConsistency,
    createConsistencyComponent
} from "../dashboard/Consistency.js";

import {
    initStats,
    createStatsCards
} from "../dashboard/stats.js";

import { getDashboardData } from "../dashboard/dashboardApi.js";
import { apiRequest } from "../api.js";

let dashboardRefreshHandler = null;

function createRecentStudiesMarkup(recentStudies) {
    if (!recentStudies || recentStudies.length === 0) {
        return `<p class="empty-state">Nenhuma sessão registrada ainda.</p>`;
    }

    return `
        <ul class="recent-activity-list">
            ${recentStudies.map(study => `
                <li class="recent-activity-item">
                    <div class="recent-activity-main">
                        <strong>${study.subject}</strong>
                        <p>${study.notes || "Sem observações."}</p>
                    </div>
                    <div class="recent-activity-meta">
                        <span class="recent-activity-duration">${study.duration}</span>
                        <span class="recent-activity-xp">+${study.xp || 0} XP</span>
                    </div>
                </li>
            `).join("")}
        </ul>
    `;
}

export async function DashboardPage() {

    let dashboardData = {
        xp: 0,
        streak: 0,
        projects: 0,
        certificates: 0,
        recentStudies: [],
    };

    try {
        const response = await getDashboardData();
        dashboardData = response?.data ?? response;
    } catch (error) {
        console.warn("Nao foi possivel carregar os dados do dashboard. Mantendo estado vazio.", error);
    }

    const statsCards = createStatsCards({
        xp: dashboardData.xp ?? 0,
        streak: dashboardData.streak ?? 0,
        projects: dashboardData.projects ?? 0,
        certificates: dashboardData.certificates ?? 0,
    });

    const consistencyComponent = createConsistencyComponent();
    const recentStudiesMarkup = createRecentStudiesMarkup(dashboardData.recentStudies ?? []);

    const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
    const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="dashboard-header">
                    <span class="dashboard-date">${todayLabel}</span>
                    <h1>${greeting}, Erick! 👋</h1>
                    <p>Seu progresso está sendo atualizado com os dados reais do seu diário.</p>
                </section>

                <section class="dashboard-stats">
                    ${statsCards}
                </section>

                <section class="dashboard-consistency">
                    ${consistencyComponent}
                </section>

                <section class="dashboard-bottom">
                    <div class="recent-activity">
                        <h3>Atividade Recente</h3>
                        ${recentStudiesMarkup}
                    </div>

                    <div class="recent-projects">
                        <h3>Resumo do dia</h3>
                        <div class="summary-card">
                            <div class="summary-icon">
                                <i data-lucide="calendar-days"></i>
                            </div>
                            <div>
                                <strong>${dashboardData.recentStudies?.length ? "Há sessões registradas hoje" : "Nenhuma sessão registrada ainda"}</strong>
                                <p>${dashboardData.streak > 0 ? `Você está em uma sequência de ${dashboardData.streak} dias.` : "Comece hoje a registrar sua primeira sessão."}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;

}

function attachDashboardRefreshListener(refreshDashboard) {
    if (dashboardRefreshHandler) {
        document.removeEventListener("erickos:studies-updated", dashboardRefreshHandler);
    }

    dashboardRefreshHandler = async () => {
        await refreshDashboard();
    };

    document.addEventListener("erickos:studies-updated", dashboardRefreshHandler);
}

export function initDashboardPage() {

    initTooltip();
    initConsistency();
    initStats();

    const dashboardContainer = document.getElementById("page");

    if (!dashboardContainer) {
        return;
    }

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }

    const refreshDashboard = async () => {
        destroySnake();
        dashboardContainer.innerHTML = await DashboardPage();
        initDashboardPage();
    };

    attachDashboardRefreshListener(refreshDashboard);

    dashboardContainer.addEventListener("click", async event => {
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

                await refreshDashboard();
            } catch (error) {
                console.error(error);
            }
        }
    });

}