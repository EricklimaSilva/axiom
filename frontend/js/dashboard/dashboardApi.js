import { getDashboardSummary } from "../services/api.js";

export async function getDashboardData() {
    try {
        return await getDashboardSummary();
    } catch (error) {
        console.warn("Dashboard API indisponível, usando dados locais.", error);

        return {
            success: false,
            error: "Erro ao carregar dashboard.",
            data: {
                xp: 0,
                streak: 0,
                projects: 0,
                certificates: 0,
                total_minutes: 0,
                total_hours: 0,
                total_studies: 0,
                study_days: 0,
                studies_last_7_days: [],
                studies_last_30_days: [],
                hours_by_technology: [],
                hours_by_category: [],
                consistency: [],
                recentStudies: [],
            },
        };
    }
}