import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Schedule, AppSettings, User } from '../types';
import { formatDisplayDate, formatDisplayDateTime } from './dateUtils';

interface PDFExportOptions {
  orientation?: 'portrait' | 'landscape';
  filename?: string;
  reportTitle?: string;
  dateRangeLabel?: string;
  settings?: AppSettings;
  currentUser?: User;
}

/**
 * Generates an official, vector-sharp Judicial Cause List PDF document
 * with custom court letterhead, structured auto-table, pagination, and seal block.
 */
export function exportToPDF(
  schedules: Schedule[],
  options: PDFExportOptions = {}
): void {
  const {
    orientation = 'portrait',
    filename,
    reportTitle,
    dateRangeLabel,
    settings,
    currentUser
  } = options;

  const isLandscape = orientation === 'landscape';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const orgName = (settings?.organizationName || 'HIGH COURT & DISTRICT JUDICIARY').toUpperCase();
  const appName = (settings?.applicationName || 'JUSTICE SCHEDULE MANAGEMENT SYSTEM').toUpperCase();
  const repHeader = (reportTitle || settings?.reportHeader || 'OFFICIAL CAUSE LIST & PROCEEDING SCHEDULE').toUpperCase();

  // --- HEADER SECTION ---
  let cursorY = 16;

  // 1. Organization Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(orgName, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5.5;

  // 2. Application Name / Court Branch
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(appName, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  // 3. Official Report Header Box / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(repHeader, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  // 4. Subtitle / Filter Scope (if available)
  if (dateRangeLabel) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`[ ${dateRangeLabel} ]`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4.5;
  }

  // 5. Decorative Double Rule
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 1.2;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 4;

  // 6. Metadata Bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const generatedText = `Generated: ${formatDisplayDateTime(new Date().toISOString())}`;
  const totalText = `Total Listed Matters: ${schedules.length}`;
  const userText = `Officer: ${currentUser?.fullName || currentUser?.username || 'Registrar'}`;

  doc.text(generatedText, margin, cursorY);
  doc.text(totalText, pageWidth / 2, cursorY, { align: 'center' });
  doc.text(userText, pageWidth - margin, cursorY, { align: 'right' });
  cursorY += 4;

  // --- DATA TABLE ---
  const tableHead = [['SL', 'DATE', 'TIME', 'VENUE / COURT', 'CASE PARTICULARS & DESCRIPTION', 'REMARKS / STATUS']];

  const tableBody = schedules.map(s => [
    s.serialNo.toString(),
    formatDisplayDate(s.scheduleDate),
    s.scheduleTime || '-',
    s.venue || '-',
    s.description || '-',
    s.remarks || '-'
  ]);

  // Column widths relative to landscape or portrait
  const colStyles = isLandscape
    ? {
        0: { cellWidth: 16, halign: 'center' as const, fontStyle: 'bold' as const },
        1: { cellWidth: 26, halign: 'center' as const },
        2: { cellWidth: 20, halign: 'center' as const, fontStyle: 'bold' as const },
        3: { cellWidth: 55, fontStyle: 'bold' as const },
        4: { cellWidth: 'auto' as const },
        5: { cellWidth: 45 }
      }
    : {
        0: { cellWidth: 13, halign: 'center' as const, fontStyle: 'bold' as const },
        1: { cellWidth: 23, halign: 'center' as const },
        2: { cellWidth: 18, halign: 'center' as const, fontStyle: 'bold' as const },
        3: { cellWidth: 38, fontStyle: 'bold' as const },
        4: { cellWidth: 'auto' as const },
        5: { cellWidth: 32 }
      };

  autoTable(doc, {
    startY: cursorY,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin, bottom: 20, top: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: 'top',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: colStyles,
    didDrawPage: (data) => {
      // Header on subsequent pages
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`${orgName} — ${repHeader} (Contd.)`, margin, 10);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(margin, 12, pageWidth - margin, 12);
      }

      // Footer
      const footerY = pageHeight - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Confidential Official Judicial Schedule Record', margin, footerY);
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }
  });

  // --- SIGNATURE AND STAMP BLOCK ---
  // Access the final table position
  const finalY = (doc as any).lastAutoTable?.finalY || cursorY + 40;
  const signBlockHeight = 28;

  // If not enough room on current page for signature, add a page
  if (finalY + signBlockHeight > pageHeight - 16) {
    doc.addPage();
    cursorY = 25;
  } else {
    cursorY = finalY + 12;
  }

  const signX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(signX, cursorY + 10, pageWidth - margin, cursorY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Court Registrar / Officer', signX + 30, cursorY + 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(orgName, signX + 30, cursorY + 19, { align: 'center' });

  // Save the PDF file
  const outFilename = filename || `justice_schedule_${Date.now()}.pdf`;
  doc.save(outFilename);
}
