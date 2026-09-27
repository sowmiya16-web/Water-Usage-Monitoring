import { fetchApi, API_BASE_URL } from "./apiConfig";

const json = (body) => ({ method: "POST", body: JSON.stringify(body) });

export const communityAdminService = {
  getDashboard: () => fetchApi("/community-admin/dashboard"),
  getHouseholdUsage: (month) => fetchApi(`/community-admin/households/usage${month ? `?month=${month}` : ""}`),

  // ---- Household management ----
  getHouseholds: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    return fetchApi(`/community-admin/households?${qs.toString()}`);
  },
  getHousehold: (id, months = 12) => fetchApi(`/community-admin/households/${id}?months=${months}`),
  createHousehold: (body) => fetchApi("/community-admin/households", json(body)),
  updateHousehold: (id, body) => fetchApi(`/community-admin/households/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteHousehold: (id) => fetchApi(`/community-admin/households/${id}`, { method: "DELETE" }),
  addResident: (id, body) => fetchApi(`/community-admin/households/${id}/residents`, json(body)),
  updateResident: (id, residentId, body) =>
    fetchApi(`/community-admin/households/${id}/residents/${residentId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteResident: (id, residentId) => fetchApi(`/community-admin/households/${id}/residents/${residentId}`, { method: "DELETE" }),

  getMeters: () => fetchApi("/community-admin/meters"),
  getReadings: (meterId, limit = 25) =>
    fetchApi(`/community-admin/readings?limit=${limit}${meterId ? `&meterId=${meterId}` : ""}`),
  addReading: (meterId, body) => fetchApi(`/community-admin/meters/${meterId}/readings`, json(body)),

  // Multipart upload: the browser must set the Content-Type boundary itself, so fetchApi (JSON) is not used.
  uploadReadingsCsv: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/community-admin/readings/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed (HTTP ${res.status})`);
    return data;
  },

  getCycles: () => fetchApi("/community-admin/cycles"),
  createCycle: (body) => fetchApi("/community-admin/cycles", json(body)),
  closeCycle: (id) => fetchApi(`/community-admin/cycles/${id}/close`, { method: "POST" }),

  getTariffs: () => fetchApi("/community-admin/tariffs"),
  createTariff: (body) => fetchApi("/community-admin/tariffs", json(body)),

  getPurchases: () => fetchApi("/community-admin/bulk-purchases"),
  recordPurchase: (body) => fetchApi("/community-admin/bulk-purchases", json(body)),
};

export default communityAdminService;
