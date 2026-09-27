import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import billService from "../../../services/billService";
import invoiceService from "../../../services/invoiceService";
import { exportTableAsPdf } from "../../../utils/pdfExport";
import "./BillingHistory.css";

function BillingHistory() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State inside Billing History
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("GPay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState("");

  const fetchBillingHistory = async () => {
    setLoading(true);
    try {
      // Fetch only THIS resident's bills (tenant-scoped)
      const res = await billService.getMyBills();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mappedBills = res.data.map((b) => ({
          id: b.billNumber || `INV-${b.billId}`,
          billId: b.billId,
          month: b.billingMonth || "Current Billing Cycle",
          amount: Number(b.totalAmount || 0),
          waterUsage: Number(b.consumptionKl || 0),
          prevReading: `${((b.consumptionKl || 0) * 50).toFixed(2)} KL`,
          currReading: `${((b.consumptionKl || 0) * 51).toFixed(2)} KL`,
          due: b.dueDate ? String(b.dueDate) : "15 Days",
          generated: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          status: b.status === "PAID" ? "Paid" : b.status === "SUPERSEDED" ? "Superseded" : "Pending",
          meter: profile.meterId || "WM-A101-2026",
          paymentDate: b.status === "PAID" ? "Settled" : "-",
          itemized: [
            { item: `Volumetric Water Consumption (${b.consumptionKl || 0} KL)`, cost: Number(b.volumetricAmount || 0) },
            { item: "Common Water & Shared Utility Charges", cost: Number(b.commonWaterCharge || 0) },
            { item: "Base Infrastructure & Fixed Meter Fee", cost: Number(b.baseCharge || 0) },
            { item: "GST Taxes (18%)", cost: Number(b.gstAmount || 0) },
          ],
        }));
        setBills(mappedBills);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error("Failed to load billing history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);


  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        bill.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || bill.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [bills, searchTerm, statusFilter]);

  const totalBilled = useMemo(() => bills.reduce((acc, b) => acc + b.amount, 0), [bills]);
  const totalPaid = useMemo(
    () => bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + b.amount, 0),
    [bills]
  );
  const totalPending = useMemo(
    () => bills.filter((b) => b.status === "Pending").reduce((acc, b) => acc + b.amount, 0),
    [bills]
  );
  const avgBill = bills.length > 0 ? totalBilled / bills.length : 0;

  const handleExportPDF = () => {
    exportTableAsPdf({
      title: "Billing History Report",
      subtitle: `${profile.name} — ${profile.apartment}`,
      headers: ["Invoice ID", "Billing Period", "Amount (INR)", "Usage (KL)", "Generated", "Due Date", "Status"],
      rows: filteredBills.map((b) => [b.id, b.month, `Rs. ${b.amount.toFixed(2)}`, b.waterUsage, b.generated, b.due, b.status]),
      filename: `BillingHistory_${profile.name.replace(/\s+/g, "_")}.pdf`,
    });
  };

  // Every billing document is a real PDF — for a paid bill, the actual
  // saved invoice the backend generated and emailed; for an unpaid one
  // (no saved invoice yet), a generated preview.
  const handleDownloadInvoice = async (bill) => {
    if (bill.status === "Paid" && bill.billId) {
      try {
        const invRes = await invoiceService.getInvoiceByBill(bill.billId);
        if (invRes && invRes.success && invRes.data?.invoiceId) {
          await invoiceService.openInvoice(invRes.data.invoiceId, `Invoice_${bill.id}.pdf`);
          return;
        }
      } catch (err) {
        console.warn("No saved invoice found, falling back to a generated preview:", err);
      }
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text("Aqua Plus — Water Billing Invoice", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(bill.status, 14, 25);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const lines = [
      `Invoice ID: ${bill.id}`,
      `Billing Period: ${bill.month}`,
      `Bill Date: ${bill.generated}`,
      `Due Date: ${bill.due}`,
      "",
      `Resident: ${profile.name}`,
      `Apartment: ${profile.apartment}`,
      `Email: ${profile.email}`,
      `Meter ID: ${bill.meter}`,
      "",
      `Consumption: ${bill.waterUsage} KL`,
      "",
      "Itemized Charges:",
      ...bill.itemized.map((item) => `  ${item.item}: Rs. ${item.cost.toFixed(2)}`),
      "",
      `TOTAL AMOUNT: Rs. ${bill.amount.toFixed(2)}`,
      `Status: ${bill.status}`,
    ];
    let y = 38;
    lines.forEach((line) => {
      doc.text(line, 14, y);
      y += 7;
    });

    doc.save(`Invoice_${bill.id}.pdf`);
  };

  // EXECUTE PAYMENT VIA BACKEND API FROM BILLING HISTORY
  const handleExecutePayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    setIsProcessing(true);
    try {
      const refId = `TXN-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
      const payload = {
        transactionRef: refId,
        billId: selectedBill.billId,
        amount: selectedBill.amount,
        paymentMethod: selectedPaymentMethod,
        status: "SUCCESSFUL",
      };

      const res = await billService.payBill(selectedBill.billId, payload);
      if (res && res.success) {
        const savedPayment = res.data;

        let invoiceInfo = null;
        try {
          const invRes = await invoiceService.getInvoiceByBill(selectedBill.billId);
          if (invRes && invRes.success) invoiceInfo = invRes.data;
        } catch (invErr) {
          console.warn("Could not fetch saved invoice record:", invErr);
        }

        const receiptData = {
          receiptId: `RCP-${savedPayment?.paymentId || Date.now()}`,
          billId: selectedBill.id,
          user: profile.name,
          apartment: profile.apartment,
          billingPeriod: selectedBill.month,
          amount: selectedBill.amount,
          paymentMethod: selectedPaymentMethod,
          transactionRef: savedPayment?.transactionRef || refId,
          dateTime: savedPayment?.paidAt ? new Date(savedPayment.paidAt).toLocaleString() : new Date().toLocaleString(),
          status: "SUCCESSFUL / PAID",
          invoiceId: invoiceInfo?.invoiceId || null,
          emailedTo: invoiceInfo?.sentToEmail || null,
          emailSent: invoiceInfo?.emailSent || false,
        };

        setPaymentReceipt(receiptData);
        setPaymentNotice(`✓ Payment of ₹${selectedBill.amount.toFixed(2)} settled in database! Invoice status updated to Paid.`);
        
        // Update bill status in local state to Paid
        setBills((prev) =>
          prev.map((b) => (b.billId === selectedBill.billId ? { ...b, status: "Paid" } : b))
        );
        setSelectedBill((prev) => (prev ? { ...prev, status: "Paid" } : null));
        setShowPaymentModal(false);
        setShowReceiptModal(true);
      }
    } catch (err) {
      console.error("Failed to execute payment:", err);
      alert("Payment processing error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigation = (page) => {
    const routes = {
      Overview: "/resident/dashboard",
      "Water Consumption": "/resident/water-consumption",
      "Usage History": "/resident/usage-history",
      "Meter Details": "/resident/meter-details",
      "Current Bill": "/resident/current-bill",
      "Billing History": "/resident/billing-history",
      "Payment History": "/resident/payment-history",
      Notifications: "/resident/notifications",
      Alerts: "/resident/alerts",
      "My Profile": "/resident/profile",
      "Account Settings": "/resident/settings",
      "Help & Support": "/resident/help",
    };

    if (routes[page]) navigate(routes[page]);
  };

  return (
    <div className="billing-page">
      <Sidebar
        activePage="Billing History"
        onNavigate={handleNavigation}
        onLogout={() => navigate("/login")}
      />

      <main className="billing-main">
        <Header activePage="Billing History" />

        <div className="billing-content">
          {/* HEADING */}
          <div className="billing-heading">
            <div>
              <span className="billing-subhead">BILLING & PAYMENTS</span>
              <h2>Billing History</h2>
              <p>Historical database water invoices for {profile.name} ({profile.apartment}).</p>
            </div>

            <div className="heading-actions">
              <button type="button" className="btn-secondary" onClick={handleExportPDF}>
                📄 Export PDF Report
              </button>
            </div>
          </div>

          {paymentNotice && (
            <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "14px 20px", borderRadius: "12px", fontWeight: "600", marginBottom: "20px" }}>
              {paymentNotice}
            </div>
          )}

          {/* KPI CARDS */}
          <section className="billing-kpi-grid">
            <div className="billing-kpi-card">
              <div className="kpi-icon-box total-billed">₹</div>
              <div>
                <span>TOTAL BILLED</span>
                <strong>₹{totalBilled.toFixed(2)}</strong>
                <small>{bills.length} Invoices Issued</small>
              </div>
            </div>

            <div className="billing-kpi-card">
              <div className="kpi-icon-box total-paid">✓</div>
              <div>
                <span>TOTAL PAID</span>
                <strong>₹{totalPaid.toFixed(2)}</strong>
                <small>{bills.filter((b) => b.status === "Paid").length} Settled</small>
              </div>
            </div>

            <div className="billing-kpi-card">
              <div className="kpi-icon-box outstanding">!</div>
              <div>
                <span>OUTSTANDING DUE</span>
                <strong className="text-danger">₹{totalPending.toFixed(2)}</strong>
                <small>{bills.filter((b) => b.status === "Pending").length} Pending</small>
              </div>
            </div>

            <div className="billing-kpi-card">
              <div className="kpi-icon-box average">◷</div>
              <div>
                <span>MONTHLY AVERAGE</span>
                <strong>₹{avgBill.toFixed(2)}</strong>
                <small>Active billing cycle</small>
              </div>
            </div>
          </section>

          {/* HISTORICAL TREND GRAPH */}
          {bills.length > 0 && (
            <section className="billing-chart-card">
              <div className="card-header-flex">
                <div>
                  <h3>Billing Trend Breakdown</h3>
                  <p>Real billing amounts retrieved from database (INR)</p>
                </div>
                <button
                  type="button"
                  className="btn-toggle-graph"
                  onClick={() => setShowTrendChart(!showTrendChart)}
                >
                  {showTrendChart ? "Hide Trend Chart ↑" : "Show Trend Chart ↓"}
                </button>
              </div>

              {showTrendChart && (
                <div className="trend-bars-container">
                  {bills.slice().reverse().map((b) => (
                    <div key={b.id} className="trend-bar-col">
                      <span className="bar-amt">₹{b.amount.toFixed(0)}</span>
                      <div className="trend-bar-bg">
                        <div
                          className={`trend-bar-fill ${b.status !== "Paid" ? "pending-bar" : ""}`}
                          style={{ height: `${Math.min((b.amount / 1200.0) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="bar-month">{b.month.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SEARCH & FILTERS */}
          <section className="billing-filters">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search by invoice number or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
                <option value="All">All Periods</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </section>

          {/* BILLING TABLE */}
          <section className="billing-table-card">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Billing Period</th>
                  <th>Consumption</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">Loading bills from database...</td>
                  </tr>
                ) : filteredBills.length > 0 ? (
                  filteredBills.map((b) => (
                    <tr key={b.id}>
                      <td className="inv-id">{b.id}</td>
                      <td className="inv-month">{b.month}</td>
                      <td className="inv-usage"><strong>{b.waterUsage} KL</strong></td>
                      <td className="inv-amount"><strong>₹{b.amount.toFixed(2)}</strong></td>
                      <td className="inv-due">{b.due}</td>
                      <td>
                        <span className={`status-badge-table ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action"
                            onClick={() => setSelectedBill(b)}
                          >
                            View Details
                          </button>
                          {b.status === "Pending" && (
                            <button
                              type="button"
                              className="btn-tbl-action"
                              style={{ background: "#079b9b", color: "#ffffff", border: "none" }}
                              onClick={() => {
                                setSelectedBill(b);
                                setShowPaymentModal(true);
                              }}
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-tbl-icon"
                            title="Download Invoice"
                            onClick={() => handleDownloadInvoice(b)}
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      No matching billing records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* INVOICE DETAILS MODAL */}
          {selectedBill && !showPaymentModal && (
            <div className="modal-backdrop" onClick={() => setSelectedBill(null)}>
              <div className="modal-box bill-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span className="modal-sub">WATERFLOW OFFICIAL INVOICE</span>
                    <h3>{selectedBill.month} Statement</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setSelectedBill(null)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="bill-to-card">
                    <div>
                      <span>BILL TO</span>
                      <strong>{profile.name}</strong>
                      <p>{profile.apartment} • {profile.email}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>INVOICE NUMBER</span>
                      <strong>{selectedBill.id}</strong>
                      <p>Date: {selectedBill.generated}</p>
                    </div>
                  </div>

                  <div className="modal-readings-row">
                    <div>
                      <span>Consumption</span>
                      <strong>{selectedBill.waterUsage} KL</strong>
                    </div>
                    <div>
                      <span>Meter</span>
                      <strong>{selectedBill.meter}</strong>
                    </div>
                    <div>
                      <span>Due Date</span>
                      <strong>{selectedBill.due}</strong>
                    </div>
                    <div>
                      <span>Payment Status</span>
                      <span className={`status-badge-table ${selectedBill.status.toLowerCase()}`}>
                        {selectedBill.status}
                      </span>
                    </div>
                  </div>

                  <div className="modal-itemized-box">
                    <h4>Itemized Charges Breakdown</h4>
                    {selectedBill.itemized.map((item, idx) => (
                      <div key={idx} className="itemized-row">
                        <span>{item.item}</span>
                        <strong>₹{item.cost.toFixed(2)}</strong>
                      </div>
                    ))}
                    <div className="itemized-total-row">
                      <strong>Total Bill Amount</strong>
                      <strong className="total-amt-val">₹{selectedBill.amount.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleDownloadInvoice(selectedBill)}
                    >
                      ↓ Download Invoice (PDF)
                    </button>
                    {selectedBill.status === "Pending" ? (
                      <button
                        type="button"
                        className="btn-primary-pay"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        💳 Pay Bill (₹{selectedBill.amount.toFixed(2)}) →
                      </button>
                    ) : selectedBill.status === "Paid" ? (
                      <button type="button" className="btn-secondary" disabled style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                        ✓ Paid in Full
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary" disabled style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}>
                        Superseded by a recalculated bill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT SELECTION MODAL INSIDE BILLING HISTORY */}
          {showPaymentModal && selectedBill && (
            <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", background: "#ffffff", borderRadius: "14px", padding: "24px" }}>
                <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", color: "#079b9b", textTransform: "uppercase" }}>DATABASE PAYMENT GATEWAY</span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", color: "#0f172a" }}>Pay Invoice #{selectedBill.id}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setShowPaymentModal(false)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
                </div>

                <div className="modal-body" style={{ paddingTop: "16px" }}>
                  <div className="modal-summary" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Billing Month: {selectedBill.month}</span>
                    <strong style={{ fontSize: "24px", color: "#0f172a", display: "block", margin: "4px 0" }}>₹{selectedBill.amount.toFixed(2)}</strong>
                    <small style={{ color: "#64748b" }}>Resident: {profile.name} ({profile.apartment})</small>
                  </div>

                  <form onSubmit={handleExecutePayment}>
                    <label style={{ fontWeight: "600", fontSize: "13px", display: "block", marginBottom: "10px" }}>Select Payment Method:</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "18px" }}>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "GPay" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("GPay")}
                        style={{ padding: "10px", borderRadius: "8px", border: selectedPaymentMethod === "GPay" ? "2px solid #ea4335" : "1px solid #cbd5e1", background: selectedPaymentMethod === "GPay" ? "#fef2f2" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        📱 GPay
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Paytm" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Paytm")}
                        style={{ padding: "10px", borderRadius: "8px", border: selectedPaymentMethod === "Paytm" ? "2px solid #00baf2" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Paytm" ? "#e0f2fe" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        📲 Paytm
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Razorpay" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Razorpay")}
                        style={{ padding: "10px", borderRadius: "8px", border: selectedPaymentMethod === "Razorpay" ? "2px solid #3395ff" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Razorpay" ? "#eff6ff" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        ⚡ Razorpay
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Card" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Card")}
                        style={{ padding: "10px", borderRadius: "8px", border: selectedPaymentMethod === "Card" ? "2px solid #079b9b" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Card" ? "#ccfbf1" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        💳 Card
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                      <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={isProcessing} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#079b9b", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
                        {isProcessing ? "Executing DB Payment..." : `Confirm Payment of ₹${selectedBill.amount.toFixed(2)}`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* OFFICIAL RECEIPT MODAL */}
          {showReceiptModal && paymentReceipt && (
            <div className="modal-backdrop" onClick={() => setShowReceiptModal(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", background: "#ffffff", borderRadius: "14px", padding: "24px" }}>
                <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", color: "#079b9b", textTransform: "uppercase" }}>DATABASE PAYMENT RECEIPT</span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", color: "#0f172a" }}>Receipt #{paymentReceipt.receiptId}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setShowReceiptModal(false)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
                </div>

                <div className="modal-body" style={{ paddingTop: "16px" }}>
                  <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "12px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold" }}>✓</span>
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>Payment Successfully Recorded in Database</strong>
                      <small style={{ fontSize: "11px" }}>Timestamp: {paymentReceipt.dateTime}</small>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>PAYER</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.user}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>INVOICE</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.billId}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>METHOD</span>
                      <strong style={{ color: "#079b9b" }}>{paymentReceipt.paymentMethod}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>TXN REF</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.transactionRef}</strong>
                    </div>
                  </div>

                  <div style={{ background: "#0f172a", color: "#ffffff", padding: "14px", borderRadius: "10px", textAlign: "center", marginBottom: "18px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>AMOUNT PAID</span>
                    <strong style={{ fontSize: "24px", color: "#38bdf8", display: "block", margin: "2px 0" }}>₹{paymentReceipt.amount.toFixed(2)}</strong>
                    <small style={{ color: "#34d399", fontWeight: "600" }}>Status: Settled (DB Confirmed)</small>
                  </div>

                  {paymentReceipt.emailSent && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: "600" }}>
                      ✉️ Invoice PDF emailed to {paymentReceipt.emailedTo}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <button
                      type="button"
                      onClick={() => invoiceService.openInvoice(paymentReceipt.invoiceId, `Receipt_${paymentReceipt.receiptId}.pdf`)}
                      disabled={!paymentReceipt.invoiceId}
                      style={{ flex: "1", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: "600", cursor: paymentReceipt.invoiceId ? "pointer" : "not-allowed" }}
                    >
                      ↓ Download Invoice (PDF)
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(false)}
                      style={{ flex: "1", padding: "10px", borderRadius: "6px", border: "none", background: "#079b9b", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}
                    >
                      Close Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReceiptModal(false);
                        navigate("/resident/payment-history");
                      }}
                      style={{ flex: "1", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: "600", cursor: "pointer" }}
                    >
                      Go to Payment History →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default BillingHistory;