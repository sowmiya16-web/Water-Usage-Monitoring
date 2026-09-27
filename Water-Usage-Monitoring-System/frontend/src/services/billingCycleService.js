import { fetchApi } from "./apiConfig";

export const billingCycleService = {
  // Get all billing cycles
  getAllCycles: async () => {
    return await fetchApi("/billing-cycles");
  },

  // Get active open billing cycle
  getActiveCycle: async () => {
    return await fetchApi("/billing-cycles/active");
  },

  // Create new billing cycle
  createCycle: async (cycleData) => {
    return await fetchApi("/billing-cycles", {
      method: "POST",
      body: JSON.stringify(cycleData),
    });
  },
};

export default billingCycleService;
