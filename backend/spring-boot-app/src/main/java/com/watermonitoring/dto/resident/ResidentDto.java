package com.watermonitoring.dto.resident;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResidentDto {

    private Long residentId;

    // Section 1: Personal Information
    private String firstName;
    private String lastName;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String dob;
    private String gender;

    // Section 2: Contact Information
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String alternatePhone;

    // Section 3: Residential Information
    private String flatNumber;

    @NotBlank(message = "Building name is required")
    private String buildingName;

    private String apartmentNumber;
    private String street;
    private String city;
    private String state;
    private String country;
    private String pincode;

    // Section 4: Resident Details
    private String residentIdStr;
    private String occupancyStatus; // Resident Type (Owner, Tenant, etc.)
    private String familyMembers;
    private String moveInDate;
    private String moveOutDate;
    private String emergencyName;
    private String emergencyPhone;

    // Section 5: Water Meter Information
    private String waterMeterId;
    private String meterNumber;
    private String meterType;
    private String installationDate;
    private String initialReading;

    // Email Dispatch Control & Status
    private Boolean sendEmail = true;
    private Boolean emailSent;

    public ResidentDto() {}

    public ResidentDto(Long residentId, String fullName, String email, String phone, String apartmentNumber, String buildingName, String occupancyStatus) {
        this.residentId = residentId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.apartmentNumber = apartmentNumber;
        this.buildingName = buildingName;
        this.occupancyStatus = occupancyStatus;
    }

    // Getters and Setters
    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFullName() {
        if (fullName == null || fullName.isBlank()) {
            if (firstName != null && lastName != null) {
                return firstName + " " + lastName;
            }
        }
        return fullName;
    }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public String getApartmentNumber() {
        if (apartmentNumber == null || apartmentNumber.isBlank()) {
            return flatNumber;
        }
        return apartmentNumber;
    }
    public void setApartmentNumber(String apartmentNumber) { this.apartmentNumber = apartmentNumber; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getResidentIdStr() { return residentIdStr; }
    public void setResidentIdStr(String residentIdStr) { this.residentIdStr = residentIdStr; }

    public String getOccupancyStatus() { return occupancyStatus; }
    public void setOccupancyStatus(String occupancyStatus) { this.occupancyStatus = occupancyStatus; }

    public String getFamilyMembers() { return familyMembers; }
    public void setFamilyMembers(String familyMembers) { this.familyMembers = familyMembers; }

    public String getMoveInDate() { return moveInDate; }
    public void setMoveInDate(String moveInDate) { this.moveInDate = moveInDate; }

    public String getMoveOutDate() { return moveOutDate; }
    public void setMoveOutDate(String moveOutDate) { this.moveOutDate = moveOutDate; }

    public String getEmergencyName() { return emergencyName; }
    public void setEmergencyName(String emergencyName) { this.emergencyName = emergencyName; }

    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }

    public String getWaterMeterId() { return waterMeterId; }
    public void setWaterMeterId(String waterMeterId) { this.waterMeterId = waterMeterId; }

    public String getMeterNumber() { return meterNumber; }
    public void setMeterNumber(String meterNumber) { this.meterNumber = meterNumber; }

    public String getMeterType() { return meterType; }
    public void setMeterType(String meterType) { this.meterType = meterType; }

    public String getInstallationDate() { return installationDate; }
    public void setInstallationDate(String installationDate) { this.installationDate = installationDate; }

    public String getInitialReading() { return initialReading; }
    public void setInitialReading(String initialReading) { this.initialReading = initialReading; }

    public Boolean getSendEmail() { return sendEmail; }
    public void setSendEmail(Boolean sendEmail) { this.sendEmail = sendEmail; }

    public Boolean getEmailSent() { return emailSent; }
    public void setEmailSent(Boolean emailSent) { this.emailSent = emailSent; }
}
