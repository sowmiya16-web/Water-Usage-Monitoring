import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Shared tabular PDF report generator — used by every billing/payment
// history and report page. All billing documents, receipts, invoices,
// and payment reports are PDF only; there is no CSV/Excel export
// anywhere in this app.
export function exportTableAsPdf({ title, subtitle, headers, rows, filename }) {
  const doc = new jsPDF({ orientation: rows.length && headers.length > 6 ? "landscape" : "portrait" });

  doc.setFontSize(16);
  doc.setTextColor(29, 78, 216);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 25);
  }

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 31 : 25);

  autoTable(doc, {
    startY: subtitle ? 36 : 30,
    head: [headers],
    body: rows,
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
