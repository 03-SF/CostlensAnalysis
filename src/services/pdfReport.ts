import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CalculatedRow, ProjectSummary } from "./calculations";
import { formatCurrency, formatPct } from "./calculations";

type ReportData = {
  projectName: string;
  projectDescription: string;
  createdAt: string;
  generatedAt: string;
  summary: ProjectSummary;
  aiSummary: string | null;
};

export function generatePdfReport(data: ReportData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CostLens Budget Report", margin, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${data.generatedAt}`, margin, y);
  y += 16;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.projectName, margin, y);
  y += 18;

  if (data.projectDescription) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80);
    const descLines = doc.splitTextToSize(data.projectDescription, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 14 + 6;
  }

  doc.setTextColor(60);
  doc.setFontSize(10);
  doc.text(`Project created: ${data.createdAt}`, margin, y);
  y += 6;

  y += 16;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Summary", margin, y);
  y += 16;

  const summaryRows: Array<[string, string]> = [
    ["Total estimated", formatCurrency(data.summary.totals.estimated)],
    ["Total actual", formatCurrency(data.summary.totals.actual)],
    ["Total variance", formatCurrency(data.summary.totals.variance)],
    ["Overall % variance", formatPct(data.summary.totals.pct_variance)],
    ["Cost items", String(data.summary.totals.count)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [31, 111, 159], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 200 } },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Cost items", margin, y);
  y += 10;

  const tableRows: Array<[string, string, string, string, string, string]> = data.summary.rows.map(
    (row: CalculatedRow) => [
      row.category,
      row.description || "—",
      formatCurrency(row.estimated_cost),
      formatCurrency(row.actual_cost),
      formatCurrency(row.variance),
      formatPct(row.pct_variance),
    ]
  );

  autoTable(doc, {
    startY: y,
    head: [["Category", "Description", "Estimated", "Actual", "Variance", "% Var"]],
    body: tableRows,
    foot: [[
      `Total (${data.summary.totals.count})`,
      "",
      formatCurrency(data.summary.totals.estimated),
      formatCurrency(data.summary.totals.actual),
      formatCurrency(data.summary.totals.variance),
      formatPct(data.summary.totals.pct_variance),
    ]],
    theme: "striped",
    headStyles: { fillColor: [31, 111, 159], textColor: 255 },
    footStyles: { fillColor: [245, 245, 245], textColor: [20, 20, 20], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${pageNum}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" }
      );
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  if (data.aiSummary) {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text("AI budget summary", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    const summaryLines = doc.splitTextToSize(data.aiSummary, pageWidth - margin * 2);
    doc.text(summaryLines, margin, y);
  }

  doc.save(`costlens-${data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}
