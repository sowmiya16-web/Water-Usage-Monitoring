import { fetchApi } from "./apiConfig";

export const residentService = {
  // Fetch all residents from Spring Boot backend -> MySQL
  getAllResidents: async () => {
    return await fetchApi("/residents");
  },

  // Get single resident by ID
  getResidentById: async (id) => {
    return await fetchApi(`/residents/${id}`);
  },

  // Register new resident
  createResident: async (residentData) => {
    return await fetchApi("/residents", {
      method: "POST",
      body: JSON.stringify(residentData),
    });
  },

  // Get residents by building
  getResidentsByBuilding: async (buildingName) => {
    return await fetchApi(`/residents/building/${buildingName}`);
  },
};

export default residentService;
