function getTooltipElements() {

    return {
        tooltip: document.getElementById(
            "consistency-tooltip"
        ),

        status: document.getElementById(
            "tooltip-status"
        ),

        level: document.getElementById(
            "tooltip-level"
        ),

        date: document.getElementById(
            "tooltip-date"
        )
    };

}


function showTooltip(cell) {

    const {
        tooltip,
        status,
        level,
        date
    } = getTooltipElements();

    if (
        !tooltip ||
        !status ||
        !level ||
        !date
    ) {
        return;
    }

    status.textContent =
        cell.dataset.status;

    level.textContent =
        `Nível de estudo: ${cell.dataset.level}`;

    date.textContent =
        cell.dataset.date;

    tooltip.style.opacity = "1";

    tooltip.style.transform =
        "translateY(0)";
}


function moveTooltip(event) {

    const {
        tooltip
    } = getTooltipElements();

    if (!tooltip) {
        return;
    }

    const offset = 16;

    const tooltipWidth =
        tooltip.offsetWidth;

    const tooltipHeight =
        tooltip.offsetHeight;

    const viewportWidth =
        window.innerWidth;

    const viewportHeight =
        window.innerHeight;

    let left =
        event.clientX + offset;

    let top =
        event.clientY + offset;

    if (
        left + tooltipWidth >
        viewportWidth
    ) {

        left =
            event.clientX -
            tooltipWidth -
            offset;

    }

    if (
        top + tooltipHeight >
        viewportHeight
    ) {

        top =
            event.clientY -
            tooltipHeight -
            offset;

    }

    tooltip.style.left =
        `${left}px`;

    tooltip.style.top =
        `${top}px`;
}


function hideTooltip() {

    const {
        tooltip
    } = getTooltipElements();

    if (!tooltip) {
        return;
    }

    tooltip.style.opacity = "0";

    tooltip.style.transform =
        "translateY(8px)";
}


export function initTooltip() {

    const consistencyComponent =
        document.querySelector(
            ".consistency-component"
        );

    if (!consistencyComponent) {

        console.warn(
            "⚠️ Componente de consistência não encontrado para o tooltip."
        );

        return;

    }

    consistencyComponent.addEventListener(
        "mouseover",
        event => {

            const cell =
                event.target.closest(
                    ".consistency-grid .consistency-cell"
                );

            if (
                !cell ||
                cell.disabled
            ) {
                return;
            }

            showTooltip(cell);

        }
    );

    consistencyComponent.addEventListener(
        "mousemove",
        event => {

            const cell =
                event.target.closest(
                    ".consistency-grid .consistency-cell"
                );

            if (
                !cell ||
                cell.disabled
            ) {
                return;
            }

            moveTooltip(event);

        }
    );

    consistencyComponent.addEventListener(
        "mouseout",
        event => {

            const cell =
                event.target.closest(
                    ".consistency-grid .consistency-cell"
                );

            if (!cell) {
                return;
            }

            const nextElement =
                event.relatedTarget;

            if (
                nextElement &&
                cell.contains(nextElement)
            ) {
                return;
            }

            hideTooltip();

        }
    );

    consistencyComponent.addEventListener(
        "focusin",
        event => {

            const cell =
                event.target.closest(
                    ".consistency-grid .consistency-cell"
                );

            if (
                !cell ||
                cell.disabled
            ) {
                return;
            }

            showTooltip(cell);

            const cellPosition =
                cell.getBoundingClientRect();

            moveTooltip({
                clientX:
                    cellPosition.left +
                    cellPosition.width / 2,

                clientY:
                    cellPosition.bottom
            });

        }
    );

    consistencyComponent.addEventListener(
        "focusout",
        event => {

            const cell =
                event.target.closest(
                    ".consistency-grid .consistency-cell"
                );

            if (!cell) {
                return;
            }

            hideTooltip();

        }
    );

    console.log(
        "✅ Tooltip da consistência inicializado."
    );

}