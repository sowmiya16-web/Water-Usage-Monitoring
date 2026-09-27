import { fetchApi } from "./apiConfig";

export const bulkPurchaseService = {
  // Get all bulk water purchases
  getAllPurchases: async () => {
    return await fetchApi("/bulk-purchases");
  },

  // Record a new bulk water purchase (tanker / municipal)
  recordPurchase: async (purchaseData) => {
    return await fetchApi("/bulk-purchases", {
      method: "POST",
      body: JSON.stringify(purchaseData),
    });
  },
};

export default bulkPurchaseService;
