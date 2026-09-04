import { API_BASE_URL, ADMIN_API_KEY } from "../config.js";

async function parseApiResponse(response) {
    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            throw new Error(`Resposta inválida recebida do servidor. Status: ${response.status}`);
        }
    }

    if (!response.ok) {
        throw new Error(
            payload?.error ||
            payload?.message ||
            `Erro HTTP ${response.status}`
        );
    }

    return payload;
}

export async function apiRequest(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const isAdminMode = window.localStorage.getItem("erickos-admin-mode") === "true";
    const headers = {
        ...(options.headers || {}),
    };

    if (isAdminMode) {
        headers["X-ErickOS-Admin-Key"] = ADMIN_API_KEY;
    }

    let response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
            mode: "cors",
            credentials: "omit",
        });
    } catch (error) {
        throw new Error(`Não foi possível conectar à API em ${url}. Verifique se o backend está rodando em ${API_BASE_URL}.`);
    }

    return parseApiResponse(response);
}

export async function getJson(path) {
    return apiRequest(path, { method: "GET" });
}

export async function postJson(path, data) {
    return apiRequest(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function putJson(path, data) {
    return apiRequest(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function deleteJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "DELETE",
        headers: {
            ...(window.localStorage.getItem("erickos-admin-mode") === "true" ? { "X-ErickOS-Admin-Key": ADMIN_API_KEY } : {}),
        },
        mode: "cors",
        credentials: "omit",
    });

    if (response.status === 204) {
        return null;
    }

    return parseApiResponse(response);
}

// Studies
export const getStudies = () => getJson("/api/studies");
export const getStudy = (id) => getJson(`/api/studies/${id}`);
export const createStudy = (data) => postJson("/api/studies", data);
export const updateStudy = (id, data) => putJson(`/api/studies/${id}`, data);
export const deleteStudy = (id) => deleteJson(`/api/studies/${id}`);

// Projects
export const getProjects = () => getJson("/api/projects");
export const getProject = (id) => getJson(`/api/projects/${id}`);
export const createProject = (data) => postJson("/api/projects", data);
export const updateProject = (id, data) => putJson(`/api/projects/${id}`, data);
export const deleteProject = (id) => deleteJson(`/api/projects/${id}`);

// Languages
export const getLanguages = () => getJson("/api/languages");
export const getLanguage = (id) => getJson(`/api/languages/${id}`);
export const createLanguage = (data) => postJson("/api/languages", data);
export const updateLanguage = (id, data) => putJson(`/api/languages/${id}`, data);
export const deleteLanguage = (id) => deleteJson(`/api/languages/${id}`);

// Certificates
export const getCertificates = () => getJson("/api/certificates");
export const getCertificate = (id) => getJson(`/api/certificates/${id}`);
export const createCertificate = (data) => postJson("/api/certificates", data);
export const updateCertificate = (id, data) => putJson(`/api/certificates/${id}`, data);
export const deleteCertificate = (id) => deleteJson(`/api/certificates/${id}`);

// Codes
export const getCodes = (type) => getJson(type ? `/api/codes?type=${encodeURIComponent(type)}` : "/api/codes");
export const getCode = (id) => getJson(`/api/codes/${id}`);
export const createCode = (data) => postJson("/api/codes", data);
export const updateCode = (id, data) => putJson(`/api/codes/${id}`, data);
export const deleteCode = (id) => deleteJson(`/api/codes/${id}`);

// Sites
export const getSites = () => getJson("/api/sites");
export const getSite = (id) => getJson(`/api/sites/${id}`);
export const createSite = (data) => postJson("/api/sites", data);
export const updateSite = (id, data) => putJson(`/api/sites/${id}`, data);
export const deleteSite = (id) => deleteJson(`/api/sites/${id}`);

// Dashboards
export const getDashboards = () => getJson("/api/dashboards");
export const getDashboardProject = (id) => getJson(`/api/dashboards/${id}`);
export const createDashboard = (data) => postJson("/api/dashboards", data);
export const updateDashboard = (id, data) => putJson(`/api/dashboards/${id}`, data);
export const deleteDashboard = (id) => deleteJson(`/api/dashboards/${id}`);

// Settings
export const getSettings = () => getJson("/api/settings");
export const getSetting = (id) => getJson(`/api/settings/${id}`);
export const createSetting = (data) => postJson("/api/settings", data);
export const updateSetting = (id, data) => putJson(`/api/settings/${id}`, data);
export const deleteSetting = (id) => deleteJson(`/api/settings/${id}`);

// Dashboard summary
export const getDashboardSummary = () => getJson("/api/dashboard/summary");
