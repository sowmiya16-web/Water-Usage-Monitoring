import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import { alertService } from "../../../services/alertService";

import "./Notifications.css";

const TYPE_ICON = {
  billing: "₹",
  water: "◉",
  payment: "✓",
  system: "●",
};

const FILTER_TABS = [
  { key: "All", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "billing", label: "Billing" },
  { key: "water", label: "Water" },
  { key: "payment", label: "Payment" },
  { key: "system", label: "System" },
];

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  /* =========================================================
     FETCH DYNAMIC NOTIFICATIONS FROM BACKEND
  ========================================================= */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertService.getAllAlerts();
      
      const formatted = data.map((item) => {
        let type = "system";
        if (item.alertType === "PAYMENT_RECEIVED") type = "payment";
        else if (item.alertType?.includes("BILL") || item.alertType?.includes("TIER")) type = "billing";
        else if (item.alertType === "HIGH_CONSUMPTION") type = "water";

        let dateStr = "Today";
        let timeStr = "Just now";
        if (item.createdAt) {
          const d = new Date(item.createdAt);
          dateStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
          timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        }

        return {
          id: item.alertId,
          rawId: item.alertId,
          alertRef: item.alertRef,
          title: item.title,
          message: item.message,
          time: timeStr,
          date: dateStr,
          type: type,
          unread: !item.acknowledged && item.status === "ACTIVE",
        };
      });

      setNotifications(formatted);
    } catch (err) {
      console.error("[Notifications] Error fetching dynamic alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* =========================================================
     HANDLERS
  ========================================================= */
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
  };

  const markAllRead = async () => {
    try {
      await alertService.acknowledgeAllAlerts();
      setNotifications((items) =>
        items.map((item) => ({ ...item, unread: false }))
      );
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  const markOneRead = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, unread: false } : item))
      );
    } catch (e) {
      console.error("Error marking read:", e);
    }
  };

  /* =========================================================
     DERIVED STATE
  ========================================================= */
  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "unread") return n.unread;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="notifications-page">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        activePage="Notifications"
        onLogout={handleLogout}
      />


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="notifications-main">

        <Header activePage="Notifications" />

        <div className="notifications-content">


          {/* =================================================
              PAGE HEADING
          ================================================= */}

          <div className="notifications-heading">

            <div>
              <span className="section-label">
                COMMUNICATION
              </span>

              <h2>
                Notifications

                {unreadCount > 0 && (
                  <span className="unread-badge">
                    {unreadCount}
                  </span>
                )}
              </h2>

              <p>
                Stay updated with your water account
                and service announcements.
              </p>
            </div>


            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllRead}
              >
                Mark all as read
              </button>
            )}

          </div>


          {/* =================================================
              FILTER TABS
          ================================================= */}

          <div className="notifications-filters">

            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab ${
                  activeFilter === tab.key
                    ? "filter-tab-active"
                    : ""
                }`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}

                {tab.key === "unread" && unreadCount > 0 && (
                  <span className="tab-count">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}

          </div>


          {/* =================================================
              NOTIFICATION LIST
          ================================================= */}

          <section className="notifications-list">

            {filtered.length === 0 ? (

              <div className="notifications-empty">
                <span>◉</span>
                <p>No notifications in this category.</p>
              </div>

            ) : (

              filtered.map((notification) => (

                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.unread
                      ? "notification-unread"
                      : ""
                  }`}
                >

                  <div
                    className={`notification-icon icon-${notification.type}`}
                  >
                    {TYPE_ICON[notification.type]}
                  </div>


                  <div className="notification-body">

                    <div className="notification-title-row">

                      <strong>
                        {notification.title}
                      </strong>

                      {notification.unread && (
                        <span className="unread-dot" />
                      )}

                    </div>

                    <p>{notification.message}</p>

                    <div className="notification-meta">
                      <small>{notification.time}</small>
                      <small>{notification.date}</small>
                    </div>

                  </div>


                  {notification.unread && (
                    <button
                      type="button"
                      className="mark-read-button"
                      onClick={() =>
                        markOneRead(notification.id)
                      }
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}

                </div>

              ))

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

export default Notifications;