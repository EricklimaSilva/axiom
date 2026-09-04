import { WelcomePage, initWelcomePage } from "./pages/WelcomePage.js";
import {
    DashboardPage,
    initDashboardPage
} from "./pages/DashboardPage.js";

import { ProjectsPage, initProjectsPage } from "./pages/ProjectsPage.js";
import { LanguagePage, initLanguagePage } from "./pages/LanguagePage.js";
import { DiaryPage, initDiaryPage } from "./pages/DiaryPage.js";
import { ConsistencyPage, initConsistencyPage } from "./pages/ConsistencyPage.js";
import { CertificatesPage, initCertificatesPage } from "./pages/CertificatesPage.js";
import { AuthorCodesPage, initAuthorCodesPage } from "./pages/AuthorCodesPage.js";
import { AICodesPage, initAICodesPage } from "./pages/AICodesPage.js";
import { SitesPage, initSitesPage } from "./pages/SitesPage.js";
import { DashboardsPage, initDashboardsPage } from "./pages/DashboardsPage.js";
import { TimelinePage, initTimelinePage } from "./pages/TimelinePage.js";
import { SettingsPage, initSettingsPage } from "./pages/SettingsPage.js";
import { setActiveNavigation } from "./components/Sidebar.js";

function renderPageContent(content) {
    const app = document.getElementById("page");

    if (!app) {
        return;
    }

    app.innerHTML = content;

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }
}

export async function navigate(page) {

    const app = document.getElementById("page");

    if (!app) {
        return;
    }

    setActiveNavigation(page);

    try {
        switch (page) {

            case "welcome":

                renderPageContent("<div class=\"page-content\">Carregando página inicial...</div>");
                const welcomeMarkup = WelcomePage();
                renderPageContent(welcomeMarkup);
                initWelcomePage();

                break;

            case "dashboard":

                renderPageContent("<div class=\"page-content\">Carregando dashboard...</div>");
                const dashboardMarkup = await DashboardPage();
                renderPageContent(dashboardMarkup);
                initDashboardPage();

                break;

        case "diary":

            renderPageContent("<div class=\"page-content\">Carregando diário...</div>");
            const diaryMarkup = await DiaryPage();
            renderPageContent(diaryMarkup);
            initDiaryPage();

            break;

        case "consistency":

            renderPageContent("<div class=\"page-content\">Carregando consistência...</div>");
            const consistencyMarkup = await ConsistencyPage();
            renderPageContent(consistencyMarkup);
            initConsistencyPage();

            break;

        case "projects":

            renderPageContent("<div class=\"page-content\">Carregando projetos...</div>");
            const projectsMarkup = await ProjectsPage();
            renderPageContent(projectsMarkup);
            initProjectsPage();

            break;

        case "language":

            renderPageContent("<div class=\"page-content\">Carregando idioma...</div>");
            const languageMarkup = await LanguagePage();
            renderPageContent(languageMarkup);
            initLanguagePage();

            break;

        case "certificates":

            renderPageContent("<div class=\"page-content\">Carregando certificados...</div>");
            const certificatesMarkup = await CertificatesPage();
            renderPageContent(certificatesMarkup);
            initCertificatesPage();

            break;

        case "author-codes":

            renderPageContent("<div class=\"page-content\">Carregando códigos autorais...</div>");
            const authorCodesMarkup = await AuthorCodesPage();
            renderPageContent(authorCodesMarkup);
            initAuthorCodesPage();

            break;

        case "ai-codes":

            renderPageContent("<div class=\"page-content\">Carregando códigos com IA...</div>");
            const aiCodesMarkup = await AICodesPage();
            renderPageContent(aiCodesMarkup);
            initAICodesPage();

            break;

        case "sites":

            renderPageContent("<div class=\"page-content\">Carregando sites...</div>");
            const sitesMarkup = await SitesPage();
            renderPageContent(sitesMarkup);
            initSitesPage();

            break;

        case "dashboards":

            renderPageContent("<div class=\"page-content\">Carregando dashboards...</div>");
            const dashboardsMarkup = await DashboardsPage();
            renderPageContent(dashboardsMarkup);
            initDashboardsPage();

            break;

        case "timeline":

            renderPageContent("<div class=\"page-content\">Carregando timeline...</div>");
            const timelineMarkup = TimelinePage();
            renderPageContent(timelineMarkup);
            initTimelinePage();

            break;

        case "settings":

            renderPageContent("<div class=\"page-content\">Carregando configurações...</div>");
            const settingsMarkup = await SettingsPage();
            renderPageContent(settingsMarkup);
            initSettingsPage();

            break;

            default:

                renderPageContent("<div class=\"page-content\">Carregando página inicial...</div>");
                const defaultWelcomeMarkup = WelcomePage();
                renderPageContent(defaultWelcomeMarkup);
                initWelcomePage();

        }
    } catch (error) {
        console.error("Erro ao navegar:", error);
        renderPageContent(`
            <div class="page-content">
                <div class="content-container">
                    <section class="projects-page-hero">
                        <div>
                            <span class="consistency-page-badge"><span class="stat-icon project-icon hero-badge-icon"><i data-lucide="sparkles"></i></span>Visualização</span>
                            <h1>Conteúdo de exemplo carregado</h1>
                            <p>A navegação está funcionando e esta página mostra um estado de demonstração enquanto o backend é carregado.</p>
                        </div>
                    </section>
                </div>
            </div>
        `);
    }

}