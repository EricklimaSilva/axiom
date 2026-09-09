const isLiveServerSession = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    && window.location.port === "5500";
const fallbackBaseUrl = isLiveServerSession
    ? "http://127.0.0.1:5000"
    : window.location.origin;
const configuredBaseUrl = window.__ERICKOS_API_BASE_URL__ || fallbackBaseUrl;
const API_BASE_URL = String(configuredBaseUrl).replace(/\/$/, "");

export { API_BASE_URL };
