package com.watermonitoring.dto.auth;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public class RegisterRequest {
    // Optional — account creation only needs email + password; when
    // omitted, a display name is derived from the email (see AuthService).
    private String fullName;
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    private String phone;
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    private String apartmentNumber;
    private String buildingName;
    private String role; // "ROLE_RESIDENT" (default), "ROLE_PROPERTY_ADMIN"
    public RegisterRequest() {}
    public RegisterRequest(String fullName, String email, String phone, String password, String apartmentNumber, String buildingName, String role) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.apartmentNumber = apartmentNumber;
        this.buildingName = buildingName;
        this.role = role;
    }

    // Getters and Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getApartmentNumber() { return apartmentNumber; }
    public void setApartmentNumber(String apartmentNumber) { this.apartmentNumber = apartmentNumber; }
    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
