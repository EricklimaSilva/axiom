const DEFAULT_CONFIG = {
    segmentCount: 10,
    speed: 0.16,
    pauseDuration: 180,
    glowDuration: 320,
    resizeDebounce: 140,
};

const state = {
    config: DEFAULT_CONFIG,
    isInitialized: false,
    isRunning: false,
    animationFrameId: null,
    resizeTimerId: null,
    activeCells: [],
    path: [],
    currentTargetIndex: 0,
    waitUntil: 0,
    headPosition: { x: 0, y: 0 },
    headElement: null,
    bodyElement: null,
    eyeElement: null,
    segmentElements: [],
    glowElement: null,
    container: null,
    calendar: null,
    grid: null,
    reducedMotion: false,
    highlightedCell: null,
    highlightTimerId: null,
};

function createCompanionMarkup() {
    const wrapper = document.createElement("div");
    wrapper.className = "study-companion-layer";
    wrapper.setAttribute("aria-hidden", "true");

    const segmentsMarkup = Array.from(
        { length: state.config.segmentCount },
        () => '<div class="study-companion__segment"></div>'
    ).join("");

    wrapper.innerHTML = `
        <div class="study-companion__glow"></div>
        ${segmentsMarkup}
        <div class="study-companion__body"></div>
        <div class="study-companion__eye"></div>
        <div class="study-companion__head"></div>
    `;

    return wrapper;
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function getCalendarHost() {
    return document.querySelector(".consistency-calendar");
}

function getGridHost() {
    return document.querySelector("#consistency-grid");
}

function getActiveCells() {
    if (!state.grid) {
        return [];
    }

    return Array.from(state.grid.querySelectorAll(".consistency-cell"))
        .filter(cell => Number(cell.dataset.level || 0) > 0)
        .filter(cell => !cell.disabled)
        .filter(cell => !cell.classList.contains("outside-year"))
        .sort((left, right) => {
            const leftDate = left.dataset.dateKey || "";
            const rightDate = right.dataset.dateKey || "";
            return leftDate.localeCompare(rightDate);
        });
}

function getCellCenter(cell) {
    if (!state.calendar || !cell) {
        return { x: 0, y: 0 };
    }

    const rect = cell.getBoundingClientRect();
    const containerRect = state.calendar.getBoundingClientRect();
    const offsetX = rect.left - containerRect.left + rect.width / 2;
    const offsetY = rect.top - containerRect.top + rect.height / 2;

    return {
        x: offsetX,
        y: offsetY,
    };
}

function updateSegmentPositions() {
    const segments = state.segmentElements;

    if (!segments.length) {
        return;
    }

    for (let index = segments.length - 1; index >= 0; index -= 1) {
        const segment = segments[index];
        const target = index === segments.length - 1
            ? state.headPosition
            : segments[index + 1];

        if (!segment.x) {
            segment.x = target.x;
            segment.y = target.y;
        }

        const followAmount = 0.19 + index * 0.03;
        segment.x = lerp(segment.x, target.x, followAmount);
        segment.y = lerp(segment.y, target.y, followAmount);

        segment.element.style.transform = `translate3d(${segment.x}px, ${segment.y}px, 0)`;
        segment.element.style.opacity = index === 0 ? "0.95" : "0.9";
    }
}

function updateCompanionPosition() {
    if (!state.headElement) {
        return;
    }

    state.headElement.style.transform = `translate3d(${state.headPosition.x}px, ${state.headPosition.y}px, 0)`;

    if (state.bodyElement) {
        state.bodyElement.style.transform = `translate3d(${state.headPosition.x + 4}px, ${state.headPosition.y + 8}px, 0)`;
    }

    if (state.eyeElement) {
        state.eyeElement.style.transform = `translate3d(${state.headPosition.x + 7}px, ${state.headPosition.y + 3}px, 0)`;
    }

    if (state.glowElement) {
        state.glowElement.style.transform = `translate3d(${state.headPosition.x - 10}px, ${state.headPosition.y - 10}px, 0)`;
    }

    updateSegmentPositions();
}

function clearHighlightedCell() {
    if (state.highlightedCell) {
        state.highlightedCell.classList.remove("consistency-cell--companion-active");
        state.highlightedCell = null;
    }
}

function highlightCurrentCell(cell) {
    if (!cell) {
        return;
    }

    clearHighlightedCell();
    cell.classList.add("consistency-cell--companion-active");
    state.highlightedCell = cell;

    if (state.highlightTimerId) {
        window.clearTimeout(state.highlightTimerId);
    }

    state.highlightTimerId = window.setTimeout(() => {
        clearHighlightedCell();
    }, state.config.glowDuration);
}

function resetCompanionPositions() {
    const firstPath = state.path[0];

    if (!firstPath) {
        return;
    }

    state.headPosition = { ...firstPath };
    state.segmentElements.forEach(segment => {
        segment.x = firstPath.x;
        segment.y = firstPath.y;
        segment.element.style.transform = `translate3d(${firstPath.x}px, ${firstPath.y}px, 0)`;
    });
    updateCompanionPosition();
}

function hideCompanion() {
    if (state.container) {
        state.container.style.opacity = "0";
    }
}

function showCompanion() {
    if (state.container) {
        state.container.style.opacity = "1";
    }
}

function buildPath() {
    state.activeCells = getActiveCells();
    state.path = state.activeCells.map(cell => getCellCenter(cell));

    if (!state.path.length) {
        hideCompanion();
        return;
    }

    state.currentTargetIndex = 0;
    state.waitUntil = 0;

    showCompanion();
    resetCompanionPositions();
}

function animateCompanion(timestamp) {
    if (!state.isRunning || !state.path.length) {
        return;
    }

    if (state.reducedMotion) {
        state.isRunning = false;
        return;
    }

    if (timestamp < state.waitUntil) {
        state.animationFrameId = window.requestAnimationFrame(animateCompanion);
        return;
    }

    const target = state.path[state.currentTargetIndex];

    const dx = target.x - state.headPosition.x;
    const dy = target.y - state.headPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 1.3) {
        state.headPosition = { ...target };
        const currentCell = state.activeCells[state.currentTargetIndex];
        highlightCurrentCell(currentCell);

        state.currentTargetIndex += 1;

        if (state.currentTargetIndex >= state.path.length) {
            state.currentTargetIndex = 0;
        }

        state.waitUntil = timestamp + state.config.pauseDuration;
    } else {
        const speed = Math.max(0.85, state.config.speed * (distance > 220 ? 1.12 : 1));
        state.headPosition = {
            x: state.headPosition.x + dx * speed,
            y: state.headPosition.y + dy * speed,
        };
    }

    updateCompanionPosition();
    state.animationFrameId = window.requestAnimationFrame(animateCompanion);
}

export function initializeStudyCompanion() {
    if (state.isInitialized) {
        destroyStudyCompanion();
    }

    state.calendar = getCalendarHost();
    state.grid = getGridHost();
    state.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!state.calendar || !state.grid) {
        return false;
    }

    const existingLayer = state.calendar.querySelector(".study-companion-layer");
    if (existingLayer) {
        existingLayer.remove();
    }

    state.container = createCompanionMarkup();
    state.calendar.appendChild(state.container);
    state.container.style.left = "0";
    state.container.style.top = "0";
    state.container.style.width = `${state.calendar.clientWidth}px`;
    state.container.style.height = `${state.calendar.clientHeight}px`;

    state.headElement = state.container.querySelector(".study-companion__head");
    state.bodyElement = state.container.querySelector(".study-companion__body");
    state.eyeElement = state.container.querySelector(".study-companion__eye");
    state.glowElement = state.container.querySelector(".study-companion__glow");
    state.segmentElements = Array.from(state.container.querySelectorAll(".study-companion__segment")).map(element => ({
        element,
        x: 0,
        y: 0,
    }));

    state.isInitialized = true;
    state.currentTargetIndex = 0;
    state.waitUntil = 0;

    buildPath();

    if (!state.reducedMotion) {
        startStudyCompanion();
    } else {
        if (state.path.length) {
            const firstCell = state.activeCells[0];
            highlightCurrentCell(firstCell);
        }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return true;
}

export function startStudyCompanion() {
    if (!state.isInitialized || state.reducedMotion) {
        return;
    }

    if (state.animationFrameId) {
        window.cancelAnimationFrame(state.animationFrameId);
    }

    state.isRunning = true;
    state.animationFrameId = window.requestAnimationFrame(animateCompanion);
}

export function stopStudyCompanion() {
    state.isRunning = false;

    if (state.animationFrameId) {
        window.cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
}

export function refreshStudyCompanionPath() {
    if (!state.isInitialized) {
        initializeStudyCompanion();
        return;
    }

    state.calendar = getCalendarHost();
    state.grid = getGridHost();

    if (!state.calendar || !state.grid) {
        return;
    }

    buildPath();

    if (!state.reducedMotion) {
        startStudyCompanion();
    }
}

export function resetStudyCompanion() {
    stopStudyCompanion();
    state.currentTargetIndex = 0;
    state.waitUntil = 0;
    buildPath();

    if (!state.reducedMotion) {
        startStudyCompanion();
    }
}

export function destroyStudyCompanion() {
    stopStudyCompanion();
    clearHighlightedCell();

    if (state.container) {
        state.container.remove();
        state.container = null;
    }

    state.isInitialized = false;
    state.headElement = null;
    state.bodyElement = null;
    state.eyeElement = null;
    state.glowElement = null;
    state.segmentElements = [];
    state.activeCells = [];
    state.path = [];
    state.currentTargetIndex = 0;
    state.waitUntil = 0;

    window.removeEventListener("resize", handleResize);
    window.removeEventListener("orientationchange", handleResize);
}

function handleResize() {
    if (state.resizeTimerId) {
        window.clearTimeout(state.resizeTimerId);
    }

    state.resizeTimerId = window.setTimeout(() => {
        refreshStudyCompanionPath();
    }, state.config.resizeDebounce);
}
