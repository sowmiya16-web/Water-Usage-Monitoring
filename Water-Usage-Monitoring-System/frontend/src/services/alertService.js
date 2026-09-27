// Built from the shared API base (see apiConfig.js) so this keeps working whether the
// frontend and backend are on the same origin (dev, via Vite's proxy) or on separate
// deployed hosts (prod, via VITE_API_URL) — a bare "/api/alerts" would 404 in the latter.
import { API_BASE_URL as API_ROOT } from "./apiConfig";

const API_BASE_URL = `${API_ROOT}/alerts`;

export const alertService = {
  // 1. Fetch all alerts for Admin Monitoring
  async getAllAlerts() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch system alerts");
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("[alertService] Error fetching all alerts:", error);
      return [];
    }
  },

  // 2. Fetch alerts for specific resident / user
  async getResidentAlerts(userId) {
    try {
      const url = userId ? `${API_BASE_URL}/user/${userId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch resident alerts");
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("[alertService] Error fetching resident alerts:", error);
      return [];
    }
  },

  // 3. Fetch unread alert count
  async getUnreadCount(userId, apartmentId) {
    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (apartmentId) params.append("apartmentId", apartmentId);

      const response = await fetch(`${API_BASE_URL}/unread-count?${params.toString()}`);
      if (!response.ok) return 0;
      const result = await response.json();
      return result.data?.unreadCount || 0;
    } catch (error) {
      console.error("[alertService] Error fetching unread count:", error);
      return 0;
    }
  },

  // 4. Acknowledge single alert (Mark as read)
  async acknowledgeAlert(alertId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${alertId}/acknowledge`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error acknowledging alert:", error);
      throw error;
    }
  },

  // 5. Acknowledge all resident alerts
  async acknowledgeAllAlerts(userId, apartmentId) {
    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (apartmentId) params.append("apartmentId", apartmentId);

      const response = await fetch(`${API_BASE_URL}/acknowledge-all?${params.toString()}`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to acknowledge all alerts");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error acknowledging all alerts:", error);
      throw error;
    }
  },

  // 6. Resolve or reopen alert
  async resolveAlert(alertId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${alertId}/resolve`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to update alert status");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error resolving alert:", error);
      throw error;
    }
  },

  // 7. Manually trigger alert evaluation cycle
  async triggerEvaluation() {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to trigger alert evaluation");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error triggering evaluation:", error);
      throw error;
    }
  },

  // 8. Fetch threshold config
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/config`);
      if (!response.ok) throw new Error("Failed to fetch alert config");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error fetching alert config:", error);
      return null;
    }
  },

  // 9. Update threshold config
  async updateConfig(configData) {
    try {
      const response = await fetch(`${API_BASE_URL}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
      if (!response.ok) throw new Error("Failed to update alert config");
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("[alertService] Error updating alert config:", error);
      throw error;
    }
  },
};
