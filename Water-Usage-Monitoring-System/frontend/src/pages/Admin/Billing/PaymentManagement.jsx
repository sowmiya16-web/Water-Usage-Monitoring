import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import "./PaymentManagement.css";

function PaymentManagement() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([
    {
      txnId: "TXN-8849102",
      resident: "Sowmiya",
      apartment: "Apartment A-402",
      amount: 837.0,
      method: "UPI (Google Pay)",
      timestamp: "28 Aug 2026, 03:42 PM",
      status: "Success",
      gatewayRef: "PAY-GP-994102",
    },
    {
      txnId: "TXN-8849101",
      resident: "Rahul Sharma",
      apartment: "Apartment A-101",
      amount: 958.5,
      method: "NetBanking (HDFC)",
      timestamp: "28 Aug 2026, 02:15 PM",
      status: "Success",
      gatewayRef: "PAY-NB-772101",
    },
    {
      txnId: "TXN-8849100",
      resident: "Priya Sundaram",
      apartment: "Apartment B-203",
      amount: 1188.0,
      method: "Credit Card (Visa)",
      timestamp: "28 Aug 2026, 11:30 AM",
      status: "Pending",
      gatewayRef: "PAY-CC-443100",
    },
    {
      txnId: "TXN-8849099",
      resident: "Arun Varma",
      apartment: "Apartment B-304",
      amount: 639.0,
      method: "UPI (PhonePe)",
      timestamp: "27 Aug 2026, 06:10 PM",
      status: "Success",
      gatewayRef: "PAY-PP-221099",
    },
    {
      txnId: "TXN-8849098",
      resident: "Vikram Malhotra",
      apartment: "Apartment C-501",
      amount: 1476.0,
      method: "Auto-Debit (ACH)",
      timestamp: "27 Aug 2026, 09:00 AM",
      status: "Failed",
      gatewayRef: "PAY-ACH-110098",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.txnId.toLowerCase().includes(q) ||
        p.resident.toLowerCase().includes(q) ||
        p.apartment.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const handleResendReceipt = (residentName, txnId) => {
    setActionMessage(`✓ Digital payment receipt & confirmation email re-sent to ${residentName} for Txn #${txnId}.`);
    setTimeout(() => setActionMessage(""), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Resident Name",
      "Apartment Unit",
      "Amount Paid (INR)",
      "Payment Channel",
      "Timestamp",
      "Status",
      "Gateway Ref",
    ];

    const rows = filteredPayments.map((p) => [
      p.txnId,
      p.resident,
      p.apartment,
      `₹${p.amount.toFixed(2)}`,
      p.method,
      p.timestamp,
      p.status,
      p.gatewayRef,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaymentManagement_Transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-payment-page">
      <AdminSidebar activePage="Payment Management" />

      <main className="admin-payment-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">REVENUE & GATEWAY OPERATIONS</span>
            <h1>Payment Management Audit</h1>
          </div>
          <div className="admin-header-right">
            <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
              💳 Export Transactions CSV
            </button>
          </div>
        </header>

        <div className="admin-payment-content">
          {actionMessage && <div className="notice-alert-banner">{actionMessage}</div>}

          {/* KPI CARDS */}
          <section className="payment-kpi-grid">
            <div className="payment-kpi-card">
              <div className="kpi-icon-box success">✓</div>
              <div>
                <span>TOTAL COLLECTED PAYMENTS</span>
                <strong>₹1,02,300</strong>
                <small>118 Successful Transactions</small>
              </div>
            </div>

            <div className="payment-kpi-card">
              <div className="kpi-icon-box today">⚡</div>
              <div>
                <span>TODAY'S INFLOW</span>
                <strong>₹12,450</strong>
                <small>14 Instant Settlement Txns</small>
              </div>
            </div>

            <div className="payment-kpi-card">
              <div className="kpi-icon-box pending">⌛</div>
              <div>
                <span>GATEWAY SETTLEMENTS</span>
                <strong className="text-warning">₹18,500</strong>
                <small>20 Pending Bank Processing</small>
              </div>
            </div>

            <div className="payment-kpi-card">
              <div className="kpi-icon-box rate">🛡</div>
              <div>
                <span>COLLECTION SUCCESS RATE</span>
                <strong>96.7%</strong>
                <small>4 Auto-Retried / Failed Txns</small>
              </div>
            </div>
          </section>

          {/* PAYMENT METHOD DISTRIBUTION SECTION */}
          <section className="method-distribution-card">
            <div className="chart-header">
              <h3>Payment Channels & Method Distribution</h3>
              <small>Real-time share of payment channels used by society residents</small>
            </div>

            <div className="distribution-bars-container">
              <div className="d-bar-row">
                <div className="d-label"><span>UPI / Instant Pay (62%)</span><strong>₹63,426</strong></div>
                <div className="d-progress"><div className="d-fill upi" style={{ width: "62%" }}></div></div>
              </div>

              <div className="d-bar-row">
                <div className="d-label"><span>NetBanking / Direct Transfer (24%)</span><strong>₹24,552</strong></div>
                <div className="d-progress"><div className="d-fill netbank" style={{ width: "24%" }}></div></div>
              </div>

              <div className="d-bar-row">
                <div className="d-label"><span>Credit / Debit Cards (14%)</span><strong>₹14,322</strong></div>
                <div className="d-progress"><div className="d-fill cards" style={{ width: "14%" }}></div></div>
              </div>
            </div>
          </section>

          {/* SEARCH & FILTERS */}
          <section className="payment-filters-card">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search by transaction ID, resident name, or payment method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-selects">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Transaction Statuses</option>
                <option value="Success">Success</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </section>

          {/* PAYMENT TRANSACTIONS TABLE */}
          <section className="payment-table-card">
            <div className="table-header-title">
              <h3>Payment Audit Trail ({filteredPayments.length})</h3>
            </div>

            <table className="payment-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Resident & Unit</th>
                  <th>Payment Method</th>
                  <th>Amount (₹)</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.txnId}>
                      <td className="font-id">{p.txnId}</td>
                      <td>
                        <strong>{p.resident}</strong>
                        <p className="text-sub" style={{ margin: "2px 0 0" }}>{p.apartment}</p>
                      </td>
                      <td><span className="charge-cat usage">{p.method}</span></td>
                      <td><strong className="text-price">₹{p.amount.toFixed(2)}</strong></td>
                      <td className="text-sub">{p.timestamp}</td>
                      <td>
                        <span className={`badge-status ${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-view"
                            onClick={() => setSelectedTxn(p)}
                          >
                            View Receipt
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action"
                            onClick={() => handleResendReceipt(p.resident, p.txnId)}
                          >
                            Resend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      No transactions found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* TRANSACTION RECEIPT MODAL */}
          {selectedTxn && (
            <div className="rpt-modal-backdrop" onClick={() => setSelectedTxn(null)}>
              <div className="rpt-modal-box pay-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="rpt-modal-header">
                  <div>
                    <span className="rpt-modal-sub">TRANSACTION RECEIPT AUDIT</span>
                    <h3>Txn #{selectedTxn.txnId}</h3>
                  </div>
                  <button type="button" className="rpt-btn-close-modal" onClick={() => setSelectedTxn(null)}>×</button>
                </div>

                <div className="rpt-modal-body">
                  <div className="p-hero-card">
                    <div>
                      <span>RESIDENT</span>
                      <strong>{selectedTxn.resident}</strong>
                      <p>{selectedTxn.apartment}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span>STATUS</span>
                      <span className={`badge-status ${selectedTxn.status.toLowerCase()}`}>
                        {selectedTxn.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-grid">
                    <div className="p-box">
                      <span>Amount Paid</span>
                      <strong>₹{selectedTxn.amount.toFixed(2)}</strong>
                    </div>
                    <div className="p-box">
                      <span>Payment Channel</span>
                      <strong>{selectedTxn.method}</strong>
                    </div>
                    <div className="p-box">
                      <span>Gateway Reference</span>
                      <strong>{selectedTxn.gatewayRef}</strong>
                    </div>
                    <div className="p-box">
                      <span>Processed Time</span>
                      <strong>{selectedTxn.timestamp}</strong>
                    </div>
                  </div>

                  <div className="rpt-modal-actions-bar">
                    <button
                      type="button"
                      className="btn-secondary-action"
                      onClick={() => handleResendReceipt(selectedTxn.resident, selectedTxn.txnId)}
                    >
                      📩 Resend Receipt Email
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pay"
                      onClick={() => setSelectedTxn(null)}
                    >
                      Close Receipt
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

export default PaymentManagement;
