import { fetchApi, API_BASE_URL } from "./apiConfig";

export const meterService = {
  // Get all water meters
  getAllMeters: async () => {
    return await fetchApi("/meters");
  },

  // Get a single water meter by ID
  getMeterById: async (meterId) => {
    return await fetchApi(`/meters/${meterId}`);
  },

  // Get water meter by apartment ID
  getMeterByApartment: async (apartmentId) => {
    return await fetchApi(`/meters/apartment/${apartmentId}`);
  },

  // Create / Add a new water meter
  createMeter: async (meterData) => {
    return await fetchApi("/meters", {
      method: "POST",
      body: JSON.stringify(meterData),
    });
  },

  // Get usage / reading history for a meter
  getUsageHistory: async (meterId) => {
    return await fetchApi(`/meters/${meterId}/usage`);
  },

  // Record a new water meter reading
  recordUsage: async (meterId, usageData) => {
    return await fetchApi(`/meters/${meterId}/usage`, {
      method: "POST",
      body: JSON.stringify(usageData),
    });
  },

  // Upload bulk meter readings via CSV file
  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("authToken");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/meters/upload-csv`, {
      method: "POST",
      headers: headers,
      body: formData,
    });
    return await response.json();
  },
};

export default meterService;