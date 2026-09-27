import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import meterService from "../../../services/meterService";
import "./AddWaterMeter.css";

function AddWaterMeter() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    serialNumber: `WM-${Math.floor(1000 + Math.random() * 9000)}`,
    meterType: "Smart Digital",
    installationDate: new Date().toISOString().split("T")[0],
    firmwareVersion: "v2.4.1",
    buildingName: "Building A",
    apartmentNumber: "",
    residentName: "",
    initialReading: "15.0",
    flowRate: "3.5",
    batteryPercentage: "100",
    signalStrength: "95",
    status: "Active",
    condition: "Normal",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serialNumber.trim()) newErrors.serialNumber = "Serial Number / Meter ID is required";
    if (!formData.meterType) newErrors.meterType = "Meter Type is required";
    if (!formData.installationDate) newErrors.installationDate = "Installation Date is required";
    if (!formData.buildingName.trim()) newErrors.buildingName = "Building Name is required";
    if (!formData.apartmentNumber.trim()) newErrors.apartmentNumber = "Apartment / Unit Number is required";
    if (!formData.residentName.trim()) newErrors.residentName = "Resident Name is required";
    if (!formData.initialReading.trim()) newErrors.initialReading = "Initial Reading is required";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    const meterId = formData.serialNumber.trim();
    const readingFormatted = `${parseFloat(formData.initialReading || 0).toFixed(1)} KL`;
    const flowRateFormatted = `${parseFloat(formData.flowRate || 0).toFixed(1)} L/min`;
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}, ${now.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

    const newMeterRecord = {
      id: meterId,
      serialNumber: meterId,
      resident: formData.residentName.trim(),
      apartment: formData.apartmentNumber.trim(),
      building: formData.buildingName.trim(),
      reading: readingFormatted,
      flowRate: flowRateFormatted,
      lastReading: dateFormatted,
      status: formData.status,
      condition: formData.condition,
      batteryPercentage: parseInt(formData.batteryPercentage) || 100,
      signalStrength: parseInt(formData.signalStrength) || 95,
      meterType: formData.meterType,
      firmwareVersion: formData.firmwareVersion,
      installationDate: formData.installationDate,
    };

    // 1. Update localStorage for instant frontend sync
    let existingMeters = [];
    const stored = localStorage.getItem("system_water_meters");
    if (stored) {
      try {
        existingMeters = JSON.parse(stored);
      } catch (err) {
        console.error("Error parsing system_water_meters", err);
      }
    }
    existingMeters.unshift(newMeterRecord);
    localStorage.setItem("system_water_meters", JSON.stringify(existingMeters));

    // 2. Call Spring Boot backend REST API
    try {
      await meterService.createMeter({
        serialNumber: meterId,
        apartmentId: 1, // Default assignment id for API payload
        batteryPercentage: parseInt(formData.batteryPercentage) || 100,
        signalStrength: parseInt(formData.signalStrength) || 95,
        status: formData.status.toUpperCase(),
      });
    } catch (err) {
      console.warn("[Backend API] Backend call finished or fallback to local storage.", err);
    } finally {
      setIsSubmitting(false);
    }

    setSuccessMessage(`Water Meter ${meterId} added successfully! Redirecting to Connected Meters...`);

    setTimeout(() => {
      navigate("/admin/water-meters");
    }, 1500);
  };

  const handleSidebarNavigate = (page) => {
    const routes = {
      Overview: "/admin/dashboard",
      Residents: "/admin/residents",
      "User Accounts": "/admin/user-accounts",
      "Water Meters": "/admin/water-meters",
      "Add Water Meter": "/admin/add-water-meter",
      "Billing Management": "/admin/billing-management",
      "Payment Management": "/admin/payment-management",
      "Tariff Management": "/admin/tariff-management",
      "Meter Monitoring": "/admin/meter-monitoring",
      "Alerts & Notifications": "/admin/alerts-notifications",
      "Consumption Reports": "/admin/consumption-reports",
      "Billing Reports": "/admin/billing-reports",
      "Revenue Reports": "/admin/revenue-reports",
      "Admin Profile": "/admin/profile",
      "System Settings": "/admin/settings",
    };

    if (routes[page]) {
      navigate(routes[page]);
    }
  };

  return (
    <div className="admin-add-meter-page">
      <AdminSidebar
        activePage="Water Meters"
        onNavigate={handleSidebarNavigate}
        onLogout={() => {
          localStorage.clear();
          navigate("/login");
        }}
      />

      <main className="admin-add-meter-main">
        {/* TOP HEADER WITH BREADCRUMBS */}
        <header className="admin-header-light">
          <div className="header-left">
            <h1>Add Water Meters</h1>
            <p className="header-subtitle">
              Register new smart water meters to assign to apartments and enable live telemetry.
            </p>
          </div>

          <div className="header-right">
            <nav className="breadcrumbs">
              <span>Home</span> / <span>Water Management</span> / <span>Water Meters</span> / <span className="active">Add Water Meters</span>
            </nav>
            <button
              type="button"
              className="btn-back-meters"
              onClick={() => navigate("/admin/water-meters")}
            >
              ← Back to Water Meters
            </button>
          </div>
        </header>

        {/* CENTERED WHITE FORM CARD */}
        <div className="add-meter-form-container">
          {successMessage && (
            <div className="alert-success-banner">
              ✓ {successMessage}
            </div>
          )}

          <div className="white-form-card">
            <form onSubmit={handleSubmit} noValidate>
              {/* SECTION 1: METER IDENTIFICATION & HARDWARE */}
              <section className="form-section-group">
                <h2 className="section-blue-title">1. Meter Identification & Hardware Details</h2>

                <div className="fields-row-4">
                  <div className="form-field">
                    <label>Serial Number / Meter ID <span className="star">*</span></label>
                    <input
                      type="text"
                      name="serialNumber"
                      placeholder="e.g. WM-A105"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      className={errors.serialNumber ? "field-error" : ""}
                    />
                    {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
                  </div>

                  <div className="form-field">
                    <label>Meter Type <span className="star">*</span></label>
                    <select
                      name="meterType"
                      value={formData.meterType}
                      onChange={handleChange}
                      className={errors.meterType ? "field-error" : ""}
                    >
                      <option value="Smart Digital">Smart Digital</option>
                      <option value="Ultrasonic">Ultrasonic</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="IoT Telemetry">IoT Telemetry</option>
                    </select>
                    {errors.meterType && <span className="error-text">{errors.meterType}</span>}
                  </div>

                  <div className="form-field">
                    <label>Installation Date <span className="star">*</span></label>
                    <input
                      type="date"
                      name="installationDate"
                      value={formData.installationDate}
                      onChange={handleChange}
                      className={errors.installationDate ? "field-error" : ""}
                    />
                    {errors.installationDate && <span className="error-text">{errors.installationDate}</span>}
                  </div>

                  <div className="form-field">
                    <label>Firmware / Model Version</label>
                    <input
                      type="text"
                      name="firmwareVersion"
                      placeholder="e.g. v2.4.1"
                      value={formData.firmwareVersion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: LOCATION & RESIDENT ASSIGNMENT */}
              <section className="form-section-group">
                <h2 className="section-blue-title">2. Property & Resident Assignment</h2>

                <div className="fields-row-3">
                  <div className="form-field">
                    <label>Building Name <span className="star">*</span></label>
                    <select
                      name="buildingName"
                      value={formData.buildingName}
                      onChange={handleChange}
                      className={errors.buildingName ? "field-error" : ""}
                    >
                      <option value="Building A">Building A</option>
                      <option value="Building B">Building B</option>
                      <option value="Building C">Building C</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                    </select>
                    {errors.buildingName && <span className="error-text">{errors.buildingName}</span>}
                  </div>

                  <div className="form-field">
                    <label>Apartment / Flat Number <span className="star">*</span></label>
                    <input
                      type="text"
                      name="apartmentNumber"
                      placeholder="e.g. A-105 or 105"
                      value={formData.apartmentNumber}
                      onChange={handleChange}
                      className={errors.apartmentNumber ? "field-error" : ""}
                    />
                    {errors.apartmentNumber && <span className="error-text">{errors.apartmentNumber}</span>}
                  </div>

                  <div className="form-field">
                    <label>Resident Name <span className="star">*</span></label>
                    <input
                      type="text"
                      name="residentName"
                      placeholder="Enter resident full name"
                      value={formData.residentName}
                      onChange={handleChange}
                      className={errors.residentName ? "field-error" : ""}
                    />
                    {errors.residentName && <span className="error-text">{errors.residentName}</span>}
                  </div>
                </div>
              </section>

              {/* SECTION 3: TELEMETRY & INITIAL READINGS */}
              <section className="form-section-group">
                <h2 className="section-blue-title">3. Telemetry & Sensor Parameters</h2>

                <div className="fields-row-4">
                  <div className="form-field">
                    <label>Initial Reading (KL) <span className="star">*</span></label>
                    <input
                      type="number"
                      step="0.1"
                      name="initialReading"
                      placeholder="e.g. 15.0"
                      value={formData.initialReading}
                      onChange={handleChange}
                      className={errors.initialReading ? "field-error" : ""}
                    />
                    {errors.initialReading && <span className="error-text">{errors.initialReading}</span>}
                  </div>

                  <div className="form-field">
                    <label>Flow Rate (L/min)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="flowRate"
                      placeholder="e.g. 3.5"
                      value={formData.flowRate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Battery Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="batteryPercentage"
                      placeholder="100"
                      value={formData.batteryPercentage}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Signal Strength (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="signalStrength"
                      placeholder="95"
                      value={formData.signalStrength}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 4: OPERATING STATUS & CONDITION */}
              <section className="form-section-group" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <h2 className="section-blue-title">4. Initial Operating Status & Condition</h2>

                <div className="fields-row-2">
                  <div className="form-field">
                    <label>Operating Status <span className="star">*</span></label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Offline">Offline</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Condition Assessment <span className="star">*</span></label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High Usage">High Usage</option>
                      <option value="Possible Leak">Possible Leak</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* BOTTOM BUTTON BAR */}
              <div className="form-action-buttons">
                <button
                  type="button"
                  className="btn-cancel-white"
                  onClick={() => navigate("/admin/water-meters")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Water Meter..." : "+ Add Water Meters"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddWaterMeter;
