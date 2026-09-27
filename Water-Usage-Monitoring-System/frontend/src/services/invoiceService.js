import { fetchApi, API_BASE_URL } from "./apiConfig";

export const invoiceService = {
  // Metadata only (no PDF bytes) — used to show "Download PDF" links.
  getInvoicesByApartment: async (apartmentId) => {
    return await fetchApi(`/invoices/apartment/${apartmentId}`);
  },

  getInvoiceByBill: async (billId) => {
    return await fetchApi(`/invoices/bill/${billId}`);
  },

  downloadInvoiceUrl: (invoiceId) => `${API_BASE_URL}/invoices/${invoiceId}/download`,

  // Fetches the PDF and triggers a browser download/open.
  openInvoice: async (invoiceId, filename) => {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error("Could not fetch invoice PDF");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (filename) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      a.click();
    } else {
      window.open(url, "_blank");
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },
};

export default invoiceService;
