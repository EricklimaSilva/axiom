export function createStatsCards(stats) {
    const cards = [
        {
            title: "XP Total",
            value: stats.xp.toLocaleString("pt-BR"),
            subtitle: `${stats.xp > 0 ? "+" : ""}${Math.max(0, Math.min(100, stats.xp % 100))} hoje`,
            icon: "zap",
            className: "xp-icon"
        },
        {
            title: "Sequência",
            value: stats.streak,
            subtitle: stats.streak > 1 ? "dias consecutivos" : "dia consecutivo",
            icon: "flame",
            className: "streak-icon"
        },
        {
            title: "Projetos",
            value: stats.projects,
            subtitle: stats.projects > 1 ? "ativos" : "ativo",
            icon: "briefcase",
            className: "project-icon"
        },
        {
            title: "Certificados",
            value: stats.certificates,
            subtitle: stats.certificates > 1 ? "conquistados" : "conquistado",
            icon: "trophy",
            className: "certificate-icon"
        }
    ];

    return cards.map(card => `
        <div class="stat-card">
            <div class="stat-icon ${card.className}">
                <i data-lucide="${card.icon}"></i>
            </div>
            <span class="stat-title">${card.title}</span>
            <h2>${card.value}</h2>
            <small>${card.subtitle}</small>
        </div>
    `).join("");
}

export function initStats() {

    console.log("✅ Módulo de estatísticas inicializado.");

}