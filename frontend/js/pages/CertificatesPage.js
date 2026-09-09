import { createCertificate, deleteCertificate, getCertificates, updateCertificate } from "../services/api.js";

let editingCertificateId = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeCertificates(response) {
    return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
}

function createCertificatesMarkup(items = [], adminMode = false) {
    if (!items.length) {
        return `<div class="empty-state">Nenhum certificado registrado ainda.</div>`;
    }

    return `
        <div class="certificate-shelf">
            ${items.map(item => `
                <article class="certificate-card" data-certificate-id="${item.id}">
                    <div class="certificate-cover">
                        <img src="${escapeHtml(item.certificate_url || "./assets/images/default-certificate.svg")}" alt="Certificado ${escapeHtml(item.name)}">
                    </div>
                    <div class="certificate-content">
                        <div class="certificate-meta">
                            <span class="certificate-badge">${escapeHtml(item.institution || "Instituição")}</span>
                            <span class="certificate-time">${escapeHtml(item.issue_date || "Sem data")}</span>
                        </div>
                        <h3>${escapeHtml(item.name)}</h3>
                        <p class="certificate-synopsis">${escapeHtml(item.description || "")}</p>
                        <div class="certificate-footer">
                            <span>${item.issue_date ? `Emitido em ${escapeHtml(item.issue_date)}` : "Sem data de emissão"}</span>
                        </div>
                        ${adminMode ? `
                            <div class="study-edit-actions" style="margin-top: 16px;">
                                <button type="button" class="study-action-btn edit" data-action="edit-certificate" data-certificate-id="${item.id}">Editar</button>
                                <button type="button" class="study-action-btn delete" data-action="delete-certificate" data-certificate-id="${item.id}">Excluir</button>
                            </div>
                        ` : ""}
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function buildCertificateForm(certificate = null) {
    return `
        <section class="projects-page-surface">
            <form id="certificate-form" class="projects-form">
                <div class="projects-form-grid">
                    <label>
                        <span>Nome</span>
                        <input type="text" name="name" required value="${escapeHtml(certificate?.name || "")}">
                    </label>
                    <label>
                        <span>Instituição</span>
                        <input type="text" name="institution" value="${escapeHtml(certificate?.institution || "")}">
                    </label>
                    <label>
                        <span>Data de emissão</span>
                        <input type="date" name="issue_date" value="${escapeHtml(certificate?.issue_date || "")}">
                    </label>
                    <label>
                        <span>URL do certificado</span>
                        <input type="url" name="certificate_url" value="${escapeHtml(certificate?.certificate_url || "")}">
                    </label>
                </div>
                <label class="study-form-full">
                    <span>Descrição</span>
                    <textarea name="description" rows="3">${escapeHtml(certificate?.description || "")}</textarea>
                </label>
                <div class="projects-form-actions">
                    <button type="submit">${certificate ? "Atualizar certificado" : "Salvar certificado"}</button>
                    ${certificate ? `<button type="button" id="certificate-cancel-edit">Cancelar edição</button>` : ""}
                    <p class="projects-form-feedback" id="certificate-form-feedback"></p>
                </div>
            </form>
        </section>
    `;
}

async function loadCertificates() {
    try {
        return normalizeCertificates(await getCertificates());
    } catch (error) {
        console.warn("Não foi possível carregar certificados.", error);
        return [];
    }
}

export async function CertificatesPage() {
    const adminMode = sessionStorage.getItem("erickos-admin-mode") === "true";
    const certificates = await loadCertificates();

    return `
        <div class="page-content">
            <div class="content-container">
                <section class="projects-page-hero">
                    <div>
                        <span class="consistency-page-badge"><span class="hero-badge-icon certificate-icon"><i data-lucide="award"></i></span>Certificados</span>
                        <h1>Estante de certificados</h1>
                        <p>Organize seus certificados como se fossem livros de uma biblioteca, com imagem, resumo e tempo de conclusão.</p>
                    </div>
                </section>

                ${adminMode ? buildCertificateForm() : ""}

                <section class="projects-page-surface">
                    <input type="search" id="certificate-search" placeholder="Buscar certificado..." aria-label="Buscar certificados" class="projects-search-input">
                    ${createCertificatesMarkup(certificates, adminMode)}
                </section>
            </div>
        </div>
    `;
}

async function refreshCertificatesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    container.innerHTML = await CertificatesPage();
    initCertificatesPage();
}

function populateCertificateForm(certificate) {
    const form = document.getElementById("certificate-form");
    const feedback = document.getElementById("certificate-form-feedback");

    if (!form) {
        return;
    }

    editingCertificateId = certificate.id;
    form.querySelector('input[name="name"]').value = certificate.name || "";
    form.querySelector('input[name="institution"]').value = certificate.institution || "";
    form.querySelector('input[name="issue_date"]').value = certificate.issue_date || "";
    form.querySelector('input[name="certificate_url"]').value = certificate.certificate_url || "";
    form.querySelector('textarea[name="description"]').value = certificate.description || "";

    if (feedback) {
        feedback.textContent = `Editando ${certificate.name || "certificado"}.`;
    }
}

export function initCertificatesPage() {
    const container = document.getElementById("page");
    if (!container) {
        return;
    }

    if (container.dataset.certificateListenersAttached === "true") {
        return;
    }

    container.dataset.certificateListenersAttached = "true";

    container.addEventListener("submit", async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== "certificate-form") {
            return;
        }

        event.preventDefault();
        const feedback = document.getElementById("certificate-form-feedback");
        const formData = new FormData(form);
        const payload = {
            name: formData.get("name") || "",
            institution: formData.get("institution") || "",
            issue_date: formData.get("issue_date") || "",
            certificate_url: formData.get("certificate_url") || "",
            description: formData.get("description") || "",
        };

        if (feedback) {
            feedback.textContent = editingCertificateId ? "Atualizando certificado..." : "Salvando certificado...";
        }

        try {
            if (editingCertificateId) {
                await updateCertificate(editingCertificateId, payload);
            } else {
                await createCertificate(payload);
            }

            editingCertificateId = null;
            await refreshCertificatesPage();
        } catch (error) {
            if (feedback) {
                feedback.textContent = error.message;
            }
        }
    });

    container.addEventListener("click", async event => {
        const feedback = document.getElementById("certificate-form-feedback");
        const editButton = event.target.closest("[data-action='edit-certificate']");
        const deleteButton = event.target.closest("[data-action='delete-certificate']");
        const cancelButton = event.target.closest("#certificate-cancel-edit");

        if (editButton) {
            const certificateId = Number(editButton.dataset.certificateId);
            const certificates = await loadCertificates();
            const certificate = certificates.find(item => Number(item.id) === certificateId);
            if (certificate) {
                populateCertificateForm(certificate);
            }
        }

        if (deleteButton) {
            const certificateId = Number(deleteButton.dataset.certificateId);
            try {
                await deleteCertificate(certificateId);
                if (editingCertificateId === certificateId) {
                    editingCertificateId = null;
                }
                await refreshCertificatesPage();
            } catch (error) {
                if (feedback) {
                    feedback.textContent = error.message;
                }
            }
        }

        if (cancelButton) {
            editingCertificateId = null;
            await refreshCertificatesPage();
        }
    });

    const searchInput = document.getElementById("certificate-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            container.querySelectorAll(".certificate-card").forEach(card => {
                const text = card.textContent?.toLowerCase() || "";
                card.style.display = text.includes(query) ? "" : "none";
            });
        });
    }
}
