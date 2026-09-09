const ADMIN_MODE_KEY = "erickos-admin-mode";
const ADMIN_TOKEN_KEY = "erickos-admin-key";

function readSessionStorage(key) {
    try {
        return window.sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeSessionStorage(key, value) {
    try {
        window.sessionStorage.setItem(key, value);
    } catch {
        // Ignore storage errors in restricted browsing contexts.
    }
}

function removeSessionStorage(key) {
    try {
        window.sessionStorage.removeItem(key);
    } catch {
        // Ignore storage errors in restricted browsing contexts.
    }
}

export function clearLegacyAdminMode() {
    try {
        window.localStorage.removeItem(ADMIN_MODE_KEY);
    } catch {
        // Ignore localStorage errors.
    }
}

export function getAdminMode() {
    return readSessionStorage(ADMIN_MODE_KEY) === "true";
}

export function getAdminToken() {
    return String(readSessionStorage(ADMIN_TOKEN_KEY) || "").trim();
}

export function isAdminAuthenticated() {
    return getAdminMode() && Boolean(getAdminToken());
}

export function enableAdminSession(adminKey) {
    const normalizedKey = String(adminKey || "").trim();

    if (!normalizedKey) {
        return false;
    }

    writeSessionStorage(ADMIN_MODE_KEY, "true");
    writeSessionStorage(ADMIN_TOKEN_KEY, normalizedKey);

    return true;
}

export function disableAdminSession() {
    removeSessionStorage(ADMIN_MODE_KEY);
    removeSessionStorage(ADMIN_TOKEN_KEY);
}
