import { fetchApi } from "./apiConfig";

export const maintenanceService = {
  getAllRequests: async () => {
    return await fetchApi("/maintenance/requests");
  },

  createRequest: async (requestData) => {
    return await fetchApi("/maintenance/requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  },

  updateRequestStatus: async (requestId, status) => {
    return await fetchApi(`/maintenance/requests/${requestId}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    });
  },

  getAllComplaints: async () => {
    return await fetchApi("/maintenance/complaints");
  },

  createComplaint: async (complaintData) => {
    return await fetchApi("/maintenance/complaints", {
      method: "POST",
      body: JSON.stringify(complaintData),
    });
  },
};

export default maintenanceService;
