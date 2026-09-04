import { navigate } from "../router.js";
import { createSetting, getSettings, updateSetting } from "../services/api.js";

const STORAGE_KEY = "erickos-admin-mode";
const ADMIN_SETTING_KEY = "ui.admin_mode";

function getAdminMode() {
    return localStorage.getItem(STORAGE_KEY) === "true";
}

function setAdminMode(enabled) {
    localStorage.setItem(STORAGE_KEY, String(enabled));
}

const settings = [
    {
        title: "Modo administrador",
        description: "Apenas você pode adicionar, editar ou excluir conteúdos das seções do Axiom.",
        status: "Ativo"
    },
    {
        title: "Visão pública",
        description: "O site exibe uma interface organizada para todos os visitantes, sem o painel administrativo.",
        status: "Ativo"
    },
    {
        title: "Seções principais",
        description: "Dashboard, projetos, certificados, códigos, sites, dashboards e timeline ficam disponíveis na experiência visual do usuário.",
        status: "Visível"
    }
];

function createSettingsMarkup(items = settings, adminMode) {
    const modeLabel = adminMode ? "Ativado" : "Desativado";

    return `
        <div class="settings-list">
            <article class="settings-card settings-card-highlight">
                <div class="settings-card-header">
                    <h3>Status do modo administrativo</h3>
                    <span class="settings-badge">${modeLabel}</span>
                </div>
                <p>${adminMode ? "Você está no modo de gestão e pode controlar o conteúdo do sistema." : "O sistema está em modo visual para o público."}</p>
                <button class="settings-toggle-btn" id="settings-toggle-btn">${adminMode ? "Desativar modo admin" : "Ativar modo admin"}</button>
            </article>
            ${items.map(item => `
                <article class="settings-card">
                    <div class="settings-card-header">
                        <h3>${item.title}</h3>
                        <span class="settings-badge">${item.status}</span>
                    </div>
                    <p>${item.description}</p>
                </article>
            `).join("")}
        </div>
    `;
}

async function loadSettingsState() {
    try {
        const response = await getSettings();
        const items = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        const adminSetting = items.find(item => item.key === ADMIN_SETTING_KEY);
        const adminMode = adminSetting ? adminSetting.value === "true" : getAdminMode();

        setAdminMode(adminMode);

        return {
            adminMode,
            items: settings,
        };
    } catch (error) {
        console.warn("Não foi possível carregar as configurações.", error);

        return {
            adminMode: getAdminMode(),
            items: settings,
        };
    }
}

export async function SettingsPage() {
    const state = await loadSettingsState();

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon project-icon"><i data-lucide="settings"></i></span>Configurações</span>
                        <h1>Admin e visual separados</h1>
                        <p>Defina como o sistema deve funcionar para você como administrador e para o público visitante.</p>
                    </div>
                </section>

                <section class="projects-page-surface">
                    ${createSettingsMarkup(state.items, state.adminMode)}
                </section>
            </div>
        </div>
    `;
}

export function initSettingsPage() {
    const toggleButton = document.getElementById("settings-toggle-btn");

    if (!toggleButton) {
        return;
    }

    toggleButton.addEventListener("click", async () => {
        const enabled = !getAdminMode();
        setAdminMode(enabled);

        try {
            const response = await getSettings();
            const items = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
            const existing = items.find(item => item.key === ADMIN_SETTING_KEY);

            if (existing) {
                await updateSetting(existing.id, { key: ADMIN_SETTING_KEY, value: String(enabled) });
            } else {
                await createSetting({ key: ADMIN_SETTING_KEY, value: String(enabled) });
            }
        } catch (error) {
            console.warn("Não foi possível persistir o modo administrador.", error);
        }

        navigate("settings");
    });

    return null;
}
