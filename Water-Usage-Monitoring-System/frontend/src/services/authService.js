import { fetchApi } from "./apiConfig";

export const authService = {
  // Login via Spring Boot Backend
  login: async (credentials) => {
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.success && data.data) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", data.data.role);
      localStorage.setItem("userEmail", data.data.email);
      if (data.data.token) {
        localStorage.setItem("authToken", data.data.token);
      }
    }

    return data;
  },

  // Register new account
  register: async (userData) => {
    return await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("authToken");
  },

  // Get current user profile from backend
  getCurrentUser: async () => {
    return await fetchApi("/auth/me");
  },
};


export default authService;
