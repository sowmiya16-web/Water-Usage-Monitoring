package com.watermonitoring.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.watermonitoring.entity.Apartment;
import com.watermonitoring.entity.Bill;
import com.watermonitoring.entity.Payment;
import com.watermonitoring.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * InvoiceService — Renders a simple PDF invoice/receipt for a successful
 * payment, attached to the payment-confirmation email.
 */
@Service
public class InvoiceService {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public byte[] generateInvoicePdf(Bill bill, Payment payment, Apartment apartment, User resident) {
        try {
            Document document = new Document(PageSize.A4, 40, 40, 50, 50);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(29, 78, 216));
            Font subtitleFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(100, 116, 139));
            Font sectionFont = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(29, 78, 216));
            Font labelFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(100, 116, 139));
            Font valueFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);
            Font totalFont = new Font(Font.HELVETICA, 14, Font.BOLD, new Color(21, 128, 61));

            document.add(new Paragraph("Aqua Plus — Smart Water Usage Monitoring System", titleFont));
            document.add(new Paragraph("Payment Invoice / Receipt", subtitleFont));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Bill & Payment Details", sectionFont));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.2f, 2f});

            addRow(table, "Invoice / Bill Number", bill.getBillNumber(), labelFont, valueFont);
            addRow(table, "Billing Period", bill.getBillingMonth(), labelFont, valueFont);
            addRow(table, "Apartment", apartment != null ? (apartment.getApartmentNumber() + ", " + apartment.getBuildingName()) : "-", labelFont, valueFont);
            addRow(table, "Resident", resident != null ? resident.getFullName() : "-", labelFont, valueFont);
            addRow(table, "Consumption", (bill.getConsumptionKl() != null ? bill.getConsumptionKl() : 0) + " kL", labelFont, valueFont);
            addRow(table, "Volumetric Charge", formatInr(bill.getVolumetricAmount()), labelFont, valueFont);
            addRow(table, "Base Charge", formatInr(bill.getBaseCharge()), labelFont, valueFont);
            addRow(table, "Common Water Charge", formatInr(bill.getCommonWaterCharge()), labelFont, valueFont);
            addRow(table, "GST", formatInr(bill.getGstAmount()), labelFont, valueFont);
            addRow(table, "Total Bill Amount", formatInr(bill.getTotalAmount()), labelFont, valueFont);

            document.add(table);
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("Payment Confirmation", sectionFont));
            document.add(Chunk.NEWLINE);

            PdfPTable payTable = new PdfPTable(2);
            payTable.setWidthPercentage(100);
            payTable.setWidths(new float[]{1.2f, 2f});

            addRow(payTable, "Transaction Reference", payment.getTransactionRef(), labelFont, valueFont);
            addRow(payTable, "Payment Method", payment.getPaymentMethod(), labelFont, valueFont);
            addRow(payTable, "Payment Status", payment.getStatus(), labelFont, valueFont);
            addRow(payTable, "Paid At", payment.getPaidAt() != null ? payment.getPaidAt().format(DATE_FMT) : "-", labelFont, valueFont);

            document.add(payTable);
            document.add(Chunk.NEWLINE);

            Paragraph totalPaid = new Paragraph("Amount Paid: " + formatInr(payment.getAmount()), totalFont);
            totalPaid.setAlignment(Element.ALIGN_RIGHT);
            document.add(totalPaid);

            document.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph(
                    "This is a system-generated invoice and does not require a signature. "
                            + "For questions, contact your community administrator.",
                    subtitleFont);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            logger.error("[InvoiceService] Failed to generate invoice PDF for bill {}: {}", bill.getBillNumber(), e.getMessage(), e);
            return null;
        }
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setBorderColor(new Color(226, 232, 240));
        labelCell.setPadding(6);

        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(new Color(226, 232, 240));
        valueCell.setPadding(6);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatInr(Double value) {
        return value != null ? String.format("Rs. %.2f", value) : "-";
    }
}
