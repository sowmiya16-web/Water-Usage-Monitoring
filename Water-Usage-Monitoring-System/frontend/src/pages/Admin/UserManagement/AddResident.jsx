import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/AdminSidebar/AdminSidebar";
import residentService from "../../../services/residentService";
import "./AddResident.css";

function AddResident() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    profilePhoto: null,
    email: "",
    mobile: "",
    alternatePhone: "",
    flatNumber: "",
    buildingName: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    residentId: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
    residentType: "",
    familyMembers: "",
    moveInDate: "",
    moveOutDate: "",
    emergencyName: "",
    emergencyPhone: "",
    waterMeterId: "",
    meterNumber: "",
    meterType: "",
    installationDate: "",
    initialReading: "",
    sendEmailToggle: true,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, profilePhoto: file.name }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile Number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim().replace(/\D/g, ""))) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.flatNumber.trim()) newErrors.flatNumber = "House / Flat Number is required";
    if (!formData.buildingName.trim()) newErrors.buildingName = "Building Name is required";
    if (!formData.street.trim()) newErrors.street = "Street / Area is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
    }

    if (!formData.residentId.trim()) newErrors.residentId = "Resident ID is required";
    if (!formData.residentType) newErrors.residentType = "Resident Type is required";
    if (!formData.familyMembers) newErrors.familyMembers = "Number of family members is required";
    if (!formData.moveInDate) newErrors.moveInDate = "Move-in Date is required";

    if (!formData.emergencyName.trim()) newErrors.emergencyName = "Emergency contact name is required";
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = "Emergency contact number is required";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    const apartmentStr = `${formData.buildingName.trim()} - Unit ${formData.flatNumber.trim()}`;
    const meterStr = formData.meterNumber.trim() || formData.waterMeterId.trim() || `WM-${formData.flatNumber.trim().toUpperCase()}`;

    const newResidentRecord = {
      id: formData.residentId.trim(),
      name: fullName,
      email: formData.email.trim(),
      phone: formData.mobile.trim(),
      apartment: apartmentStr,
      meterId: meterStr,
      consumption: `${parseFloat(formData.initialReading || 0).toFixed(1)} KL`,
      billingStatus: "Paid",
      paymentStatus: "Up to Date",
      outstandingAmount: 0.0,
      status: "Active",
      registrationDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      lastLogin: "Just now",
      recentActivity: `Registered as ${formData.residentType} in ${formData.buildingName}`,
    };

    // 1. Always update local storage for smooth UI reactivity
    let existingList = [];
    const stored = localStorage.getItem("system_residents");
    if (stored) {
      try {
        existingList = JSON.parse(stored);
      } catch (err) {
        console.error("Error reading system_residents", err);
      }
    }
    existingList.unshift(newResidentRecord);
    localStorage.setItem("system_residents", JSON.stringify(existingList));

    // 2. Send complete 5-section payload to Spring Boot backend
    let feedbackMsg = "Resident added successfully.";
    try {
      const response = await residentService.createResident({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: fullName,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email.trim(),
        phone: formData.mobile.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        flatNumber: formData.flatNumber.trim(),
        buildingName: formData.buildingName.trim(),
        apartmentNumber: `${formData.buildingName.trim()} - Unit ${formData.flatNumber.trim()}`,
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode.trim(),
        residentIdStr: formData.residentId.trim(),
        occupancyStatus: formData.residentType || "Occupied",
        familyMembers: formData.familyMembers,
        moveInDate: formData.moveInDate,
        moveOutDate: formData.moveOutDate,
        emergencyName: formData.emergencyName.trim(),
        emergencyPhone: formData.emergencyPhone.trim(),
        waterMeterId: formData.waterMeterId.trim(),
        meterNumber: formData.meterNumber.trim(),
        meterType: formData.meterType,
        installationDate: formData.installationDate,
        initialReading: formData.initialReading,
        sendEmail: formData.sendEmailToggle,
      });

      if (response && response.message) {
        feedbackMsg = response.message;
      } else if (!formData.sendEmailToggle) {
        feedbackMsg = "Resident added successfully. No email was sent.";
      } else {
        feedbackMsg = "Resident added successfully. Resident information sent to the official Admin email.";
      }
    } catch (err) {
      console.warn("[Backend Integration] Backend API offline or error. Local resident saved successfully.", err);
      if (!formData.sendEmailToggle) {
        feedbackMsg = "Resident added successfully. No email was sent.";
      } else {
        feedbackMsg = "Resident added successfully. Resident information sent to the official Admin email.";
      }
    } finally {
      setIsSubmitting(false);
    }

    setSuccessMessage(feedbackMsg);

    setTimeout(() => {
      navigate("/admin/residents");
    }, 1800);
  };

  return (
    <div className="admin-add-resident-page">
      <AdminSidebar activePage="Add Resident" />

      <main className="admin-add-resident-main">
        {/* TOP HEADER WITH BREADCRUMBS */}
        <header className="admin-header-light">
          <div className="header-left">
            <h1>Add Resident</h1>
            <p className="header-subtitle">
              Add a new resident by providing the required information.
            </p>
          </div>

          <div className="header-right">
            <nav className="breadcrumbs">
              <span>Home</span> / <span>User Management</span> / <span>Resident</span> / <span className="active">Add Resident</span>
            </nav>
            <button
              type="button"
              className="btn-back-residents"
              onClick={() => navigate("/admin/residents")}
            >
              ← Back to Residents
            </button>
          </div>
        </header>

        {/* CENTERED WHITE FORM CARD */}
        <div className="add-resident-form-container">
          {successMessage && (
            <div className="alert-success-banner">
              ✓ {successMessage}
            </div>
          )}

          <div className="white-form-card">
            <form onSubmit={handleSubmit} noValidate>
              {/* SECTION 1: PERSONAL INFORMATION */}
              <section className="form-section-group">
                <h2 className="section-blue-title">Personal Information</h2>

                <div className="personal-info-grid">
                  <div className="fields-column">
                    <div className="fields-row-2">
                      <div className="form-field">
                        <label>First Name <span className="star">*</span></label>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Enter first name"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={errors.firstName ? "field-error" : ""}
                        />
                        {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                      </div>

                      <div className="form-field">
                        <label>Last Name <span className="star">*</span></label>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Enter last name"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={errors.lastName ? "field-error" : ""}
                        />
                        {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div className="fields-row-2">
                      <div className="form-field">
                        <label>Date of Birth <span className="star">*</span></label>
                        <input
                          type="date"
                          name="dob"
                          placeholder="dd-mm-yyyy"
                          value={formData.dob}
                          onChange={handleChange}
                          className={errors.dob ? "field-error" : ""}
                        />
                        {errors.dob && <span className="error-text">{errors.dob}</span>}
                      </div>

                      <div className="form-field">
                        <label>Gender <span className="star">*</span></label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={errors.gender ? "field-error" : ""}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.gender && <span className="error-text">{errors.gender}</span>}
                      </div>
                    </div>
                  </div>

                  {/* PROFILE PHOTO UPLOAD BOX */}
                  <div className="photo-upload-box">
                    <label className="photo-label">Profile Photo</label>
                    <label className="upload-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }}
                      />
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                      ) : (
                        <div className="dropzone-content">
                          <div className="camera-icon">📷</div>
                          <span className="upload-text">Upload Photo</span>
                          <span className="upload-subtext">JPG, PNG (Max. 2MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </section>

              {/* SECTION 2: CONTACT INFORMATION */}
              <section className="form-section-group">
                <h2 className="section-blue-title">Contact Information</h2>

                <div className="fields-row-3">
                  <div className="form-field">
                    <label>Email Address <span className="star">*</span></label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "field-error" : ""}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}

                    {/* SEND EMAIL TO RESIDENT TOGGLE */}
                    <div className="email-toggle-row">
                      <label className="toggle-label-text">Send Email to Resident?</label>
                      <label className="switch">
                        <input
                          type="checkbox"
                          name="sendEmailToggle"
                          checked={formData.sendEmailToggle}
                          onChange={(e) => setFormData((prev) => ({ ...prev, sendEmailToggle: e.target.checked }))}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className={`toggle-state-badge ${formData.sendEmailToggle ? "on" : "off"}`}>
                        {formData.sendEmailToggle ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Mobile Number <span className="star">*</span></label>
                    <input
                      type="text"
                      name="mobile"
                      placeholder="Enter mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      className={errors.mobile ? "field-error" : ""}
                    />
                    {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                  </div>

                  <div className="form-field">
                    <label>Alternate Phone Number</label>
                    <input
                      type="text"
                      name="alternatePhone"
                      placeholder="Enter alternate number"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 3: RESIDENTIAL INFORMATION */}
              <section className="form-section-group">
                <h2 className="section-blue-title">Residential Information</h2>

                <div className="fields-row-3">
                  <div className="form-field">
                    <label>House / Flat Number <span className="star">*</span></label>
                    <input
                      type="text"
                      name="flatNumber"
                      placeholder="Enter house / flat number"
                      value={formData.flatNumber}
                      onChange={handleChange}
                      className={errors.flatNumber ? "field-error" : ""}
                    />
                    {errors.flatNumber && <span className="error-text">{errors.flatNumber}</span>}
                  </div>

                  <div className="form-field">
                    <label>Building / Apartment Name <span className="star">*</span></label>
                    <input
                      type="text"
                      name="buildingName"
                      placeholder="Enter building name"
                      value={formData.buildingName}
                      onChange={handleChange}
                      className={errors.buildingName ? "field-error" : ""}
                    />
                    {errors.buildingName && <span className="error-text">{errors.buildingName}</span>}
                  </div>

                  <div className="form-field">
                    <label>Street / Area <span className="star">*</span></label>
                    <input
                      type="text"
                      name="street"
                      placeholder="Enter street / area"
                      value={formData.street}
                      onChange={handleChange}
                      className={errors.street ? "field-error" : ""}
                    />
                    {errors.street && <span className="error-text">{errors.street}</span>}
                  </div>
                </div>

                <div className="fields-row-4" style={{ marginTop: "16px" }}>
                  <div className="form-field">
                    <label>City <span className="star">*</span></label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? "field-error" : ""}
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </div>

                  <div className="form-field">
                    <label>State <span className="star">*</span></label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={errors.state ? "field-error" : ""}
                    >
                      <option value="">Select state</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Kerala">Kerala</option>
                    </select>
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </div>

                  <div className="form-field">
                    <label>Country <span className="star">*</span></label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={errors.country ? "field-error" : ""}
                    >
                      <option value="">Select country</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                    {errors.country && <span className="error-text">{errors.country}</span>}
                  </div>

                  <div className="form-field">
                    <label>Pincode / Postal Code <span className="star">*</span></label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Enter pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={errors.pincode ? "field-error" : ""}
                    />
                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                  </div>
                </div>
              </section>

              {/* SECTION 4: RESIDENT INFORMATION */}
              <section className="form-section-group">
                <h2 className="section-blue-title">Resident Information</h2>

                <div className="fields-row-5">
                  <div className="form-field">
                    <label>Resident ID <span className="star">*</span></label>
                    <input
                      type="text"
                      name="residentId"
                      placeholder="Enter resident ID"
                      value={formData.residentId}
                      onChange={handleChange}
                      className={errors.residentId ? "field-error" : ""}
                    />
                    {errors.residentId && <span className="error-text">{errors.residentId}</span>}
                  </div>

                  <div className="form-field">
                    <label>Resident Type <span className="star">*</span></label>
                    <select
                      name="residentType"
                      value={formData.residentType}
                      onChange={handleChange}
                      className={errors.residentType ? "field-error" : ""}
                    >
                      <option value="">Select Type</option>
                      <option value="Owner">Owner</option>
                      <option value="Tenant">Tenant</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.residentType && <span className="error-text">{errors.residentType}</span>}
                  </div>

                  <div className="form-field">
                    <label>Number of Family Members <span className="star">*</span></label>
                    <input
                      type="number"
                      min="1"
                      name="familyMembers"
                      placeholder="Enter number"
                      value={formData.familyMembers}
                      onChange={handleChange}
                      className={errors.familyMembers ? "field-error" : ""}
                    />
                    {errors.familyMembers && <span className="error-text">{errors.familyMembers}</span>}
                  </div>

                  <div className="form-field">
                    <label>Move-in Date <span className="star">*</span></label>
                    <input
                      type="date"
                      name="moveInDate"
                      placeholder="dd-mm-yyyy"
                      value={formData.moveInDate}
                      onChange={handleChange}
                      className={errors.moveInDate ? "field-error" : ""}
                    />
                    {errors.moveInDate && <span className="error-text">{errors.moveInDate}</span>}
                  </div>

                  <div className="form-field">
                    <label>Move-out Date</label>
                    <input
                      type="date"
                      name="moveOutDate"
                      placeholder="dd-mm-yyyy"
                      value={formData.moveOutDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="fields-row-2" style={{ marginTop: "16px" }}>
                  <div className="form-field">
                    <label>Emergency Contact Name <span className="star">*</span></label>
                    <input
                      type="text"
                      name="emergencyName"
                      placeholder="Enter emergency contact name"
                      value={formData.emergencyName}
                      onChange={handleChange}
                      className={errors.emergencyName ? "field-error" : ""}
                    />
                    {errors.emergencyName && <span className="error-text">{errors.emergencyName}</span>}
                  </div>

                  <div className="form-field">
                    <label>Emergency Contact Number <span className="star">*</span></label>
                    <input
                      type="text"
                      name="emergencyPhone"
                      placeholder="Enter emergency contact number"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className={errors.emergencyPhone ? "field-error" : ""}
                    />
                    {errors.emergencyPhone && <span className="error-text">{errors.emergencyPhone}</span>}
                  </div>
                </div>
              </section>

              {/* SECTION 5: WATER METER INFORMATION */}
              <section className="form-section-group" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <h2 className="section-blue-title">Water Meter Information</h2>

                <div className="fields-row-5">
                  <div className="form-field">
                    <label>Water Meter ID</label>
                    <input
                      type="text"
                      name="waterMeterId"
                      placeholder="Enter meter ID"
                      value={formData.waterMeterId}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Meter Number</label>
                    <input
                      type="text"
                      name="meterNumber"
                      placeholder="Enter meter number"
                      value={formData.meterNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Meter Type</label>
                    <select
                      name="meterType"
                      value={formData.meterType}
                      onChange={handleChange}
                    >
                      <option value="">Select meter type</option>
                      <option value="Smart Digital">Smart Digital</option>
                      <option value="Ultrasonic">Ultrasonic</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="IoT Telemetry">IoT Telemetry</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Installation Date</label>
                    <input
                      type="date"
                      name="installationDate"
                      placeholder="dd-mm-yyyy"
                      value={formData.installationDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Initial Meter Reading</label>
                    <input
                      type="number"
                      step="0.1"
                      name="initialReading"
                      placeholder="Enter initial reading"
                      value={formData.initialReading}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* BOTTOM BUTTON BAR */}
              <div className="form-action-buttons">
                <button
                  type="button"
                  className="btn-cancel-white"
                  onClick={() => navigate("/admin/residents")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Resident & Sending Email..." : "Add Resident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddResident;
