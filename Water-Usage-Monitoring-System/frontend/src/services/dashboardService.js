import { fetchApi } from "./apiConfig";

export const dashboardService = {
  // Everything the Resident Dashboard shows, aggregated server-side for the
  // signed-in resident (trends, billing cycle, invoices, alerts, tips).
  getResidentDashboard: async () => {
    return await fetchApi("/resident/dashboard");
  },

  // Household vs neighbours/community comparison, daily + monthly, with insights and recommendations.
  getConsumptionComparison: async () => {
    return await fetchApi("/resident/consumption-comparison");
  },
};

export default dashboardService;
