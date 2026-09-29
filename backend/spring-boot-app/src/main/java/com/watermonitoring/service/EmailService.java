package com.watermonitoring.service;

import com.watermonitoring.dto.resident.ResidentDto;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.Payment;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:watermonitoring1612@gmail.com}")
    private String fromAdminEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired(required = false)
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // =========================================================
    // SEND RESIDENT WELCOME EMAIL
    // =========================================================

    public boolean sendResidentWelcomeEmail(
            ResidentDto resident,
            String temporaryPassword) {

        if (mailSender == null) {

            logger.warn(
                    "[EmailService] JavaMailSender is null. "
                            + "Skipping email notification.");

            return false;
        }

        // IMPORTANT:
        // Send email to the email entered for this resident.
        String targetRecipient = resident.getEmail();

        if (targetRecipient == null
                || targetRecipient.trim().isEmpty()) {

            logger.error(
                    "[EmailService] Resident email is empty. "
                            + "Email cannot be sent.");

            return false;
        }

        targetRecipient = targetRecipient.trim();

        try {

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8");

            // FROM
            helper.setFrom(fromAdminEmail);

            // TO = Resident's email
            helper.setTo(targetRecipient);

            // SUBJECT
            helper.setSubject(
                    "Welcome to Smart Water Usage Monitoring System");

            // EMAIL BODY
            helper.setText(
                    buildHtmlEmailBody(
                            resident,
                            temporaryPassword,
                            frontendUrl
                    ),
                    true
            );

            // SEND
            mailSender.send(message);

            logger.info(
                    "[EmailService] Resident email successfully "
                            + "sent FROM {} TO {}",
                    fromAdminEmail,
                    targetRecipient);

            return true;

        } catch (Exception ex) {

            logger.error(
                    "[EmailService] SMTP error sending email "
                            + "TO {}: {}",
                    targetRecipient,
                    ex.getMessage(),
                    ex);

            return false;
        }
    }

    // =========================================================
    // BUILD EMAIL
    // =========================================================

    private String buildHtmlEmailBody(
            ResidentDto r,
            String temporaryPassword,
            String frontendUrl) {

        String residentFullName =
                r.getFullName() != null
                        ? r.getFullName()
                        : (
                            val(r.getFirstName())
                            + " "
                            + val(r.getLastName())
                          ).trim();

        String loginUrl =
                frontendUrl.endsWith("/")
                        ? frontendUrl + "login"
                        : frontendUrl + "/login";

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='UTF-8'>"

                + "<style>"

                + "body {"
                + "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
                + "background-color: #f8fafc;"
                + "color: #0f172a;"
                + "margin: 0;"
                + "padding: 20px;"
                + "}"

                + ".container {"
                + "max-width: 650px;"
                + "margin: 0 auto;"
                + "background: #ffffff;"
                + "border: 1px solid #e2e8f0;"
                + "border-radius: 12px;"
                + "overflow: hidden;"
                + "box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
                + "}"

                + ".header {"
                + "background: linear-gradient(135deg,#1d4ed8 0%,#0284c7 100%);"
                + "padding: 24px;"
                + "color: #ffffff;"
                + "text-align: center;"
                + "}"

                + ".header h1 {"
                + "margin: 0;"
                + "font-size: 20px;"
                + "font-weight: 800;"
                + "}"

                + ".header p {"
                + "margin: 6px 0 0;"
                + "font-size: 13px;"
                + "opacity: 0.9;"
                + "}"

                + ".body {"
                + "padding: 28px;"
                + "}"

                + ".section-title {"
                + "color: #1d4ed8;"
                + "font-size: 14px;"
                + "font-weight: 700;"
                + "margin-top: 20px;"
                + "margin-bottom: 10px;"
                + "border-bottom: 2px solid #e2e8f0;"
                + "padding-bottom: 4px;"
                + "}"

                + "table {"
                + "width: 100%;"
                + "border-collapse: collapse;"
                + "margin-bottom: 12px;"
                + "}"

                + "td {"
                + "padding: 6px 0;"
                + "font-size: 13px;"
                + "vertical-align: top;"
                + "}"

                + "td.label {"
                + "width: 40%;"
                + "color: #64748b;"
                + "font-weight: 600;"
                + "}"

                + "td.val {"
                + "width: 60%;"
                + "color: #0f172a;"
                + "font-weight: 700;"
                + "}"

                + ".login-box {"
                + "margin-top: 25px;"
                + "padding: 22px;"
                + "background: #eff6ff;"
                + "border: 1px solid #bfdbfe;"
                + "border-radius: 10px;"
                + "}"

                + ".login-title {"
                + "font-size: 16px;"
                + "font-weight: 800;"
                + "color: #1d4ed8;"
                + "margin-bottom: 15px;"
                + "}"

                + ".credential {"
                + "background: #ffffff;"
                + "border: 1px solid #dbeafe;"
                + "border-radius: 7px;"
                + "padding: 10px;"
                + "margin: 7px 0;"
                + "font-size: 13px;"
                + "}"

                + ".button {"
                + "display: inline-block;"
                + "background: linear-gradient(135deg,#1d4ed8 0%,#0284c7 100%);"
                + "color: #ffffff !important;"
                + "text-decoration: none;"
                + "font-size: 14px;"
                + "font-weight: 700;"
                + "padding: 13px 30px;"
                + "border-radius: 8px;"
                + "margin-top: 15px;"
                + "}"

                + ".footer {"
                + "background: #f1f5f9;"
                + "padding: 16px;"
                + "text-align: center;"
                + "font-size: 12px;"
                + "color: #64748b;"
                + "border-top: 1px solid #e2e8f0;"
                + "}"

                + "</style>"
                + "</head>"

                + "<body>"

                + "<div class='container'>"

                // HEADER
                + "<div class='header'>"
                + "<h1>Smart Water Usage Monitoring System</h1>"
                + "<p>Resident Account Created Successfully</p>"
                + "</div>"

                // BODY
                + "<div class='body'>"

                + "<p style='font-size:14px;'>Dear "
                + residentFullName
                + ",</p>"

                + "<p style='font-size:13px;color:#475569;'>"
                + "Your resident account has been successfully "
                + "created by the administrator."
                + "</p>"

                // LOGIN DETAILS
                + "<div class='login-box'>"

                + "<div class='login-title'>"
                + "🔐 YOUR LOGIN DETAILS"
                + "</div>"

                + "<div class='credential'>"
                + "<strong>Email:</strong> "
                + val(r.getEmail())
                + "</div>"

                + "<div class='credential'>"
                + "<strong>Temporary Password:</strong> "
                + temporaryPassword
                + "</div>"

                + "<div style='text-align:center;'>"

                + "<a class='button' href='"
                + loginUrl
                + "' target='_blank'>"
                + "🔐 LOGIN TO RESIDENT PORTAL"
                + "</a>"

                + "</div>"

                + "<p style='font-size:11px;color:#64748b;"
                + "margin-top:15px;text-align:center;'>"
                + "Login URL: "
                + loginUrl
                + "</p>"

                + "</div>"

                // PERSONAL INFORMATION
                + "<div class='section-title'>"
                + "👤 1. PERSONAL INFORMATION"
                + "</div>"

                + "<table>"

                + row("First Name", r.getFirstName())
                + row("Last Name", r.getLastName())
                + row("Date of Birth", r.getDob())
                + row("Gender", r.getGender())

                + "</table>"

                // CONTACT
                + "<div class='section-title'>"
                + "📞 2. CONTACT INFORMATION"
                + "</div>"

                + "<table>"

                + row("Resident Email", r.getEmail())
                + row("Mobile Number", r.getPhone())
                + row("Alternate Phone", r.getAlternatePhone())

                + "</table>"

                // RESIDENTIAL
                + "<div class='section-title'>"
                + "🏠 3. RESIDENTIAL INFORMATION"
                + "</div>"

                + "<table>"

                + row("House / Flat Number", r.getFlatNumber())
                + row("Building / Apartment Name", r.getBuildingName())
                + row("Street / Area", r.getStreet())
                + row(
                        "City, State",
                        val(r.getCity()) + ", " + val(r.getState())
                )
                + row(
                        "Country & Pincode",
                        val(r.getCountry())
                        + " - "
                        + val(r.getPincode())
                )

                + "</table>"

                // RESIDENT DETAILS
                + "<div class='section-title'>"
                + "🪪 4. RESIDENT INFORMATION"
                + "</div>"

                + "<table>"

                + row("Resident ID", r.getResidentIdStr())
                + row("Resident Type", r.getOccupancyStatus())
                + row("Family Members", r.getFamilyMembers())
                + row("Move-in Date", r.getMoveInDate())
                + row("Move-out Date", r.getMoveOutDate())
                + row(
                        "Emergency Contact",
                        val(r.getEmergencyName())
                        + " ("
                        + val(r.getEmergencyPhone())
                        + ")"
                )

                + "</table>"

                // WATER METER
                + "<div class='section-title'>"
                + "💧 5. WATER METER INFORMATION"
                + "</div>"

                + "<table>"

                + row("Water Meter ID", r.getWaterMeterId())
                + row("Meter Number", r.getMeterNumber())
                + row("Meter Type", r.getMeterType())
                + row("Installation Date", r.getInstallationDate())
                + row(
                        "Initial Reading",
                        val(r.getInitialReading()) + " KL"
                )

                + "</table>"

                + "</div>"

                // FOOTER
                + "<div class='footer'>"

                + "<p style='margin:0;'>"
                + "Smart Water Usage Monitoring System"
                + "</p>"

                + "<p style='margin:4px 0 0;font-size:11px;'>"
                + "This email was sent to "
                + val(r.getEmail())
                + "</p>"

                + "</div>"

                + "</div>"

                + "</body>"
                + "</html>";
    }

    // =========================================================
    // HTML TABLE ROW
    // =========================================================

    private String row(String label, String value) {

        return "<tr>"
                + "<td class='label'>"
                + label
                + ":</td>"
                + "<td class='val'>"
                + val(value)
                + "</td>"
                + "</tr>";
    }

    // =========================================================
    // SAFE VALUE
    // =========================================================

    private String val(String str) {

        return (str != null && !str.trim().isEmpty())
                ? str.trim()
                : "-";
    }

    // =========================================================
    // SEND ALERT NOTIFICATION EMAIL
    // =========================================================

    public boolean sendAlertNotificationEmail(
            String recipientEmail,
            String residentName,
            String alertType,
            String title,
            String messageText,
            Double currentValue,
            Double expectedValue,
            Double differenceValue,
            String severity,
            String dateTimeStr) {

        if (mailSender == null) {
            logger.warn("[EmailService] JavaMailSender is null. Skipping alert email for {}", recipientEmail);
            return false;
        }

        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            logger.error("[EmailService] Recipient email is empty. Alert email skipped.");
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAdminEmail);
            helper.setTo(recipientEmail.trim());
            helper.setSubject("🚨 Water System Alert: " + title);

            String bodyHtml = "<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
                    + "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>"
                    + "<div style='background-color: #1e3a8a; color: white; padding: 20px; text-align: center;'>"
                    + "<h2 style='margin:0;'>💧 Smart Water Usage Alert</h2>"
                    + "<p style='margin:5px 0 0; opacity:0.8;'>Severity: " + val(severity) + "</p>"
                    + "</div>"
                    + "<div style='padding: 24px;'>"
                    + "<p>Hello <strong>" + val(residentName) + "</strong>,</p>"
                    + "<p>An automated system alert has been generated for your account:</p>"
                    + "<div style='background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;'>"
                    + "<h3 style='margin:0 0 8px 0; color: #1e293b;'>" + val(title) + "</h3>"
                    + "<p style='margin:0; color: #475569;'>" + val(messageText) + "</p>"
                    + "</div>"
                    + "<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Alert Type:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + val(alertType) + "</td></tr>"
                    + (currentValue != null ? "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Current Recorded Value:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + currentValue + "</td></tr>" : "")
                    + (expectedValue != null ? "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Configured / Expected Threshold:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + expectedValue + "</td></tr>" : "")
                    + (differenceValue != null ? "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Excess Amount / Difference:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #dc2626;'>+" + differenceValue + "</td></tr>" : "")
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Recorded Date & Time:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9;'>" + val(dateTimeStr) + "</td></tr>"
                    + "</table>"
                    + "<p style='margin-top: 20px;'><strong>Recommended Action:</strong> Please check your household water fixtures and review your account details in the Resident Portal.</p>"
                    + "<div style='margin-top: 25px; text-align: center;'>"
                    + "<a href='" + frontendUrl + "' style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Open Resident Portal</a>"
                    + "</div>"
                    + "</div>"
                    + "<div style='background-color: #f1f5f9; color: #64748b; padding: 15px; text-align: center; font-size: 12px;'>"
                    + "<p style='margin:0;'>Water Usage Monitoring System &copy; 2026</p>"
                    + "</div>"
                    + "</div></body></html>";

            helper.setText(bodyHtml, true);
            mailSender.send(mimeMessage);
            logger.info("[EmailService] Alert notification email successfully sent to {}", recipientEmail);
            return true;
        } catch (Exception e) {
            logger.error("[EmailService] Failed to send alert notification email: {}", e.getMessage());
            return false;
        }
    }

    // =========================================================
    // SEND PAYMENT CONFIRMATION EMAIL (WITH INVOICE ATTACHMENT)
    // =========================================================

    /**
     * Sent after a successful payment, from the configured official
     * SMTP/Gmail account, with the PDF invoice attached.
     */
    public boolean sendPaymentConfirmationEmail(
            String recipientEmail,
            String residentName,
            Bill bill,
            Payment payment,
            byte[] invoicePdf) {

        if (mailSender == null) {
            logger.warn("[EmailService] JavaMailSender is null. Skipping payment confirmation email for {}", recipientEmail);
            return false;
        }

        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            logger.error("[EmailService] Recipient email is empty. Payment confirmation email skipped.");
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAdminEmail);
            helper.setTo(recipientEmail.trim());
            helper.setSubject("✅ Payment Confirmed — " + val(bill.getBillNumber()));

            String paidAtStr = payment.getPaidAt() != null
                    ? payment.getPaidAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                    : "-";

            String bodyHtml = "<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
                    + "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>"
                    + "<div style='background-color: #15803d; color: white; padding: 20px; text-align: center;'>"
                    + "<h2 style='margin:0;'>✅ Payment Successful</h2>"
                    + "<p style='margin:5px 0 0; opacity:0.9;'>Aqua Plus — Smart Water Usage Monitoring System</p>"
                    + "</div>"
                    + "<div style='padding: 24px;'>"
                    + "<p>Hello <strong>" + val(residentName) + "</strong>,</p>"
                    + "<p>We've received your payment. Here's a summary — the full invoice is attached as a PDF.</p>"
                    + "<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Bill Number:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + val(bill.getBillNumber()) + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Billing Period:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + val(bill.getBillingMonth()) + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Amount Paid:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #15803d;'>₹" + (payment.getAmount() != null ? payment.getAmount() : bill.getTotalAmount()) + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Payment Method:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + val(payment.getPaymentMethod()) + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;'>Transaction Ref:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;'>" + val(payment.getTransactionRef()) + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; color: #64748b;'>Paid At:</td><td style='padding: 8px 0;'>" + paidAtStr + "</td></tr>"
                    + "</table>"
                    + "<div style='margin-top: 25px; text-align: center;'>"
                    + "<a href='" + frontendUrl + "' style='background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>View Billing History</a>"
                    + "</div>"
                    + "</div>"
                    + "<div style='background-color: #f1f5f9; color: #64748b; padding: 15px; text-align: center; font-size: 12px;'>"
                    + "<p style='margin:0;'>Water Usage Monitoring System &copy; 2026</p>"
                    + "</div>"
                    + "</div></body></html>";

            helper.setText(bodyHtml, true);

            if (invoicePdf != null && invoicePdf.length > 0) {
                helper.addAttachment("Invoice-" + val(bill.getBillNumber()) + ".pdf", new ByteArrayResource(invoicePdf));
            }

            mailSender.send(mimeMessage);
            logger.info("[EmailService] Payment confirmation email with invoice successfully sent to {}", recipientEmail);
            return true;
        } catch (Exception e) {
            logger.error("[EmailService] Failed to send payment confirmation email: {}", e.getMessage(), e);
            return false;
        }
    }

    // =========================================================
    // SEND DOCUMENT VERIFICATION STATUS EMAIL
    // =========================================================

    /**
     * Sent to a resident the moment a Community Admin verifies or rejects one of their
     * uploaded documents. status is "VERIFIED" or "REJECTED"; rejectionReason is only
     * present (and shown) for a rejection.
     */
    public boolean sendDocumentStatusEmail(
            String recipientEmail,
            String residentName,
            String documentType,
            String status,
            String rejectionReason) {

        if (mailSender == null) {
            logger.warn("[EmailService] JavaMailSender is null. Skipping document status email for {}", recipientEmail);
            return false;
        }

        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            logger.error("[EmailService] Recipient email is empty. Document status email skipped.");
            return false;
        }

        boolean verified = "VERIFIED".equals(status);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAdminEmail);
            helper.setTo(recipientEmail.trim());
            helper.setSubject(verified
                    ? "✅ Your document has been verified"
                    : "⚠️ Your document was rejected — action needed");

            String headerColor = verified ? "#15803d" : "#b91c1c";
            String headerTitle = verified ? "✅ Document Verified" : "⚠️ Document Rejected";
            String loginUrl = frontendUrl.endsWith("/") ? frontendUrl + "resident/documents" : frontendUrl + "/resident/documents";

            String bodyHtml = "<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
                    + "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>"
                    + "<div style='background-color: " + headerColor + "; color: white; padding: 20px; text-align: center;'>"
                    + "<h2 style='margin:0;'>" + headerTitle + "</h2>"
                    + "<p style='margin:5px 0 0; opacity:0.9;'>Aqua Plus — Smart Water Usage Monitoring System</p>"
                    + "</div>"
                    + "<div style='padding: 24px;'>"
                    + "<p>Hello <strong>" + val(residentName) + "</strong>,</p>"
                    + (verified
                        ? "<p>Good news — your <strong>" + val(documentType) + "</strong> has been reviewed and verified by your Community Admin. "
                          + "You now have full access to your apartment's water usage, bills, payments and alerts.</p>"
                        : "<p>Your <strong>" + val(documentType) + "</strong> was reviewed by your Community Admin and could not be accepted. "
                          + "Please upload a new, valid document so your residency can be confirmed.</p>")
                    + (!verified && rejectionReason != null && !rejectionReason.isBlank()
                        ? "<div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;'>"
                          + "<strong style='color:#b91c1c;'>Reason given:</strong> <span style='color:#475569;'>" + val(rejectionReason) + "</span>"
                          + "</div>"
                        : "")
                    + "<div style='margin-top: 25px; text-align: center;'>"
                    + "<a href='" + loginUrl + "' style='background-color: " + headerColor + "; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>"
                    + (verified ? "Open Resident Portal" : "Upload a new document") + "</a>"
                    + "</div>"
                    + "</div>"
                    + "<div style='background-color: #f1f5f9; color: #64748b; padding: 15px; text-align: center; font-size: 12px;'>"
                    + "<p style='margin:0;'>Water Usage Monitoring System &copy; 2026</p>"
                    + "</div>"
                    + "</div></body></html>";

            helper.setText(bodyHtml, true);
            mailSender.send(mimeMessage);
            logger.info("[EmailService] Document status ({}) email successfully sent to {}", status, recipientEmail);
            return true;
        } catch (Exception e) {
            logger.error("[EmailService] Failed to send document status email: {}", e.getMessage(), e);
            return false;
        }
    }
}