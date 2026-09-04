const isLocalBrowserSession = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const fallbackBaseUrl = isLocalBrowserSession
    ? "http://127.0.0.1:5000"
    : window.location.origin;
const configuredBaseUrl = window.__ERICKOS_API_BASE_URL__ || fallbackBaseUrl;
const API_BASE_URL = String(configuredBaseUrl).replace(/\/$/, "");
const ADMIN_API_KEY = window.__ERICKOS_ADMIN_KEY__ || "erickos-admin-allow";

export { API_BASE_URL, ADMIN_API_KEY };
