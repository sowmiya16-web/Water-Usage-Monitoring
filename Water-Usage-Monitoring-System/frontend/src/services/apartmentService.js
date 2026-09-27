import { fetchApi } from "./apiConfig";

export const apartmentService = {
  // Test backend status
  getBackendStatus: async () => {
    return await fetchApi("/test");
  },

  // Fetch all apartments from Spring Boot -> MySQL
  getAllApartments: async () => {
    return await fetchApi("/apartments");
  },

  // Get single apartment by ID
  getApartmentById: async (id) => {
    return await fetchApi(`/apartments/${id}`);
  },

  // Create new apartment in Spring Boot -> MySQL
  createApartment: async (apartmentData) => {
    return await fetchApi("/apartments", {
      method: "POST",
      body: JSON.stringify(apartmentData),
    });
  },

  // Get apartments by building
  getApartmentsByBuilding: async (buildingName) => {
    return await fetchApi(`/apartments/building/${buildingName}`);
  },
};

export default apartmentService;
