import { fetchApi, API_BASE_URL } from "./apiConfig";

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const documentService = {
  getSettings: () => fetchApi("/documents/settings"),
  updateSettings: (body) => fetchApi("/documents/settings", { method: "PUT", body: JSON.stringify(body) }),

  getMyDocuments: () => fetchApi("/documents/my"),

  deleteDocument: (documentId) => fetchApi(`/documents/${documentId}`, { method: "DELETE" }),

  // Multipart: the browser must set its own Content-Type boundary, so fetchApi (JSON-only) isn't used.
  upload: async (documentType, file) => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/documents/upload`, { method: "POST", headers: authHeaders(), body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed (HTTP ${res.status})`);
    return data;
  },

  downloadUrl: (documentId) => `${API_BASE_URL}/documents/${documentId}/download`,

  openDocument: async (documentId, filename) => {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Could not fetch the document.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },

  getReviewQueue: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    return fetchApi(`/documents/review-queue?${qs.toString()}`);
  },
  review: (documentId, action, reason) =>
    fetchApi(`/documents/${documentId}/review`, { method: "POST", body: JSON.stringify({ action, reason }) }),

  getStats: () => fetchApi("/documents/stats"),
};

export default documentService;
