import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useProfile } from "../../../context/ProfileContext";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import billService from "../../../services/billService";
import tariffService from "../../../services/tariffService";
import invoiceService from "../../../services/invoiceService";
import "./CurrentBill.css";

function CurrentBill() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [showVisualBreakdown, setShowVisualBreakdown] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("GPay");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBill, setCurrentBill] = useState(null);
  const [activeTariff, setActiveTariff] = useState({
    tier1LimitKl: 10,
    tier1RatePerKl: 5,
    tier2LimitKl: 20,
    tier2RatePerKl: 15,
    tier3RatePerKl: 25,
    fixedBaseCharge: 150,
    commonWaterCharge: 100,
  });
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const fetchCurrentBill = async () => {
    setLoading(true);
    try {
      // Fetch active 3-tier tariff from backend
      try {
        const tariffRes = await tariffService.getTariffByBuilding(1);
        if (tariffRes && tariffRes.data) {
          setActiveTariff(tariffRes.data);
        }
      } catch (tErr) {
        console.warn("Using default 3-tier tariff fallback:", tErr);
      }

      // Fetch only THIS resident's bills (tenant-scoped)
      const res = await billService.getMyBills();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Find latest pending/due bill
        const pendingBills = res.data.filter((b) => b.status === "PENDING" || b.status === "DUE");
        if (pendingBills.length > 0) {
          setCurrentBill(pendingBills[pendingBills.length - 1]);
        } else {
          // If all existing bills are paid, display the latest bill
          setCurrentBill(res.data[res.data.length - 1]);
        }
      } else {
        setCurrentBill(null);
      }
    } catch (err) {
      console.error("Failed to load current bill from backend:", err);
      setPaymentErrorMsg("Could not connect to backend billing server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentBill();
  }, []);


  const handleGenerateNextBill = async () => {
    setIsProcessing(true);
    setPaymentErrorMsg("");
    setPaymentSuccessMsg("");
    setShowReceiptModal(false);
    try {
      const monthNames = ["October 2026", "November 2026", "December 2026"];
      const selectedMonth = monthNames[Math.floor(Math.random() * monthNames.length)];
      
      const c = 22.4; // 22.4 KL consumption
      const t1L = activeTariff.tier1LimitKl || 10;
      const t1R = activeTariff.tier1RatePerKl || 5;
      const t2L = activeTariff.tier2LimitKl || 20;
      const t2R = activeTariff.tier2RatePerKl || 15;
      const t3R = activeTariff.tier3RatePerKl || 25;
      let vol = 0;
      if (c <= t1L) vol = c * t1R;
      else if (c <= t2L) vol = t1L * t1R + (c - t1L) * t2R;
      else vol = t1L * t1R + (t2L - t1L) * t2R + (c - t2L) * t3R;
      
      const base = activeTariff.fixedBaseCharge || 150;
      const common = activeTariff.commonWaterCharge || 100;
      const sub = vol + base + common;
      const gst = sub * 0.18;
      const total = sub + gst;

      const res = await billService.createBill({
        billNumber: `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}-A402`,
        apartmentId: 1,
        billingMonth: selectedMonth,
        consumptionKl: c,
        volumetricAmount: Math.round(vol * 100) / 100,
        baseCharge: base,
        commonWaterCharge: common,
        gstAmount: Math.round(gst * 100) / 100,
        totalAmount: Math.round(total * 100) / 100,
        dueDate: "2026-10-15",
        status: "PENDING",
      });
      if (res && res.data) {
        setCurrentBill(res.data);
        setPaymentSuccessMsg(`Generated new 3-tier bill for ${selectedMonth}! Total: ₹${Math.round(total * 100) / 100}.`);
      }
    } catch (e) {
      console.error("Failed to generate monthly bill:", e);
      setPaymentErrorMsg("Failed to generate new bill in backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Derive dynamic charges from current bill or default values
  const totalAmount = currentBill ? currentBill.totalAmount : 842.5;
  const isPaid = currentBill ? currentBill.status === "PAID" : false;

  const charges = currentBill
    ? [
        { desc: `Volumetric Water Consumption (${currentBill.consumptionKl} KL)`, amount: currentBill.volumetricAmount || 512.5, type: "usage" },
        { desc: "Common Area Shared Water Charge", amount: currentBill.commonWaterCharge || 180.0, type: "common" },
        { desc: "Base Infrastructure & Fixed Meter Fee", amount: currentBill.baseCharge || 100.0, type: "service" },
        { desc: "GST & Municipal Cess Taxes", amount: currentBill.gstAmount || 50.0, type: "tax" },
      ]
    : [
        { desc: "Volumetric Water Consumption (18.6 KL)", amount: 512.5, type: "usage" },
        { desc: "Common Area Shared Water Charge", amount: 180.0, type: "common" },
        { desc: "Base Infrastructure & Fixed Meter Fee", amount: 100.0, type: "service" },
        { desc: "GST & Municipal Cess Taxes", amount: 50.0, type: "tax" },
      ];

  const breakdownData = [
    { label: "Water Consumption", amount: charges[0]?.amount || 512.5, color: "#079b9b", pct: Math.round(((charges[0]?.amount || 512.5) / totalAmount) * 100) },
    { label: "Common Area Share", amount: charges[1]?.amount || 180.0, color: "#25a89e", pct: Math.round(((charges[1]?.amount || 180.0) / totalAmount) * 100) },
    { label: "Service & Maintenance", amount: charges[2]?.amount || 100.0, color: "#54c4bb", pct: Math.round(((charges[2]?.amount || 100.0) / totalAmount) * 100) },
    { label: "Taxes & Cess", amount: charges[3]?.amount || 50.0, color: "#81d8d2", pct: Math.round(((charges[3]?.amount || 50.0) / totalAmount) * 100) },
  ];

  const handleDownloadBill = async () => {
    // If this bill has already been paid, a real saved invoice PDF exists
    // on the backend (the same one that was emailed) — use that instead
    // of regenerating a copy.
    if (isPaid && currentBill?.billId) {
      try {
        const invRes = await invoiceService.getInvoiceByBill(currentBill.billId);
        if (invRes && invRes.success && invRes.data?.invoiceId) {
          await invoiceService.openInvoice(invRes.data.invoiceId, `Invoice_${currentBill.billNumber}.pdf`);
          return;
        }
      } catch (err) {
        console.warn("No saved invoice found for this bill, falling back to a generated preview:", err);
      }
    }

    // Otherwise (bill still unpaid, no saved invoice yet) — generate a
    // PDF preview of the current bill client-side.
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text("Aqua Plus — Water Billing Invoice", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(isPaid ? "PAID" : "PENDING (preview — pay to receive the official invoice)", 14, 25);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const lines = [
      `Invoice ID: ${currentBill?.billNumber || "-"}`,
      `Billing Period: ${currentBill?.billingMonth || "-"}`,
      `Due Date: ${currentBill?.dueDate || "-"}`,
      "",
      `Resident: ${profile.name}`,
      `Apartment: ${profile.apartment}`,
      `Email: ${profile.email}`,
      "",
      `Consumption: ${currentBill?.consumptionKl ?? "-"} KL`,
      "",
      "Itemized Charges:",
      `  Volumetric Usage: Rs. ${(charges[0]?.amount || 0).toFixed(2)}`,
      `  Common Area Share: Rs. ${(charges[1]?.amount || 0).toFixed(2)}`,
      `  Base Service Fee: Rs. ${(charges[2]?.amount || 0).toFixed(2)}`,
      `  GST & Taxes: Rs. ${(charges[3]?.amount || 0).toFixed(2)}`,
      "",
      `TOTAL AMOUNT DUE: Rs. ${totalAmount.toFixed(2)}`,
    ];
    let y = 38;
    lines.forEach((line) => {
      doc.text(line, 14, y);
      y += 7;
    });

    doc.save(`WaterBill_${currentBill?.billNumber || "INV-2026-A402"}.pdf`);
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentErrorMsg("");
    setPaymentSuccessMsg("");

    try {
      let targetBillId = currentBill ? currentBill.billId : null;

      // If no target bill exists, create one in backend
      if (!targetBillId) {
        const createRes = await billService.createBill({
          billNumber: `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}-A402`,
          apartmentId: 1,
          billingMonth: "September 2026",
          consumptionKl: 18.6,
          volumetricAmount: 512.5,
          baseCharge: 100.0,
          commonWaterCharge: 180.0,
          gstAmount: 50.0,
          totalAmount: totalAmount,
          dueDate: "2026-09-25",
          status: "PENDING",
        });
        if (createRes && createRes.data && createRes.data.billId) {
          targetBillId = createRes.data.billId;
        }
      }

      const refId = `TXN-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;

      const payload = {
        transactionRef: refId,
        billId: targetBillId || 1,
        amount: totalAmount,
        paymentMethod: selectedPaymentMethod,
        status: "SUCCESSFUL",
      };

      const response = await billService.payBill(targetBillId || 1, payload);

      if (response && response.success) {
        const savedData = response.data;

        // The backend generates + saves the PDF invoice and emails it as
        // part of the payment call above — fetch its record so "Download
        // Receipt" opens the real, saved PDF rather than a re-derived copy.
        let invoiceInfo = null;
        try {
          const invRes = await invoiceService.getInvoiceByBill(targetBillId || 1);
          if (invRes && invRes.success) invoiceInfo = invRes.data;
        } catch (invErr) {
          console.warn("Could not fetch saved invoice record:", invErr);
        }

        // Construct dynamic receipt object
        const receiptData = {
          receiptId: `RCP-${savedData?.paymentId || Date.now()}`,
          billId: currentBill?.billNumber || `INV-${targetBillId}`,
          user: profile.name,
          apartment: profile.apartment,
          billingPeriod: currentBill?.billingMonth || "Current Month",
          amount: totalAmount,
          paymentMethod: selectedPaymentMethod,
          transactionRef: savedData?.transactionRef || refId,
          dateTime: savedData?.paidAt ? new Date(savedData.paidAt).toLocaleString() : new Date().toLocaleString(),
          status: "SUCCESSFUL / PAID",
          invoiceId: invoiceInfo?.invoiceId || null,
          invoiceNumber: invoiceInfo?.invoiceNumber || null,
          emailedTo: invoiceInfo?.sentToEmail || null,
          emailSent: invoiceInfo?.emailSent || false,
        };

        setPaymentReceipt(receiptData);
        const emailNote = receiptData.emailSent
          ? ` Invoice PDF emailed to ${receiptData.emailedTo}.`
          : "";
        setPaymentSuccessMsg(`Payment of ₹${totalAmount.toFixed(2)} completed successfully via ${selectedPaymentMethod}! Saved in database.${emailNote}`);
        setShowPaymentModal(false);
        setShowReceiptModal(true);

        // Update current bill state to PAID
        setCurrentBill((prev) => prev ? { ...prev, status: "PAID" } : null);
      } else {
        setPaymentErrorMsg(response?.message || "Backend rejected payment processing. Please try again.");
      }
    } catch (err) {
      console.error("Payment execution error:", err);
      setPaymentErrorMsg(err.message || "Failed to process backend payment transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  const [receiptDownloadError, setReceiptDownloadError] = useState("");

  const handleDownloadReceipt = async () => {
    if (!paymentReceipt) return;
    setReceiptDownloadError("");

    // Always the real, saved invoice PDF the backend generated at payment
    // time (the same file that was emailed) — never a re-derived copy.
    if (paymentReceipt.invoiceId) {
      try {
        await invoiceService.openInvoice(paymentReceipt.invoiceId, `Receipt_${paymentReceipt.receiptId}.pdf`);
        return;
      } catch (err) {
        console.error("Failed to fetch saved invoice PDF:", err);
        setReceiptDownloadError("Could not download the saved invoice PDF. Please try again shortly.");
      }
    } else {
      setReceiptDownloadError("The invoice PDF is still being generated. Please try again in a moment.");
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
    <div className="bill-page">
      <Sidebar
        activePage="Current Bill"
        onNavigate={handleNavigation}
        onLogout={() => navigate("/login")}
      />

      <main className="bill-main">
        <Header activePage="Current Bill" />

        <div className="bill-content">
          {/* HEADER HEADING */}
          <div className="bill-page-heading">
            <div>
              <span className="bill-subhead">BILLING & PAYMENTS</span>
              <h2>Current Water Bill</h2>
              <p>Detailed live invoice for {profile.name} ({profile.apartment}).</p>
            </div>

            <div className="header-action-group">
              <button type="button" className="btn-secondary-action" onClick={handleDownloadBill}>
                ↓ Download Invoice
              </button>
              {isPaid && (
                <button type="button" className="btn-secondary-action" onClick={handleGenerateNextBill} disabled={isProcessing}>
                  ⚡ {isProcessing ? "Generating..." : "Generate Next Month Bill"}
                </button>
              )}
              <div className="bill-period-tag">
                <small>BILLING PERIOD</small>
                <strong>{currentBill?.billingMonth || "September 2026"}</strong>
              </div>
            </div>
          </div>

          {paymentSuccessMsg && (
            <div className="payment-alert-success" style={{ background: "#d1fae5", border: "1px solid #10b981", color: "#065f46", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", fontWeight: "600" }}>
              ✓ {paymentSuccessMsg}
            </div>
          )}

          {paymentErrorMsg && (
            <div className="payment-alert-error" style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#b91c1c", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", fontWeight: "600" }}>
              ⚠️ {paymentErrorMsg}
            </div>
          )}

          {/* SUMMARY HERO CARD */}
          <section className="bill-summary-hero">
            <div className="hero-amount-box">
              <span>TOTAL AMOUNT DUE</span>
              <strong className="amount-val">
                ₹{isPaid ? "0.00" : totalAmount.toFixed(2)}
              </strong>
              <p>{isPaid ? "Payment settled and recorded in database" : `Pay before ${currentBill?.dueDate || "10 September 2026"} to avoid late penalty`}</p>
            </div>

            <div className="hero-details-row">
              <div className="hero-stat">
                <span>INVOICE ID</span>
                <strong>{currentBill?.billNumber || "BILL-2026-SEP-A402"}</strong>
              </div>
              <div className="hero-stat">
                <span>CONSUMPTION</span>
                <strong>{currentBill?.consumptionKl || 18.6} KL</strong>
              </div>
              <div className="hero-stat">
                <span>METER SERIAL</span>
                <strong>{profile.meterId || "WM-A101-2026"}</strong>
              </div>
              <div className="hero-stat">
                <span>STATUS</span>
                <span className={`status-badge-hero ${isPaid ? "paid" : "pending"}`}>
                  {isPaid ? "✓ PAID" : "PENDING"}
                </span>
              </div>
            </div>

            {!isPaid ? (
              <button
                type="button"
                className="btn-pay-now-hero"
                onClick={() => setShowPaymentModal(true)}
              >
                💳 Pay Bill (₹{totalAmount.toFixed(2)}) →
              </button>
            ) : (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn-pay-now-hero"
                  style={{ background: "#10b981", cursor: "default" }}
                  disabled
                >
                  ✓ Paid
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowReceiptModal(true)}
                  style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                >
                  📄 View Payment Receipt
                </button>
              </div>
            )}
          </section>

          {/* MAIN 2-COLUMN GRID */}
          <section className="bill-content-grid">
            {/* LEFT COLUMN: ITEMIZED CHARGES TABLE & TARIFF TIER */}
            <div className="bill-col-main">
              {/* READING SUMMARY & TARIFF CARD */}
              <div className="bill-card">
                <div className="bill-card-header">
                  <h3>Meter Reading Summary</h3>
                  <span className="meter-tag">{profile.meterId || "WM-A101-2026"}</span>
                </div>

                <div className="readings-grid">
                  <div className="reading-box">
                    <span>Billing Month</span>
                    <strong>{currentBill?.billingMonth || "September 2026"}</strong>
                    <small>Monthly Cycle</small>
                  </div>
                  <div className="reading-box highlight">
                    <span>Total Consumed</span>
                    <strong>{currentBill?.consumptionKl || 18.6} KL</strong>
                    <small>{Math.round((currentBill?.consumptionKl || 18.6) * 1000)} Litres</small>
                  </div>
                  <div className="reading-box">
                    <span>Due Date</span>
                    <strong>{currentBill?.dueDate || "2026-09-25"}</strong>
                    <small>Official Deadline</small>
                  </div>
                </div>

                <div className="tariff-tier-bar">
                  <div className="tier-header">
                    <span>Tariff Tier Allocation Scale</span>
                    <small>Tier 1: 0-15 KL (₹25/KL) • Tier 2: &gt;15 KL (₹38.19/KL)</small>
                  </div>
                  <div className="tier-progress-bg">
                    <div className="tier-fill tier1" style={{ width: "60%" }} title="Tier 1 (15 KL)"></div>
                    <div className="tier-fill tier2" style={{ width: "15%" }} title="Tier 2 (3.6 KL)"></div>
                  </div>
                </div>
              </div>

              {/* ITEMIZED CHARGES TABLE */}
              <div className="bill-card">
                <div className="bill-card-header">
                  <h3>Itemized Charges Breakdown</h3>
                  <span className="date-tag">Invoice Date: {currentBill?.createdAt ? new Date(currentBill.createdAt).toLocaleDateString() : "Current Date"}</span>
                </div>

                <table className="charges-table">
                  <thead>
                    <tr>
                      <th>Charge Description</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((charge, idx) => (
                      <tr key={idx}>
                        <td className="charge-desc">{charge.desc}</td>
                        <td>
                          <span className={`charge-cat ${charge.type}`}>
                            {charge.type}
                          </span>
                        </td>
                        <td className="charge-amt">₹{charge.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Subtotal Charges</strong></td>
                      <td className="charge-amt"><strong>₹{totalAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr className="grand-total-row">
                      <td colSpan="2"><strong>Grand Total Amount Due</strong></td>
                      <td className="charge-amt">
                        <strong className="grand-total">
                          ₹{isPaid ? "0.00 (Paid)" : totalAmount.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: GRAPHICAL BREAKDOWN & PAYMENT INFO */}
            <div className="bill-col-side">
              {/* GRAPHICAL COST DISTRIBUTION */}
              <div className="bill-card">
                <div className="bill-card-header">
                  <h3>Visual Cost Distribution</h3>
                  <button
                    type="button"
                    className="toggle-chart-btn"
                    onClick={() => setShowVisualBreakdown(!showVisualBreakdown)}
                  >
                    {showVisualBreakdown ? "Hide Chart ↑" : "Show Chart ↓"}
                  </button>
                </div>

                {showVisualBreakdown && (
                  <div className="visual-chart-box">
                    <p className="chart-subtitle">Proportional breakdown of current water bill</p>
                    {breakdownData.map((item) => (
                      <div key={item.label} className="breakdown-bar-item">
                        <div className="breakdown-label-row">
                          <span>{item.label}</span>
                          <strong>₹{item.amount.toFixed(2)} ({item.pct}%)</strong>
                        </div>
                        <div className="breakdown-bg">
                          <div
                            className="breakdown-fill"
                            style={{ width: `${item.pct}%`, background: item.color }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PAYMENT INFORMATION */}
              <div className="bill-card">
                <h3>Payment Information</h3>
                <div className="info-list">
                  <div className="info-row">
                    <span>Registered Resident</span>
                    <strong>{profile.name}</strong>
                  </div>
                  <div className="info-row">
                    <span>Apartment Unit</span>
                    <strong>{profile.apartment}</strong>
                  </div>
                  <div className="info-row">
                    <span>Due Date</span>
                    <strong className={isPaid ? "" : "text-danger"}>{currentBill?.dueDate || "10 Sep 2026"}</strong>
                  </div>
                  <div className="info-row">
                    <span>Payment Status</span>
                    <strong className={isPaid ? "text-success" : "text-warning"}>
                      {isPaid ? "✓ Paid in Full" : "Pending Payment"}
                    </strong>
                  </div>
                </div>

                {!isPaid ? (
                  <button
                    type="button"
                    className="btn-pay-action"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    💳 Pay Bill (₹{totalAmount.toFixed(2)})
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary-action full-width"
                    onClick={() => navigate("/resident/payment-history")}
                  >
                    View Payment History & Receipts →
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SEPARATE PAYMENT SELECTION BOX / MODAL */}
          {showPaymentModal && (
            <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Pay Bill — Select Payment Method</h3>
                  <button type="button" className="btn-close-modal" onClick={() => setShowPaymentModal(false)}>×</button>
                </div>

                <div className="modal-body">
                  <div className="modal-summary" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <span>Invoice #{currentBill?.billNumber || "BILL-2026-SEP-A402"}</span>
                    <strong className="modal-amt" style={{ fontSize: "24px", color: "#0f172a", display: "block", margin: "6px 0" }}>₹{totalAmount.toFixed(2)}</strong>
                    <small style={{ color: "#64748b" }}>Resident: {profile.name} ({profile.apartment})</small>
                  </div>

                  <form onSubmit={handleCompletePayment}>
                    <label className="modal-label" style={{ fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "10px" }}>Select Payment Method:</label>
                    <div className="payment-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: "20px" }}>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Paytm" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Paytm")}
                        style={{ padding: "12px", borderRadius: "8px", border: selectedPaymentMethod === "Paytm" ? "2px solid #00baf2" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Paytm" ? "#e0f2fe" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        📲 Paytm
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "GPay" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("GPay")}
                        style={{ padding: "12px", borderRadius: "8px", border: selectedPaymentMethod === "GPay" ? "2px solid #ea4335" : "1px solid #cbd5e1", background: selectedPaymentMethod === "GPay" ? "#fef2f2" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        📱 GPay
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Razorpay" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Razorpay")}
                        style={{ padding: "12px", borderRadius: "8px", border: selectedPaymentMethod === "Razorpay" ? "2px solid #3395ff" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Razorpay" ? "#eff6ff" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        ⚡ Razorpay
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "Card" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("Card")}
                        style={{ padding: "12px", borderRadius: "8px", border: selectedPaymentMethod === "Card" ? "2px solid #079b9b" : "1px solid #cbd5e1", background: selectedPaymentMethod === "Card" ? "#ccfbf1" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        💳 Card
                      </button>
                      <button
                        type="button"
                        className={`pm-option ${selectedPaymentMethod === "NetBanking" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("NetBanking")}
                        style={{ padding: "12px", borderRadius: "8px", border: selectedPaymentMethod === "NetBanking" ? "2px solid #475569" : "1px solid #cbd5e1", background: selectedPaymentMethod === "NetBanking" ? "#f1f5f9" : "#ffffff", fontWeight: "600", cursor: "pointer" }}
                      >
                        🏦 NetBanking
                      </button>
                    </div>

                    {(selectedPaymentMethod === "GPay" || selectedPaymentMethod === "Paytm") && (
                      <div className="form-group modal-field" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "500" }}>Enter {selectedPaymentMethod} Virtual Payment Address (UPI ID)</label>
                        <input type="text" placeholder={`e.g. ${profile.name.toLowerCase()}@${selectedPaymentMethod.toLowerCase()}`} defaultValue={`${profile.name.toLowerCase()}@upi`} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      </div>
                    )}

                    {selectedPaymentMethod === "Razorpay" && (
                      <div className="form-group modal-field" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "500" }}>Razorpay Registered Mobile Number</label>
                        <input type="text" placeholder="+91 98765 43210" defaultValue={profile.phone} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      </div>
                    )}

                    {selectedPaymentMethod === "Card" && (
                      <div className="form-group modal-field" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "500" }}>Card Number</label>
                        <input type="text" placeholder="4532 •••• •••• 8821" defaultValue="4532 9981 2234 8821" required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                      </div>
                    )}

                    {selectedPaymentMethod === "NetBanking" && (
                      <div className="form-group modal-field" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "500" }}>Select Bank</label>
                        <select className="modal-select" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>State Bank of India</option>
                          <option>Axis Bank</option>
                        </select>
                      </div>
                    )}

                    <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)} style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-confirm-pay" disabled={isProcessing} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#079b9b", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
                        {isProcessing ? "Processing Payment via Backend..." : `Pay ₹${totalAmount.toFixed(2)} via ${selectedPaymentMethod}`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* OFFICIAL PAYMENT RECEIPT MODAL */}
          {showReceiptModal && paymentReceipt && (
            <div className="modal-backdrop" onClick={() => setShowReceiptModal(false)}>
              <div className="modal-box receipt-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", background: "#ffffff", borderRadius: "14px", padding: "24px" }}>
                <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", color: "#079b9b", textTransform: "uppercase" }}>OFFICIAL PAYMENT RECEIPT</span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "20px", color: "#0f172a" }}>Receipt #{paymentReceipt.receiptId}</h3>
                  </div>
                  <button type="button" className="btn-close-modal" onClick={() => setShowReceiptModal(false)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
                </div>

                <div className="modal-body" style={{ paddingTop: "16px" }}>
                  <div className="receipt-success-banner" style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "14px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                    <span style={{ fontSize: "22px", fontWeight: "bold" }}>✓</span>
                    <div>
                      <strong style={{ fontSize: "15px", display: "block" }}>Payment Successfully Processed & Stored</strong>
                      <small style={{ fontSize: "12px" }}>Timestamp: {paymentReceipt.dateTime}</small>
                    </div>
                  </div>

                  <div className="receipt-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>PAYER / RESIDENT</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.user}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>APARTMENT UNIT</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.apartment}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>INVOICE / BILL ID</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.billId}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>BILLING PERIOD</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.billingPeriod}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>PAYMENT METHOD</span>
                      <strong style={{ color: "#079b9b" }}>{paymentReceipt.paymentMethod}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "600" }}>TRANSACTION REF ID</span>
                      <strong style={{ color: "#0f172a" }}>{paymentReceipt.transactionRef}</strong>
                    </div>
                  </div>

                  <div className="receipt-total-box" style={{ background: "#0f172a", color: "#ffffff", padding: "16px", borderRadius: "10px", textAlign: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>TOTAL AMOUNT PAID</span>
                    <strong style={{ fontSize: "28px", color: "#38bdf8", display: "block", margin: "4px 0" }}>₹{paymentReceipt.amount.toFixed(2)}</strong>
                    <small style={{ color: "#34d399", fontWeight: "600" }}>Status: {paymentReceipt.status}</small>
                  </div>

                  {paymentReceipt.emailSent && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: "600" }}>
                      ✉️ Invoice PDF emailed to {paymentReceipt.emailedTo}
                    </div>
                  )}
                  {receiptDownloadError && (
                    <div style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: "600" }}>
                      ⚠️ {receiptDownloadError}
                    </div>
                  )}

                  <div className="modal-actions-bar" style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleDownloadReceipt}
                      style={{ flex: "1", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: "600", cursor: "pointer" }}
                    >
                      ↓ Download Invoice (PDF)
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => {
                        setShowReceiptModal(false);
                        navigate("/resident/payment-history");
                      }}
                      style={{ flex: "1", padding: "10px", borderRadius: "6px", border: "none", background: "#079b9b", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}
                    >
                      View Payment History →
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

export default CurrentBill;