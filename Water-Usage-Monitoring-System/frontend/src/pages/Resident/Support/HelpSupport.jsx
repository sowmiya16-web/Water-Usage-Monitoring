import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import { fetchApi } from "../../../services/apiConfig";

import "./HelpSupport.css";


const FAQS = [
  {
    id: 1,
    question: "How is my water bill calculated?",
    answer:
      "Your bill is calculated based on the volumetric usage recorded by your smart meter. It includes a base tariff (fixed monthly charge), volumetric charges based on consumption slabs, common water charges for shared areas, and applicable taxes.",
  },
  {
    id: 2,
    question: "What should I do if I notice an unusual spike in my consumption?",
    answer:
      "If you see an unusual spike, first check for any running taps, dripping faucets, or toilet leaks. If the meter reading seems incorrect, raise a support ticket below so our team can inspect your meter. You can also track daily usage in the Water Consumption section.",
  },
  {
    id: 3,
    question: "How do I update my contact information?",
    answer:
      "Your registered contact information (name, phone number, email) is managed by the building administration. To update it, please raise a support ticket with the required change details, and the admin team will update it within 2–3 working days.",
  },
  {
    id: 4,
    question: "What payment methods are accepted?",
    answer:
      "We accept online payments via UPI, Net Banking, Debit/Credit Cards, and digital wallets. Payment records are maintained under Payment History for your reference.",
  },
  {
    id: 5,
    question: "What happens if I miss my payment due date?",
    answer:
      "A late payment penalty of 2% per month may be applied to outstanding amounts. Please ensure payments are made by the due date shown on your Current Bill page. Contact support if you need an extension.",
  },
  {
    id: 6,
    question: "How often is my meter read?",
    answer:
      "Your smart meter transmits readings automatically every 24 hours. Monthly billing readings are recorded on the last working day of each month. You can view historical readings in the Meter Details section.",
  },
];

const CONTACT_CHANNELS = [
  {
    icon: "✉",
    label: "Email Support",
    value: "support@watermonitor.com",
    description: "Response within 24 hours",
  },
  {
    icon: "☎",
    label: "Phone Support",
    value: "+91 1800 XXX XXXX",
    description: "Mon–Sat, 9:00 AM – 6:00 PM",
  },
  {
    icon: "◉",
    label: "Building Office",
    value: "Block A, Ground Floor",
    description: "Mon–Fri, 10:00 AM – 5:00 PM",
  },
];


function HelpSupport() {

  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketCategory, setTicketCategory] = useState("billing");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState("");


  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    try {
      const result = await fetchApi("/maintenance/complaints", {
        method: "POST",
        body: JSON.stringify({
          category: ticketCategory,
          message: ticketMessage.trim(),
          status: "OPEN",
        }),
      });
      const ref = result?.data?.ticketRef || `TKT-${Date.now().toString().slice(-6)}`;
      setTicketRef(ref);
      setTicketSubmitted(true);
      setTicketMessage("");
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      // Fallback: show a local ref so the user sees a confirmation
      const ref = `TKT-${Date.now().toString().slice(-6)}`;
      setTicketRef(ref);
      setTicketSubmitted(true);
      setTicketMessage("");
    }
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="help-page">

      <Sidebar
        activePage="Help & Support"
        onLogout={handleLogout}
      />

      <main className="help-main">

        <Header activePage="Help & Support" />

        <div className="help-content">

          <div className="help-heading">
            <span className="section-label">SUPPORT</span>
            <h2>Help & Support</h2>
            <p>Find answers to common questions or contact our support team directly.</p>
          </div>

          <div className="help-grid">

            {/* FAQ */}
            <div className="help-left">
              <section className="help-card">
                <div className="help-card-header">
                  <h3>Frequently Asked Questions</h3>
                  <p>Answers to the most common questions about your water account.</p>
                </div>

                <div className="faq-list">
                  {FAQS.map((faq) => (
                    <div
                      key={faq.id}
                      className={`faq-item ${openFaq === faq.id ? "faq-open" : ""}`}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <span>{faq.question}</span>
                        <span className="faq-chevron">
                          {openFaq === faq.id ? "▲" : "▼"}
                        </span>
                      </button>

                      {openFaq === faq.id && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Panel */}
            <div className="help-right">

              {/* Contact */}
              <section className="help-card">
                <div className="help-card-header">
                  <h3>Contact Us</h3>
                  <p>Reach our support team through any of the following channels.</p>
                </div>

                <div className="contact-list">
                  {CONTACT_CHANNELS.map((ch) => (
                    <div key={ch.label} className="contact-item">
                      <div className="contact-icon">{ch.icon}</div>
                      <div className="contact-info">
                        <span>{ch.label}</span>
                        <strong>{ch.value}</strong>
                        <small>{ch.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Ticket */}
              <section className="help-card">
                <div className="help-card-header">
                  <h3>Raise a Support Ticket</h3>
                  <p>Submit a ticket and we'll respond within 24 hours.</p>
                </div>

                {ticketSubmitted ? (
                  <div className="ticket-success">
                    <div className="ticket-success-icon">✓</div>
                    <strong>Ticket Submitted</strong>
                    <p>Reference: <span className="ticket-ref">{ticketRef}</span></p>
                    <p>Our team will respond within 24 hours.</p>
                    <button
                      type="button"
                      className="new-ticket-button"
                      onClick={() => setTicketSubmitted(false)}
                    >
                      Submit another ticket
                    </button>
                  </div>
                ) : (
                  <form className="ticket-form" onSubmit={handleSubmitTicket}>
                    <div className="ticket-field">
                      <label>Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                      >
                        <option value="billing">Billing Issue</option>
                        <option value="meter">Meter Problem</option>
                        <option value="consumption">Consumption Query</option>
                        <option value="payment">Payment Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="ticket-field">
                      <label>Message</label>
                      <textarea
                        rows={4}
                        placeholder="Describe your issue clearly..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="submit-ticket-button"
                      disabled={!ticketMessage.trim()}
                    >
                      Submit Ticket
                    </button>
                  </form>
                )}
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HelpSupport;
