import { fetchApi } from "./apiConfig";

export const tariffService = {
  // Get all tariff plans
  getAllTariffs: async () => {
    return await fetchApi("/tariffs");
  },

  // Get tariff plan for a specific building
  getTariffByBuilding: async (buildingId = 1) => {
    return await fetchApi(`/tariffs/building/${buildingId}`);
  },

  // Create or update tariff plan
  saveTariff: async (tariffData, consumption) => {
    const url = consumption ? `/tariffs?consumption=${consumption}` : "/tariffs";
    return await fetchApi(url, {
      method: "POST",
      body: JSON.stringify(tariffData),
    });
  },
};

export default tariffService;
