const timelineEvents = [
    {
        year: "2024",
        title: "Ideia inicial",
        description: "Nasceu a visão de um sistema pessoal para organizar estudos, projetos e evolução profissional.",
        type: "Conceito"
    },
    {
        year: "2025",
        title: "Primeiro painel operacional",
        description: "O projeto ganhou sua primeira versão com dashboard, consistência e registro de estudos.",
        type: "MVP"
    },
    {
        year: "2026",
        title: "Expansão para portfólio",
        description: "Foram adicionadas abas de projetos, certificados, códigos, sites e dashboards para transformar o sistema em um portfólio vivo.",
        type: "Atualização"
    }
];

function createTimelineMarkup(items = timelineEvents) {
    if (!items.length) {
        return `<div class="empty-state">Nenhum marco registrado ainda.</div>`;
    }

    return `
        <div class="timeline">
            ${items.map((item, index) => `
                <div class="timeline-item ${index % 2 === 0 ? "timeline-left" : "timeline-right"}">
                    <div class="timeline-dot"></div>
                    <article class="timeline-card">
                        <span class="timeline-badge">${item.type}</span>
                        <h3>${item.year}</h3>
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </article>
                </div>
            `).join("")}
        </div>
    `;
}

export function TimelinePage() {
    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon xp-icon"><i data-lucide="calendar-days"></i></span>Timeline</span>
                        <h1>Evolução do projeto</h1>
                        <p>Veja os principais marcos da construção do Axiom e a trajetória do seu portfólio digital.</p>
                    </div>
                </section>

                <section class="projects-page-surface">
                    ${createTimelineMarkup()}
                </section>
            </div>
        </div>
    `;
}

export function initTimelinePage() {
    return null;
}
