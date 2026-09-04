import { getDashboardData } from "../dashboard/dashboardApi.js";
import { createConsistencyComponent, initConsistency } from "../dashboard/Consistency.js";

function buildConsistencyMetrics(dashboardData = {}) {
    const studyDays = dashboardData.consistency ?? [];
    const totalSessions = studyDays.length;
    const totalMinutes = studyDays.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
    const totalCertificates = Number(dashboardData.certificates ?? 0);
    const currentStreak = Number(dashboardData.streak ?? 0);
    const bestStreak = studyDays.length > 0 ? Math.max(...studyDays.map(entry => Number(entry.level || 0))) : 0;
    const progress = totalSessions > 0 ? Math.min(100, Math.round((totalSessions / 365) * 100)) : 0;

    return {
        totalSessions,
        totalMinutes,
        totalCertificates,
        currentStreak,
        bestStreak,
        progress,
    };
}

export async function ConsistencyPage() {
    const response = await getDashboardData();
    const dashboardData = response?.data ?? response;
    const metrics = buildConsistencyMetrics(dashboardData);

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="consistency-page-hero">
                    <div>
                        <span class="consistency-page-badge">Painel de consistência</span>
                        <h1>Sequências de estudo e conquistas</h1>
                        <p>Monitore a rotina de estudos, a evolução diária e o avanço em direção aos seus certificados com um painel dedicado.</p>
                    </div>
                </section>

                <section class="consistency-page-grid">
                    <div class="consistency-metrics-card">
                        <h3>Métricas principais</h3>
                        <div class="consistency-metric-grid">
                            <div class="consistency-metric-pill">
                                <span>Sessions registradas</span>
                                <strong>${metrics.totalSessions}</strong>
                            </div>
                            <div class="consistency-metric-pill">
                                <span>Minutos estudados</span>
                                <strong>${metrics.totalMinutes}</strong>
                            </div>
                            <div class="consistency-metric-pill">
                                <span>Sequência atual</span>
                                <strong>${metrics.currentStreak} dias</strong>
                            </div>
                            <div class="consistency-metric-pill">
                                <span>Certificados</span>
                                <strong>${metrics.totalCertificates}</strong>
                            </div>
                        </div>

                        <div class="consistency-progress-row">
                            <div class="label-row">
                                <span>Progresso anual</span>
                                <strong>${metrics.progress}%</strong>
                            </div>
                            <div class="consistency-progress-bar">
                                <span style="width:${metrics.progress}%"></span>
                            </div>
                        </div>
                    </div>

                    <div class="consistency-progress-card">
                        <h3>Conquistas e foco</h3>
                        <div class="consistency-metric-grid">
                            <div class="consistency-metric-pill">
                                <span>Maior sequência</span>
                                <strong>${metrics.bestStreak}</strong>
                            </div>
                            <div class="consistency-metric-pill">
                                <span>Metas de certificados</span>
                                <strong>${Math.max(0, 3 - metrics.totalCertificates)}</strong>
                            </div>
                        </div>
                        <p class="empty-state" style="margin-top:14px;">A cada nova sessão, sua sequência cresce e o painel se torna mais forte.</p>
                    </div>
                </section>

                <section class="consistency-page-surface">
                    ${createConsistencyComponent(dashboardData.consistency ?? [], new Date().getFullYear())}
                </section>
            </div>
        </div>
    `;
}

export function initConsistencyPage() {
    const container = document.getElementById("page");

    if (!container) {
        return;
    }

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }

    initConsistency();
}
