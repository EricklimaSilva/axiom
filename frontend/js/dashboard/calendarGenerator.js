const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const MONTH_NAMES = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez"
];


export function getCalendarYear() {

    return new Date().getFullYear();

}


export function getYearStartDate(year) {

    return new Date(year, 0, 1);

}


export function getYearEndDate(year) {

    return new Date(year, 11, 31);

}


export function getTotalDaysInYear(year) {

    const startDate = getYearStartDate(year);

    const endDate = getYearEndDate(year);

    return Math.round(
        (endDate - startDate) / MILLISECONDS_PER_DAY
    ) + 1;

}


export function getCalendarStartDate(year) {

    const yearStart = getYearStartDate(year);

    const calendarStart = new Date(yearStart);

    calendarStart.setDate(
        yearStart.getDate() - yearStart.getDay()
    );

    return calendarStart;

}


export function getCalendarEndDate(year) {

    const yearEnd = getYearEndDate(year);

    const calendarEnd = new Date(yearEnd);

    calendarEnd.setDate(
        yearEnd.getDate() + (6 - yearEnd.getDay())
    );

    return calendarEnd;

}


export function generateCalendarDates(year) {

    const startDate = getCalendarStartDate(year);

    const endDate = getCalendarEndDate(year);

    const dates = [];

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {

        dates.push(new Date(currentDate));

        currentDate.setDate(
            currentDate.getDate() + 1
        );

    }

    return dates;

}


export function getTotalWeeksInCalendar(year) {

    const dates = generateCalendarDates(year);

    return dates.length / 7;

}


export function getMonthPositions(year) {

    const calendarStart = getCalendarStartDate(year);

    return MONTH_NAMES.map(
        (name, monthIndex) => {

            const monthStart =
                new Date(year, monthIndex, 1);

            const differenceInDays =
                Math.round(
                    (
                        monthStart - calendarStart
                    ) / MILLISECONDS_PER_DAY
                );

            const column =
                Math.floor(
                    differenceInDays / 7
                ) + 1;

            return {
                name,
                monthIndex,
                column
            };

        }
    );

}


export function createMonthLabels(year) {

    return getMonthPositions(year)
        .map(
            month => `
                <span
                    class="consistency-month-label"
                    style="grid-column:${month.column}"
                >
                    ${month.name}
                </span>
            `
        )
        .join("");

}


export function createCalendarStructure(year) {

    const dates =
        generateCalendarDates(year);

    const totalWeeks =
        dates.length / 7;

    return {
        year,
        totalDays: getTotalDaysInYear(year),
        totalWeeks,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        dates,
        monthPositions: getMonthPositions(year),
        monthLabels: createMonthLabels(year)
    };

}