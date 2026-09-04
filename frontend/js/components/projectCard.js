export function createProjectCard(project) {
    const card = document.createElement("article");

    card.classList.add("project-card");

    card.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description || "Sem descrição."}</p>
        <strong>${project.technologies || "Tecnologias não informadas."}</strong>
    `;

    return card;
}