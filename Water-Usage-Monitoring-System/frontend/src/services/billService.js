import { fetchApi } from "./apiConfig";

export const billService = {
  getAllBills: async () => {
    return await fetchApi("/bills");
  },

  getMyBills: async () => {
    return await fetchApi("/bills/my-bills");
  },

  getBillById: async (billId) => {
    return await fetchApi(`/bills/${billId}`);
  },

  getBillsByApartment: async (apartmentId) => {
    return await fetchApi(`/bills/apartment/${apartmentId}`);
  },

  createBill: async (billData) => {
    return await fetchApi("/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    });
  },

  payBill: async (billId, paymentData) => {
    return await fetchApi(`/bills/${billId}/pay`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  generateMonthlyBills: async (consumption) => {
    const url = consumption ? `/bills/generate-monthly?consumption=${consumption}` : "/bills/generate-monthly";
    return await fetchApi(url, {
      method: "POST",
    });
  },

  getAllPayments: async () => {
    return await fetchApi("/bills/payments");
  },

  getMyPayments: async () => {
    return await fetchApi("/bills/payments/my-payments");
  },

  getPaymentsByApartment: async (apartmentId) => {
    return await fetchApi(`/bills/payments/apartment/${apartmentId}`);
  },
};

export default billService;
