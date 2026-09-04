import { navigate } from "../router.js";

export function setActiveNavigation(pageName) {
    const links = document.querySelectorAll("[data-page]");

    links.forEach(link => {
        link.classList.toggle("active", link.dataset.page === pageName);
    });
}

export function initializeSidebar() {

    const links = document.querySelectorAll("[data-page]");

    links.forEach(link => {

        link.addEventListener("click", (event) => {

            event.preventDefault();

            setActiveNavigation(event.currentTarget.dataset.page);

            const page = event.currentTarget.dataset.page;

            navigate(page);

        });

    });

}