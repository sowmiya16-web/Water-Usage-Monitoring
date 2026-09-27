import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Header from "../../../components/Header/Header";
import "./WaterConsumption.css";

function WaterConsumption() {
  const navigate = useNavigate();

  const [liveUsage, setLiveUsage] = useState(18.64);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("Today");

  // Simulated live meter update
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsage((previous) => {
        const variation = (Math.random() - 0.45) * 0.04;

        return Number(
          Math.max(18.1, previous + variation).toFixed(2)
        );
      });

      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    return lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const goTo = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    navigate("/login");
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

    if (routes[page]) {
      navigate(routes[page]);
    }
  };

  const periodData = {
    Today: [
      { day: "6AM", value: 80 },
      { day: "9AM", value: 140 },
      { day: "12PM", value: 110 },
      { day: "3PM", value: 90 },
      { day: "6PM", value: 160 },
      { day: "9PM", value: 80 },
      { day: "Now", value: 66 },
    ],
    "This Week": [
      { day: "Mon", value: 610 },
      { day: "Tue", value: 720 },
      { day: "Wed", value: 680 },
      { day: "Thu", value: 590 },
      { day: "Fri", value: 740 },
      { day: "Sat", value: 630 },
      { day: "Sun", value: 660 },
    ],
    "This Month": [
      { day: "W1", value: 4200 },
      { day: "W2", value: 4800 },
      { day: "W3", value: 4500 },
      { day: "W4", value: 5100 },
    ],
  };

  const consumptionData = periodData[selectedPeriod] || periodData["This Week"];
  const chartMax = Math.max(...consumptionData.map((d) => d.value)) * 1.15;


  return (
    <div className="water-consumption-page">

      {/* SIDEBAR */}
      <Sidebar
        activePage="Water Consumption"
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      {/* MAIN AREA */}
      <main className="water-consumption-main">

        {/* HEADER */}
        <Header activePage="Water Consumption" />

        <div className="water-consumption-content">

          {/* =====================================================
              PAGE HEADER
          ====================================================== */}

          <section className="water-page-header">

            <div>
              <span className="water-page-label">
                WATER MANAGEMENT
              </span>

              <h2>Water Consumption</h2>

              <p>
                Monitor your household water usage
                and consumption patterns.
              </p>
            </div>

            <div className="live-status">
              <span className="live-dot"></span>

              <div>
                <strong>LIVE</strong>

                <small>
                  Updated {formatTime()}
                </small>
              </div>
            </div>

          </section>


          {/* =====================================================
              LIVE METER CARD
          ====================================================== */}

          <section className="live-meter-card">

            <div className="live-meter-left">

              <div className="large-water-icon">
                💧
              </div>

              <div>

                <span className="live-label">
                  LIVE WATER CONSUMPTION
                </span>

                <div className="live-number">
                  <strong>
                    {liveUsage.toFixed(2)}
                  </strong>

                  <span>KL</span>
                </div>

                <p>
                  Meter WM-A101 is transmitting
                  live consumption data.
                </p>

              </div>

            </div>


            <div className="live-meter-stats">

              <div>
                <span>TODAY</span>
                <strong>0.66 KL</strong>
              </div>

              <div>
                <span>FLOW RATE</span>
                <strong>4.2 L/min</strong>
              </div>

              <div>
                <span>STATUS</span>

                <strong className="normal-text">
                  ● Normal
                </strong>
              </div>

            </div>

          </section>


          {/* =====================================================
              KPI CARDS
          ====================================================== */}

          <section className="consumption-kpi-grid">

            <div className="consumption-kpi">

              <div className="kpi-icon water-kpi">
                💧
              </div>

              <div className="kpi-content">

                <span className="kpi-label">
                  THIS MONTH
                </span>

                <strong>
                  {liveUsage.toFixed(2)} KL
                </strong>

                <small className="kpi-positive">
                  ↓ 8.4% vs last month
                </small>

              </div>

            </div>


            <div className="consumption-kpi">

              <div className="kpi-icon average-kpi">
                ◷
              </div>

              <div className="kpi-content">

                <span className="kpi-label">
                  DAILY AVERAGE
                </span>

                <strong>
                  0.66 KL
                </strong>

                <small>
                  660 litres/day
                </small>

              </div>

            </div>


            <div className="consumption-kpi">

              <div className="kpi-icon monthly-kpi">
                ▣
              </div>

              <div className="kpi-content">

                <span className="kpi-label">
                  MONTHLY AVERAGE
                </span>

                <strong>
                  22.6 KL
                </strong>

                <small>
                  Last 6 months
                </small>

              </div>

            </div>


            <div className="consumption-kpi">

              <div className="kpi-icon savings-kpi">
                ↘
              </div>

              <div className="kpi-content">

                <span className="kpi-label">
                  WATER SAVED
                </span>

                <strong>
                  3.7 KL
                </strong>

                <small className="kpi-positive">
                  Better than average
                </small>

              </div>

            </div>

          </section>


          {/* =====================================================
              CHART + SMART INSIGHTS
          ====================================================== */}

          <section className="water-analysis-grid">

            {/* CONSUMPTION CHART */}

            <div className="water-card">

              <div className="water-card-header">

                <div>
                  <h3>
                    Consumption Trend
                  </h3>

                  <p>
                    Last 7 days
                  </p>
                </div>

                <select
                  value={selectedPeriod}
                  onChange={(event) =>
                    setSelectedPeriod(event.target.value)
                  }
                  className="period-select"
                >
                  <option value="Today">
                    Today
                  </option>

                  <option value="This Week">
                    This Week
                  </option>

                  <option value="This Month">
                    This Month
                  </option>
                </select>

              </div>


              <div className="chart-summary">

                <div>
                  <span>Total consumption</span>

                  <strong>
                    4.63 KL
                  </strong>
                </div>

                <div className="chart-change">
                  ↓ 8.4%
                  <small>vs last period</small>
                </div>

              </div>


              <div className="simple-chart">

                <div className="chart-y-axis">
                  <span>800</span>
                  <span>600</span>
                  <span>400</span>
                  <span>200</span>
                  <span>0</span>
                </div>

                <div className="chart-area">

                  <div className="chart-grid-line line-1"></div>
                  <div className="chart-grid-line line-2"></div>
                  <div className="chart-grid-line line-3"></div>
                  <div className="chart-grid-line line-4"></div>
                  <div className="chart-grid-line line-5"></div>

                  <div className="simple-chart-bars">

                    {consumptionData.map((item, index) => (

                      <div
                        className="simple-chart-column"
                        key={item.day}
                      >

                        <div className="chart-value">
                          {item.value}
                        </div>

                        <div className="simple-bar-area">

                          <div
                            className={`simple-bar ${
                              index === consumptionData.length - 1
                                ? "current-bar"
                                : ""
                            }`}
                            style={{
                              height: `${(item.value / chartMax) * 100}%`,
                            }}
                          ></div>

                        </div>

                        <small>
                          {item.day}
                        </small>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>


            {/* SMART INSIGHTS */}

            <div className="water-card">

              <div className="water-card-header">

                <div>
                  <h3>
                    Smart Insights
                  </h3>

                  <p>
                    Based on your usage
                  </p>
                </div>

              </div>


              <div className="smart-insight-list">

                <div className="smart-insight">

                  <div className="insight-icon success">
                    ✓
                  </div>

                  <section>
                    <strong>
                      Consumption is normal
                    </strong>

                    <p>
                      Your usage is currently
                      within the recommended range.
                    </p>
                  </section>

                </div>


                <div className="smart-insight">

                  <div className="insight-icon decrease">
                    ↓
                  </div>

                  <section>
                    <strong>
                      Usage decreased
                    </strong>

                    <p>
                      You used 8.4% less water
                      compared with last month.
                    </p>
                  </section>

                </div>


                <div className="smart-insight">

                  <div className="insight-icon tip">
                    💡
                  </div>

                  <section>
                    <strong>
                      Keep saving water
                    </strong>

                    <p>
                      You are below the community
                      average this month.
                    </p>
                  </section>

                </div>

              </div>

            </div>

          </section>


          {/* =====================================================
              USAGE BREAKDOWN
          ====================================================== */}

          <section className="usage-breakdown-grid">

            <div className="water-card">

              <div className="water-card-header">

                <div>
                  <h3>
                    Daily Usage Breakdown
                  </h3>

                  <p>
                    Your consumption during the week
                  </p>
                </div>

              </div>


              <div className="usage-breakdown-list">

                <div className="usage-row">
                  <span>Monday</span>

                  <div className="usage-progress">
                    <div style={{ width: "76%" }}></div>
                  </div>

                  <strong>610 L</strong>
                </div>


                <div className="usage-row">
                  <span>Tuesday</span>

                  <div className="usage-progress">
                    <div style={{ width: "90%" }}></div>
                  </div>

                  <strong>720 L</strong>
                </div>


                <div className="usage-row">
                  <span>Wednesday</span>

                  <div className="usage-progress">
                    <div style={{ width: "85%" }}></div>
                  </div>

                  <strong>680 L</strong>
                </div>


                <div className="usage-row">
                  <span>Thursday</span>

                  <div className="usage-progress">
                    <div style={{ width: "74%" }}></div>
                  </div>

                  <strong>590 L</strong>
                </div>


                <div className="usage-row">
                  <span>Friday</span>

                  <div className="usage-progress">
                    <div style={{ width: "93%" }}></div>
                  </div>

                  <strong>740 L</strong>
                </div>

              </div>

            </div>


            {/* HOUSEHOLD END-USE BREAKDOWN */}

            <div className="water-card enduse-breakdown-card">

              <div className="water-card-header">

                <div>
                  <h3>
                    Household End-Use Breakdown
                  </h3>

                  <p>
                    Estimated water consumption by appliance / room
                  </p>
                </div>

                <span className="period-select" style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px" }}>
                  ESTIMATED
                </span>

              </div>


              <div className="enduse-list" style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>🚿 Bathroom & Showers</span>
                    <strong>7.81 KL (42%)</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: "42%", height: "100%", background: "#079b9b", borderRadius: "99px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>🍳 Kitchen & Cooking</span>
                    <strong>5.20 KL (28%)</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: "28%", height: "100%", background: "#25a89e", borderRadius: "99px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>🧺 Laundry & Washing</span>
                    <strong>3.35 KL (18%)</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: "18%", height: "100%", background: "#54c4bb", borderRadius: "99px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>🪴 Balcony & Plants</span>
                    <strong>2.24 KL (12%)</strong>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: "12%", height: "100%", background: "#81d8d2", borderRadius: "99px" }}></div>
                  </div>
                </div>

              </div>

            </div>

          </section>


          {/* =====================================================
              WATER SAVING TIP
          ====================================================== */}

          <section className="water-saving-card">

            <div className="saving-icon">
              💧
            </div>

            <div className="saving-content">

              <span>
                WATER SAVING TIP
              </span>

              <h3>
                Reduce daily water usage
              </h3>

              <p>
                Fix leaking taps and avoid unnecessary
                water usage. Small changes can save
                several litres every day.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                goTo("/resident/usage-history")
              }
            >
              View Usage History →
            </button>

          </section>


          {/* =====================================================
              QUICK ACTIONS
          ====================================================== */}

          <section className="quick-actions-card">

            <div>

              <span>
                QUICK ACTIONS
              </span>

              <h3>
                Explore your water data
              </h3>

            </div>


            <div className="quick-action-buttons">

              <button
                type="button"
                onClick={() =>
                  goTo("/resident/usage-history")
                }
              >
                <span>◷</span>
                Usage History
                <b>→</b>
              </button>


              <button
                type="button"
                onClick={() =>
                  goTo("/resident/meter-details")
                }
              >
                <span>▣</span>
                Meter Details
                <b>→</b>
              </button>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default WaterConsumption;