import {
    getAvailableStudyYears
} from "./consistencyData.js";

import {
    initializeSnake,
    updateSnake,
    destroySnake
} from "./githubSnake.js";

import { apiRequest } from "../api.js";

import {
    getCalendarYear,
    createCalendarStructure
} from "./calendarGenerator.js";


const WEEKDAYS = [
    "Dom",
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb"
];


function formatDateKey(date) {

    const year = date.getUTCFullYear();

    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getUTCDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function createConsistencyIcon() {

    return `
        <span
            class="consistency-title-icon"
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 3v18h18"></path>
                <path d="m7 16 4-5 4 3 5-7"></path>
            </svg>
        </span>
    `;

}


function createYearOptions(
    availableYears,
    selectedYear
) {

    return availableYears
        .map(
            year => `
                <option
                    value="${year}"
                    ${year === selectedYear ? "selected" : ""}
                >
                    ${year}
                </option>
            `
        )
        .join("");

}


function createWeekdayLabels() {

    return WEEKDAYS
        .map(
            weekday => `
                <span>${weekday}</span>
            `
        )
        .join("");

}


export function createConsistencyCells(
    studyDays,
    calendar,
    selectedYear
) {

    return calendar.dates
        .map(
            currentDate => {

                const formattedDate =
                    currentDate.toLocaleDateString(
                        "pt-BR",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC"
                        }
                    );

                const dateKey =
                    formatDateKey(currentDate);

                const level =
                    studyDays[dateKey] || 0;

                const isSelectedYear =
                    currentDate.getUTCFullYear() === selectedYear;

                const status =
                    level > 0
                        ? "Estudo registrado"
                        : "Nenhum estudo registrado";

                const levelClass =
                    level > 0
                        ? `level-${level}`
                        : "";

                const outsideYearClass =
                    isSelectedYear
                        ? ""
                        : "outside-year";

                return `
                    <button
                        type="button"
                        class="
                            consistency-cell
                            ${levelClass}
                            ${outsideYearClass}
                        "
                        data-level="${level}"
                        data-status="${status}"
                        data-date="${formattedDate}"
                        data-date-key="${dateKey}"
                        aria-label="${status} em ${formattedDate}"
                        ${isSelectedYear ? "" : "disabled"}
                    ></button>
                `;

            }
        )
        .join("");

}


function createCalendarMarkup(selectedYear, dynamicStudyDays = {}) {

    const calendar =
        createCalendarStructure(selectedYear);

    const studyDays =
        dynamicStudyDays && Object.keys(dynamicStudyDays).length > 0
            ? dynamicStudyDays
            : {};

    const activeStudyDays = Object.fromEntries(
        Object.entries(studyDays).filter(([, level]) => Number(level) > 0)
    );

    const consistencyCells =
        createConsistencyCells(
            activeStudyDays,
            calendar,
            selectedYear
        );

    return `
        <div
            class="consistency-calendar-content"
            style="--consistency-weeks:${calendar.totalWeeks}"
        >

            <div class="consistency-months">

                ${calendar.monthLabels}

            </div>

            <div class="consistency-content">

                <div class="consistency-weekdays">

                    ${createWeekdayLabels()}

                </div>

                <div
                    class="consistency-grid"
                    id="consistency-grid"
                >

                    ${consistencyCells}

                </div>

            </div>

        </div>

        <div class="consistency-legend">

            <span>Menos</span>

            <span class="consistency-cell"></span>
            <span class="consistency-cell level-1"></span>
            <span class="consistency-cell level-2"></span>
            <span class="consistency-cell level-3"></span>
            <span class="consistency-cell level-4"></span>

            <span>Mais</span>

        </div>
    `;

}


function getConsistencyMetrics(studyDays = {}, selectedYear = getCalendarYear()) {
    const selectedYearNumber = Number(selectedYear || getCalendarYear());
    const entries = Object.entries(studyDays)
        .filter(([dateKey]) => String(dateKey).startsWith(`${selectedYearNumber}-`))
        .map(([dateKey, level]) => ({
            dateKey,
            level: Number(level) || 0,
        }))
        .filter(entry => entry.level > 0)
        .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

    const totalDaysInYear = Math.round((new Date(selectedYearNumber + 1, 0, 1) - new Date(selectedYearNumber, 0, 1)) / 86400000);
    const activeDays = entries.length;
    const progress = totalDaysInYear > 0 ? Math.round((activeDays / totalDaysInYear) * 100) : 0;

    const activeDateSet = new Set(entries.map(entry => entry.dateKey));
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    if (entries.length > 0) {
        const latestEntry = entries[entries.length - 1];
        let cursor = new Date(`${latestEntry.dateKey}T00:00:00`);

        while (activeDateSet.has(formatDateKey(cursor))) {
            currentStreak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        let previousDate = null;

        entries.forEach(entry => {
            const entryDate = new Date(`${entry.dateKey}T00:00:00`);

            if (!previousDate) {
                streak = 1;
            } else {
                const expectedDate = new Date(previousDate);
                expectedDate.setDate(expectedDate.getDate() + 1);
                streak = entryDate.getTime() === expectedDate.getTime() ? streak + 1 : 1;
            }

            longestStreak = Math.max(longestStreak, streak);
            previousDate = entryDate;
        });
    }

    const statusLabel = activeDays === 0
        ? "Sem registros ainda"
        : progress >= 70
            ? "Consistência forte"
            : progress >= 35
                ? "Bom ritmo"
                : "Em construção";

    return {
        activeDays,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        progress,
        statusLabel,
        totalDaysInYear,
    };
}

function createConsistencyInsights(studyDays = {}, selectedYear = getCalendarYear()) {
    const metrics = getConsistencyMetrics(studyDays, selectedYear);

    return `
        <div class="consistency-insight-card consistency-insight-card--accent">
            <span class="consistency-insight-label">Dias ativos</span>
            <strong>${metrics.activeDays}</strong>
            <small>de ${metrics.totalDaysInYear} dias</small>
        </div>

        <div class="consistency-insight-card">
            <span class="consistency-insight-label">Sequência atual</span>
            <strong>${metrics.currentStreak}</strong>
            <small>dias seguidos</small>
        </div>

        <div class="consistency-insight-card">
            <span class="consistency-insight-label">Melhor sequência</span>
            <strong>${metrics.longestStreak}</strong>
            <small>recorde do ano</small>
        </div>

        <div class="consistency-insight-card consistency-insight-card--status">
            <span class="consistency-insight-label">Status</span>
            <strong>${metrics.progress}%</strong>
            <small>${metrics.statusLabel}</small>
        </div>
    `;
}

export function createConsistencyComponent(studyDays = {}, selectedYear = getCalendarYear()) {

    const currentYear =
        getCalendarYear();

    const availableYears =
        getAvailableStudyYears();

    if (!availableYears.includes(currentYear)) {

        availableYears.push(currentYear);

        availableYears.sort(
            (yearA, yearB) => yearB - yearA
        );

    }

    const selectedYearLabel = Number(selectedYear || currentYear);

    if (!availableYears.includes(selectedYearLabel)) {
        availableYears.push(selectedYearLabel);
        availableYears.sort((yearA, yearB) => yearB - yearA);
    }

    return `
        <div
            class="consistency-component"
            data-selected-year="${selectedYearLabel}"
        >

            <div class="consistency-header">

                <div class="consistency-heading">

                    ${createConsistencyIcon()}

                    <div>
                        <h2>Consistência</h2>

                        <p>
                            Seu avanço diário em um painel elegante e claro.
                        </p>
                    </div>

                </div>

                <label
                    class="consistency-year-control"
                    for="consistency-year-filter"
                >
                    <span class="sr-only">
                        Filtrar consistência por ano
                    </span>

                    <select
                        id="consistency-year-filter"
                        class="consistency-year-filter"
                    >
                        ${createYearOptions(
                            availableYears,
                            selectedYearLabel
                        )}
                    </select>

                </label>

            </div>

            <div
                class="consistency-insights"
                id="consistency-insights"
            >
                ${createConsistencyInsights(studyDays, selectedYearLabel)}
            </div>

            <div
                class="consistency-tooltip"
                id="consistency-tooltip"
            >

                <strong id="tooltip-status">
                    Nenhum estudo registrado
                </strong>

                <span id="tooltip-level">
                    Nível de estudo: 0
                </span>

                <span id="tooltip-date">
                    Selecione um dia
                </span>

            </div>

            <div
                class="consistency-calendar"
                id="consistency-calendar"
            >

                ${createCalendarMarkup(selectedYearLabel, studyDays)}

            </div>

        </div>
    `;

}


function renderSelectedYear(selectedYear, dynamicStudyDays = {}) {

    const consistencyComponent =
        document.querySelector(
            ".consistency-component"
        );

    const calendarContainer =
        document.querySelector(
            "#consistency-calendar"
        );

    if (
        !consistencyComponent ||
        !calendarContainer
    ) {
        return;
    }

    consistencyComponent.dataset.selectedYear =
        String(selectedYear);

    calendarContainer.innerHTML =
        createCalendarMarkup(selectedYear, dynamicStudyDays);

    const insightsContainer =
        consistencyComponent.querySelector(
            "#consistency-insights"
        );

    if (insightsContainer) {
        insightsContainer.innerHTML =
            createConsistencyInsights(dynamicStudyDays, selectedYear);
    }

    requestAnimationFrame(() => {
        updateSnake();
    });

}


export async function initConsistency() {

    const yearFilter =
        document.querySelector(
            "#consistency-year-filter"
        );

    const consistencyGrid =
        document.querySelector(
            "#consistency-grid"
        );

    if (
        !yearFilter ||
        !consistencyGrid
    ) {

        console.warn(
            "⚠️ Componente de consistência não encontrado."
        );

        return;

    }

    try {
        const payload = await apiRequest("/api/dashboard");
        const dashboardData = payload?.data ?? payload;
        const consistencyEntries = dashboardData.consistency ?? [];

        const dynamicStudyDays = Object.fromEntries(
            consistencyEntries.map(entry => [entry.date, entry.level])
        );

        const selectedYear = Number(document.querySelector(".consistency-component")?.dataset.selectedYear || getCalendarYear());

        renderSelectedYear(selectedYear, dynamicStudyDays);
        initializeSnake();

        yearFilter.addEventListener(
            "change",
            event => {

                const selectedYear =
                    Number(event.target.value);

                renderSelectedYear(selectedYear, dynamicStudyDays);

            }
        );

    } catch (error) {
        console.warn("Consistência indisponível, renderizando fallback.", error);

        yearFilter.addEventListener(
            "change",
            event => {

                const selectedYear =
                    Number(event.target.value);

                renderSelectedYear(selectedYear);

            }
        );
    }

    console.log(
        "✅ Consistência V3 inicializada."
    );

}