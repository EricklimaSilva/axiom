export function WelcomePage() {
    const birthDate = new Date("2001-05-28");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
        age -= 1;
    }

    const languages = ["HTML", "CSS", "Python", "JavaScript", "SQL", "Power BI"];

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero welcome-hero">
                    <div class="welcome-hero-copy">
                        <span class="consistency-page-badge"><span class="hero-badge-icon xp-icon"><i data-lucide="home"></i></span>Bem-vindo</span>
                        <h1>Este é o espaço onde minha curva de aprendizagem ganha forma.</h1>
                        <p>Eu criei este projeto para registrar, organizar e mostrar minha evolução em tecnologia, estudo e criação. Aqui, cada etapa representa um novo desafio, uma nova descoberta e uma versão mais madura de mim.</p>
                        <div class="welcome-hero-actions">
                            <span class="welcome-pill">Aprendizado contínuo</span>
                            <span class="welcome-pill">Projetos em construção</span>
                            <span class="welcome-pill">Portfólio vivo</span>
                        </div>
                    </div>
                    <div class="welcome-photo-card">
                        <img src="./assets/images/imagem_perfil_principal.jpeg" alt="Foto de Erick" />
                    </div>
                </section>

                <section class="projects-page-surface">
                    <div class="welcome-info-grid">
                        <article class="welcome-info-card welcome-info-card-main">
                            <div class="welcome-card-icon xp-icon">
                                <i data-lucide="user-round"></i>
                            </div>
                            <h3>Sobre mim</h3>
                            <p>Sou Erick Rodrigues, tenho ${age} anos, nasci em 28/05/2001 e sou formado em Ciência da Computação.</p>
                            <p>Minha trajetória é marcada por estudo constante, projeto após projeto e uma busca contínua por evolução técnica e pessoal.</p>
                        </article>

                        <article class="welcome-info-card">
                            <div class="welcome-card-icon streak-icon">
                                <i data-lucide="code-2"></i>
                            </div>
                            <h3>Tecnologias em estudo</h3>
                            <div class="welcome-tech-list">
                                ${languages.map(lang => `<span class="welcome-tech-chip">${lang}</span>`).join("")}
                            </div>
                        </article>
                    </div>

                    <div class="welcome-grid">
                        <article class="welcome-card welcome-card-accent">
                            <div class="welcome-card-icon xp-icon">
                                <i data-lucide="compass"></i>
                            </div>
                            <h3>O propósito do projeto</h3>
                            <p>Este portfólio não é apenas uma vitrine. Ele é uma forma de transformar meu processo de aprendizagem em algo claro, visual e inspirador para quem acompanha minha trajetória.</p>
                        </article>

                        <article class="welcome-card">
                            <div class="welcome-card-icon streak-icon">
                                <i data-lucide="trending-up"></i>
                            </div>
                            <h3>Minha curva de aprendizagem</h3>
                            <p>Cada seção representa uma fase da minha evolução: estudos, projetos, certificados, ferramentas, reflexões e entregas. O objetivo é mostrar progresso real, com honestidade e consistência.</p>
                        </article>

                        <article class="welcome-card">
                            <div class="welcome-card-icon project-icon">
                                <i data-lucide="sparkles"></i>
                            </div>
                            <h3>O que você vai encontrar</h3>
                            <p>Dashboard com métricas, diário de estudos, projetos publicados, certificados, códigos autorais, ideias com IA, sites, timeline e uma visão geral do meu desenvolvimento.</p>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    `;
}

export function initWelcomePage() {
    return null;
}
