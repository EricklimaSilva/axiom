const DEFAULT_CONFIG = {
    speed: 0.18,
    pauseDuration: 110,
    resizeDebounce: 140,
    maxSegments: 24,
};

const state = {
    config: DEFAULT_CONFIG,
    isInitialized: false,
    isRunning: false,
    animationFrameId: null,
    resizeTimerId: null,
    calendar: null,
    grid: null,
    overlay: null,
    headElement: null,
    bodyElements: [],
    eyeElements: [],
    glowElement: null,
    reducedMotion: false,
    path: [],
    activeCells: [],
    segmentPositions: [],
    currentPathIndex: 0,
    lastFrameTimestamp: 0,
    headPosition: { x: 0, y: 0 },
    waitUntil: 0,
    gridRows: 7,
    gridColumns: 0,
    cellSize: 0,
    cellLookup: new Map(),
    visitedCells: new Set(),
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function getCalendarHost() {
    return document.querySelector(".consistency-calendar-content") || document.querySelector(".consistency-calendar");
}

function getGridHost() {
    return document.querySelector("#consistency-grid");
}

function getSegmentCount() {
    const activeDayCount = Math.max(0, state.activeCells.length);

    if (activeDayCount < 8) {
        return 4;
    }

    if (activeDayCount < 16) {
        return 6;
    }

    if (activeDayCount < 24) {
        return 8;
    }

    if (activeDayCount < 36) {
        return 10;
    }

    return Math.min(DEFAULT_CONFIG.maxSegments, 12 + Math.floor((activeDayCount - 36) / 12));
}

function createOverlay() {
    const wrapper = document.createElement("div");
    wrapper.className = "github-snake-layer";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "8";
    wrapper.style.opacity = "0";
    wrapper.style.transition = "opacity 180ms ease";
    wrapper.style.willChange = "transform";
    wrapper.style.overflow = "hidden";
    wrapper.style.borderRadius = "16px";
    wrapper.style.contain = "layout paint";

    const glow = document.createElement("div");
    glow.className = "github-snake-glow";
    glow.style.position = "absolute";
    glow.style.width = "34px";
    glow.style.height = "34px";
    glow.style.borderRadius = "50%";
    glow.style.background = "radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(34,211,238,0) 72%)";
    glow.style.transform = "translate3d(-10px, -10px, 0)";
    glow.style.pointerEvents = "none";
    wrapper.appendChild(glow);

    state.glowElement = glow;

    const segmentCount = getSegmentCount();

    for (let index = 0; index < segmentCount; index += 1) {
        const segment = document.createElement("div");
        segment.className = "github-snake-segment";
        segment.style.position = "absolute";
        segment.style.width = `${state.cellSize}px`;
        segment.style.height = `${state.cellSize}px`;
        segment.style.boxSizing = "border-box";
        segment.style.border = "1px solid rgba(255,255,255,0.24)";
        segment.style.borderRadius = "4px";
        segment.style.background = "linear-gradient(135deg, rgba(34,211,238,0.98) 0%, rgba(8,145,178,0.95) 50%, rgba(14,116,144,0.92) 100%)";
        segment.style.boxShadow = "0 0 12px rgba(34,211,238,0.24), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(2,6,23,0.16)";
        segment.style.transform = "translate3d(0, 0, 0)";
        segment.style.opacity = `${0.7 + (index / segmentCount) * 0.22}`;
        segment.style.willChange = "transform";
        wrapper.appendChild(segment);
    }

    state.bodyElements = Array.from(wrapper.querySelectorAll(".github-snake-segment"));

    const head = document.createElement("div");
    head.className = "github-snake-head";
    head.style.position = "absolute";
    head.style.width = `${Math.max(10, state.cellSize)}px`;
    head.style.height = `${Math.max(10, state.cellSize)}px`;
    head.style.boxSizing = "border-box";
    head.style.border = "1px solid rgba(255,255,255,0.95)";
    head.style.borderRadius = "4px";
    head.style.background = "linear-gradient(135deg, #fef3c7 0%, #67e8f9 45%, #22d3ee 100%)";
    head.style.boxShadow = "0 0 16px rgba(34,211,238,0.3), inset 0 1px 1px rgba(255,255,255,0.34), inset 0 -1px 2px rgba(2,6,23,0.18)";
    head.style.transform = "translate3d(0, 0, 0)";
    head.style.zIndex = "2";
    head.style.willChange = "transform";

    const leftEye = document.createElement("span");
    leftEye.style.position = "absolute";
    leftEye.style.left = "3px";
    leftEye.style.top = "3px";
    leftEye.style.width = "2px";
    leftEye.style.height = "2px";
    leftEye.style.background = "#0f172a";
    leftEye.style.borderRadius = "50%";
    head.appendChild(leftEye);

    const rightEye = document.createElement("span");
    rightEye.style.position = "absolute";
    rightEye.style.right = "3px";
    rightEye.style.top = "3px";
    rightEye.style.width = "2px";
    rightEye.style.height = "2px";
    rightEye.style.background = "#0f172a";
    rightEye.style.borderRadius = "50%";
    head.appendChild(rightEye);

    wrapper.appendChild(head);
    state.headElement = head;

    return wrapper;
}

function getGridCoordinates(index) {
    return {
        row: index % state.gridRows,
        col: Math.floor(index / state.gridRows),
    };
}

function getIndexFromPosition(row, col) {
    return row + col * state.gridRows;
}

function getValidCellIndices() {
    if (!state.grid) {
        return [];
    }

    const indices = [];
    const cells = Array.from(state.grid.children);

    for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index];
        const isValid = !cell.disabled && !cell.classList.contains("outside-year");

        if (isValid) {
            indices.push(index);
        }
    }

    return indices;
}

function buildShortestPath(fromIndex, toIndex) {
    const queue = [[fromIndex]];
    const visited = new Set([fromIndex]);
    const parent = new Map();

    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentIndex = currentPath[currentPath.length - 1];

        if (currentIndex === toIndex) {
            return currentPath.slice(1);
        }

        const { row, col } = getGridCoordinates(currentIndex);
        const candidates = [];

        if (row > 0) {
            candidates.push(getIndexFromPosition(row - 1, col));
        }
        if (row < state.gridRows - 1) {
            candidates.push(getIndexFromPosition(row + 1, col));
        }
        if (col > 0) {
            candidates.push(getIndexFromPosition(row, col - 1));
        }
        if (col < state.gridColumns - 1) {
            candidates.push(getIndexFromPosition(row, col + 1));
        }

        for (const candidate of candidates) {
            if (visited.has(candidate)) {
                continue;
            }

            const candidateCell = state.grid.children[candidate];
            if (!candidateCell || candidateCell.disabled || candidateCell.classList.contains("outside-year")) {
                continue;
            }

            visited.add(candidate);
            parent.set(candidate, currentIndex);
            queue.push([...currentPath, candidate]);
        }
    }

    return [];
}

function buildPath() {
    if (!state.grid) {
        state.path = [];
        state.activeCells = [];
        return;
    }

    const cells = Array.from(state.grid.children);
    const activeCells = cells.filter(cell => Number(cell.dataset.level || 0) > 0 && !cell.disabled && !cell.classList.contains("outside-year"));

    if (!activeCells.length) {
        state.path = [];
        state.activeCells = [];
        return;
    }

    const sortedCells = [...activeCells].sort((left, right) => {
        const leftDate = left.dataset.dateKey || "";
        const rightDate = right.dataset.dateKey || "";
        return leftDate.localeCompare(rightDate);
    });

    state.activeCells = sortedCells;
    state.gridColumns = Math.max(1, Math.ceil(cells.length / state.gridRows));

    const pathIndices = [];
    const firstCell = sortedCells[0];
    const firstIndex = cells.indexOf(firstCell);

    pathIndices.push(firstIndex);

    for (let index = 1; index < sortedCells.length; index += 1) {
        const currentCell = sortedCells[index - 1];
        const nextCell = sortedCells[index];
        const currentIndex = cells.indexOf(currentCell);
        const nextIndex = cells.indexOf(nextCell);
        const betweenSteps = buildShortestPath(currentIndex, nextIndex);

        pathIndices.push(...betweenSteps, nextIndex);
    }

    const path = pathIndices.map(index => {
        const cell = cells[index];
        const rect = cell.getBoundingClientRect();
        const calendarRect = state.calendar.getBoundingClientRect();

        return {
            cell,
            x: rect.left - calendarRect.left + rect.width / 2,
            y: rect.top - calendarRect.top + rect.height / 2,
            index,
        };
    });

    state.path = path;
    state.currentPathIndex = 0;
    state.headPosition = { ...state.path[0] };
}

function updateSegmentPositions() {
    if (!state.bodyElements.length || !state.path.length) {
        return;
    }

    const head = state.headPosition;
    state.segmentPositions[0] = { x: head.x, y: head.y };

    for (let index = 0; index < state.bodyElements.length; index += 1) {
        const segment = state.bodyElements[index];
        const followIndex = Math.max(0, state.currentPathIndex - index - 1);
        const target = state.path[followIndex] || state.path[0];

        if (!state.segmentPositions[index + 1]) {
            state.segmentPositions[index + 1] = { x: target.x, y: target.y };
        }

        const followAmount = 0.12 + index * 0.028;
        state.segmentPositions[index + 1] = {
            x: lerp(state.segmentPositions[index + 1].x, target.x, followAmount),
            y: lerp(state.segmentPositions[index + 1].y, target.y, followAmount),
        };

        segment.style.transform = `translate3d(${state.segmentPositions[index + 1].x}px, ${state.segmentPositions[index + 1].y}px, 0)`;
        segment.style.opacity = `${0.8 - index * 0.022}`;
    }
}

function renderSnake(timestamp = performance.now()) {
    if (!state.headElement || !state.path.length) {
        return;
    }

    const pulse = 1 + Math.sin(timestamp / 500) * 0.03;
    state.headElement.style.transform = `translate3d(${state.headPosition.x}px, ${state.headPosition.y}px, 0) scale(${pulse})`;

    if (state.glowElement) {
        state.glowElement.style.transform = `translate3d(${state.headPosition.x - 10}px, ${state.headPosition.y - 10}px, 0) scale(${1 + Math.sin(timestamp / 700) * 0.08})`;
    }

    updateSegmentPositions();
}

function markCellAsEaten(cell) {
    if (!cell) {
        return;
    }

    const level = Number(cell.dataset.level || 0);
    if (!level) {
        return;
    }

    const isAlreadyEaten = cell.dataset.snakeEaten === "true";
    if (isAlreadyEaten) {
        return;
    }

    cell.dataset.snakeEaten = "true";
    cell.style.opacity = "0.35";
    cell.style.transform = "scale(0.92)";
    cell.style.transition = "opacity 180ms ease, transform 180ms ease";
}

function resetCellStates() {
    if (!state.grid) {
        return;
    }

    const cells = Array.from(state.grid.children);
    cells.forEach(cell => {
        if (cell.dataset.snakeEaten === "true") {
            delete cell.dataset.snakeEaten;
        }
        cell.style.opacity = "";
        cell.style.transform = "";
        cell.style.transition = "";
    });
}

function animateSnake(timestamp) {
    if (!state.isRunning || !state.path.length) {
        return;
    }

    if (state.reducedMotion) {
        state.isRunning = false;
        return;
    }

    if (timestamp < state.waitUntil) {
        state.animationFrameId = window.requestAnimationFrame(animateSnake);
        return;
    }

    if (!state.lastFrameTimestamp) {
        state.lastFrameTimestamp = timestamp;
    }

    const deltaSeconds = Math.min(0.032, (timestamp - state.lastFrameTimestamp) / 1000 || 0.016);
    state.lastFrameTimestamp = timestamp;

    const target = state.path[state.currentPathIndex];
    const dx = target.x - state.headPosition.x;
    const dy = target.y - state.headPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 1.4) {
        state.headPosition = { x: target.x, y: target.y };
        markCellAsEaten(target.cell);

        state.currentPathIndex += 1;

        if (state.currentPathIndex >= state.path.length) {
            state.currentPathIndex = 0;
            resetCellStates();
        }

        state.waitUntil = timestamp + state.config.pauseDuration;
    } else {
        const travelSpeed = clamp(distance / 130, 1.8, 4.8);
        const step = travelSpeed * deltaSeconds * 60;
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        state.headPosition = {
            x: state.headPosition.x + normalizedX * step,
            y: state.headPosition.y + normalizedY * step,
        };
    }

    renderSnake(timestamp);
    state.animationFrameId = window.requestAnimationFrame(animateSnake);
}

function showOverlay() {
    if (state.overlay) {
        state.overlay.style.opacity = "1";
    }
}

function hideOverlay() {
    if (state.overlay) {
        state.overlay.style.opacity = "0";
    }
}

export function buildSnakePath() {
    buildPath();
    return state.path;
}

function rebuildOverlay() {
    if (!state.calendar) {
        return;
    }

    if (state.overlay) {
        state.overlay.remove();
    }

    state.overlay = createOverlay();
    state.calendar.appendChild(state.overlay);
    state.overlay.style.left = "0";
    state.overlay.style.top = "0";
    state.overlay.style.width = `${state.calendar.clientWidth}px`;
    state.overlay.style.height = `${state.calendar.clientHeight}px`;

    state.bodyElements = Array.from(state.overlay.querySelectorAll(".github-snake-segment"));
    state.headElement = state.overlay.querySelector(".github-snake-head");
    state.glowElement = state.overlay.querySelector(".github-snake-glow");
    state.segmentPositions = [];
}

export function initializeSnake() {
    if (state.isInitialized) {
        destroySnake();
    }

    state.calendar = getCalendarHost();
    state.grid = getGridHost();
    state.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!state.calendar || !state.grid) {
        return false;
    }

    const existingLayer = state.calendar.querySelector(".github-snake-layer");
    if (existingLayer) {
        existingLayer.remove();
    }

    state.cellSize = parseFloat(getComputedStyle(state.grid).getPropertyValue("--consistency-cell-size") || "16") || 16;
    buildPath();

    rebuildOverlay();

    state.isInitialized = true;
    state.currentPathIndex = 0;
    state.waitUntil = 0;

    buildPath();

    if (!state.path.length) {
        hideOverlay();
        return false;
    }

    showOverlay();
    state.headPosition = { ...state.path[0] };
    renderSnake();

    if (!state.reducedMotion) {
        startSnake();
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return true;
}

export function startSnake() {
    if (!state.isInitialized || state.reducedMotion || !state.path.length) {
        return;
    }

    if (state.animationFrameId) {
        window.cancelAnimationFrame(state.animationFrameId);
    }

    state.isRunning = true;
    state.animationFrameId = window.requestAnimationFrame(animateSnake);
}

export function stopSnake() {
    state.isRunning = false;

    if (state.animationFrameId) {
        window.cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
}

export function updateSnake() {
    if (!state.isInitialized) {
        return;
    }

    state.calendar = getCalendarHost();
    state.grid = getGridHost();

    if (!state.calendar || !state.grid) {
        return;
    }

    buildPath();

    if (!state.path.length) {
        hideOverlay();
        return;
    }

    if (!state.overlay || state.bodyElements.length !== getSegmentCount()) {
        rebuildOverlay();
    }

    state.overlay.style.width = `${state.calendar.clientWidth}px`;
    state.overlay.style.height = `${state.calendar.clientHeight}px`;
    showOverlay();
    state.headPosition = { ...state.path[0] };
    renderSnake();

    if (!state.reducedMotion) {
        startSnake();
    }
}

export function destroySnake() {
    stopSnake();
    resetCellStates();

    if (state.overlay) {
        state.overlay.remove();
        state.overlay = null;
    }

    state.isInitialized = false;
    state.headElement = null;
    state.glowElement = null;
    state.bodyElements = [];
    state.path = [];
    state.activeCells = [];
    state.segmentPositions = [];
    state.currentPathIndex = 0;
    state.waitUntil = 0;

    window.removeEventListener("resize", handleResize);
    window.removeEventListener("orientationchange", handleResize);
}

function handleResize() {
    if (state.resizeTimerId) {
        window.clearTimeout(state.resizeTimerId);
    }

    state.resizeTimerId = window.setTimeout(() => {
        updateSnake();
    }, state.config.resizeDebounce);
}
