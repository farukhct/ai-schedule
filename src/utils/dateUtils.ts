import { Schedule, AppSettings } from '../types';

/**
 * Converts a database date string (YYYY-MM-DD or ISO) to display format DD-MM-YYYY
 * Example: '2026-09-23' -> '23-09-2026'
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  return dateStr;
}

/**
 * Converts a display date string (DD-MM-YYYY) back to YYYY-MM-DD for database queries
 */
export function parseDisplayToYmd(displayStr: string): string {
  if (!displayStr) return '';
  const parts = displayStr.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return displayStr;
}

/**
 * Formats ISO string into DD-MM-YYYY HH:MM
 */
export function formatDisplayDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return isoStr;
  }
}

/**
 * Gets today in YYYY-MM-DD format for HTML date inputs
 */
export function getTodayYmd(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Export schedule list to standard CSV file with Court & Application Settings headers
 */
export function exportToCSV(
  schedules: Schedule[],
  filename = 'justice_schedule.csv',
  settings?: AppSettings,
  reportTitle?: string
): void {
  const metaLines: string[] = [];
  if (settings) {
    if (settings.organizationName) {
      metaLines.push(`# COURT / ORGANIZATION: ${settings.organizationName.replace(/[\r\n]+/g, ' ')}`);
    }
    if (settings.reportHeader) {
      metaLines.push(`# OFFICIAL REPORT HEADER: ${settings.reportHeader.replace(/[\r\n]+/g, ' ')}`);
    }
    if (settings.applicationName) {
      metaLines.push(`# SYSTEM: ${settings.applicationName.replace(/[\r\n]+/g, ' ')}`);
    }
  }
  if (reportTitle) {
    metaLines.push(`# REPORT SCOPE / TITLE: ${reportTitle.replace(/[\r\n]+/g, ' ')}`);
  }
  metaLines.push(`# GENERATED ON: ${formatDisplayDateTime(new Date().toISOString())}`);
  metaLines.push(`# TOTAL RECORDS: ${schedules.length}`);
  metaLines.push(''); // Blank separator line before tabular header

  const headers = ['Serial No', 'Date', 'Time', 'Venue', 'Description', 'Remarks', 'Created By', 'Created Date'];
  const rows = schedules.map(s => [
    s.serialNo,
    formatDisplayDate(s.scheduleDate),
    s.scheduleTime,
    `"${(s.venue || '').replace(/"/g, '""')}"`,
    `"${(s.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(s.remarks || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(s.createdBy || '').replace(/"/g, '""')}"`,
    formatDisplayDateTime(s.createdDate)
  ]);

  const csvContent = '\uFEFF' + [...metaLines, headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export schedule list to Excel (.xls HTML table readable by Microsoft Excel offline)
 * with judicial letterhead from Application & Court Settings
 */
export function exportToExcel(
  schedules: Schedule[],
  filename = 'justice_schedule.xls',
  settings?: AppSettings,
  reportTitle?: string
): void {
  const orgName = settings?.organizationName || 'HIGH COURT & DISTRICT JUDICIARY';
  const appName = settings?.applicationName || 'JUSTICE SCHEDULE';
  const repHeader = settings?.reportHeader || 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST';
  const displayTitle = reportTitle || repHeader;

  const rowsHtml = schedules.map(s => `
    <tr>
      <td style="text-align:center; font-weight:bold;">${s.serialNo}</td>
      <td style="text-align:center;">${formatDisplayDate(s.scheduleDate)}</td>
      <td style="text-align:center; font-weight:bold;">${s.scheduleTime}</td>
      <td>${escapeXml(s.venue)}</td>
      <td>${escapeXml(s.description)}</td>
      <td>${escapeXml(s.remarks || '-')}</td>
      <td>${escapeXml(s.createdBy)}</td>
    </tr>
  `).join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Cause List</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .org-header { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
        .app-sub { font-size: 12px; font-weight: 600; text-align: center; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
        .rep-title { font-size: 14px; font-weight: bold; text-align: center; color: #1e293b; margin-bottom: 6px; padding: 4px; background-color: #f1f5f9; border: 1px solid #cbd5e1; }
        .meta-line { font-size: 11px; color: #334155; margin-bottom: 12px; text-align: center; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #94a3b8; font-size: 12px; text-align: center; }
        td { padding: 7px; border: 1px solid #cbd5e1; font-size: 11px; }
        .footer-note { margin-top: 15px; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="org-header">${escapeXml(orgName)}</div>
      <div class="app-sub">${escapeXml(appName)}</div>
      <div class="rep-title">${escapeXml(displayTitle)}</div>
      <div class="meta-line">
        <strong>Report Header:</strong> ${escapeXml(repHeader)} &nbsp;|&nbsp;
        <strong>Generated:</strong> ${formatDisplayDateTime(new Date().toISOString())} &nbsp;|&nbsp;
        <strong>Total Schedules:</strong> ${schedules.length}
      </div>
      <table border="1">
        <thead>
          <tr>
            <th style="width: 60px;">SL NO</th>
            <th style="width: 100px;">DATE</th>
            <th style="width: 80px;">TIME</th>
            <th style="width: 160px;">VENUE</th>
            <th>DESCRIPTION</th>
            <th style="width: 180px;">REMARKS</th>
            <th style="width: 110px;">RECORDED BY</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="7" style="text-align:center; padding:15px; color:#64748b;">No schedule records found.</td></tr>'}
        </tbody>
      </table>
      <div class="footer-note">
        Official Record Generated from ${escapeXml(appName)} · ${escapeXml(orgName)}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export schedule list to formatted Word document (.doc)
 * with judicial letterhead from Application & Court Settings
 */
export function exportToWord(
  schedules: Schedule[],
  filename = 'justice_schedule.doc',
  settings?: AppSettings,
  reportTitle?: string
): void {
  const orgName = settings?.organizationName || 'HIGH COURT & DISTRICT JUDICIARY';
  const appName = settings?.applicationName || 'JUSTICE SCHEDULE';
  const repHeader = settings?.reportHeader || 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST';
  const displayTitle = reportTitle || repHeader;

  const rowsHtml = schedules.map(s => `
    <tr>
      <td style="border:1px solid #94a3b8; padding:6px; text-align:center; font-weight:bold;">${s.serialNo}</td>
      <td style="border:1px solid #94a3b8; padding:6px; text-align:center;">${formatDisplayDate(s.scheduleDate)}</td>
      <td style="border:1px solid #94a3b8; padding:6px; text-align:center; font-weight:bold;">${s.scheduleTime}</td>
      <td style="border:1px solid #94a3b8; padding:6px;">${escapeXml(s.venue)}</td>
      <td style="border:1px solid #94a3b8; padding:6px;">${escapeXml(s.description)}</td>
      <td style="border:1px solid #94a3b8; padding:6px;">${escapeXml(s.remarks || '-')}</td>
    </tr>
  `).join('');

  const content = `
    <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${escapeXml(displayTitle)}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.3; color: #000; }
        .doc-header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        .doc-org { font-size: 16pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #0f172a; }
        .doc-app { font-size: 11pt; font-weight: normal; color: #475569; text-transform: uppercase; margin-top: 2px; }
        .doc-title { font-size: 13pt; font-weight: bold; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
        .doc-badge { display: inline-block; font-size: 10pt; font-weight: bold; background: #e2e8f0; border: 1px solid #94a3b8; padding: 2px 8px; margin-top: 4px; }
        .meta-table { width: 100%; font-size: 9.5pt; font-family: Arial, sans-serif; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
        table.data-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        table.data-table th { border: 1px solid #334155; background: #0f172a; color: #ffffff; padding: 6px; font-weight: bold; font-size: 9.5pt; text-align: center; font-family: Arial, sans-serif; }
        table.data-table td { border: 1px solid #94a3b8; padding: 6px; font-size: 9.5pt; }
        .sign-block { margin-top: 45px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="doc-header">
        <div class="doc-org">${escapeXml(orgName)}</div>
        <div class="doc-app">${escapeXml(appName)}</div>
        <div class="doc-title">${escapeXml(repHeader)}</div>
        ${displayTitle !== repHeader ? `<div class="doc-badge">${escapeXml(displayTitle)}</div>` : ''}
      </div>

      <table class="meta-table" border="0">
        <tr>
          <td><strong>Court / Registry:</strong> ${escapeXml(orgName)}</td>
          <td align="right"><strong>Generated On:</strong> ${formatDisplayDateTime(new Date().toISOString())}</td>
        </tr>
        <tr>
          <td><strong>Report Header:</strong> ${escapeXml(repHeader)}</td>
          <td align="right"><strong>Total Schedules:</strong> ${schedules.length}</td>
        </tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th width="8%">SL NO</th>
            <th width="14%">DATE</th>
            <th width="10%">TIME</th>
            <th width="20%">VENUE</th>
            <th width="32%">DESCRIPTION</th>
            <th width="16%">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="text-align:center; padding:15px; color:#64748b;">No schedule records found.</td></tr>'}
        </tbody>
      </table>

      <div class="sign-block">
        <p>____________________________________________</p>
        <p><strong>Authorized Court Registrar / Officer</strong></p>
        <p style="font-size: 9pt; color: #475569;">${escapeXml(orgName)}</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export schedule list to standalone, self-printing offline HTML document
 */
export function exportToPrintableHtml(
  schedules: Schedule[],
  filename = 'justice_schedule_print.html',
  settings?: AppSettings,
  reportTitle?: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): void {
  const orgName = settings?.organizationName || 'HIGH COURT & DISTRICT JUDICIARY';
  const appName = settings?.applicationName || 'JUSTICE SCHEDULE';
  const repHeader = settings?.reportHeader || 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST';
  const displayTitle = reportTitle || repHeader;

  const rowsHtml = schedules.map(s => `
    <tr>
      <td style="border:1px solid #1e293b; padding:6px 8px; text-align:center; font-weight:bold;">${s.serialNo}</td>
      <td style="border:1px solid #1e293b; padding:6px 8px; text-align:center;">${formatDisplayDate(s.scheduleDate)}</td>
      <td style="border:1px solid #1e293b; padding:6px 8px; text-align:center; font-weight:bold;">${s.scheduleTime}</td>
      <td style="border:1px solid #1e293b; padding:6px 8px; font-weight:600;">${escapeXml(s.venue)}</td>
      <td style="border:1px solid #1e293b; padding:6px 8px;">${escapeXml(s.description)}</td>
      <td style="border:1px solid #1e293b; padding:6px 8px;">${escapeXml(s.remarks || '-')}</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(orgName)} - ${escapeXml(displayTitle)}</title>
  <style>
    @page {
      size: ${orientation};
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 16px;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .org-title {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .app-title {
      font-size: 11pt;
      color: #334155;
      text-transform: uppercase;
      margin-top: 2px;
      font-family: Arial, sans-serif;
    }
    .report-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 6px;
      padding: 4px 12px;
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
    }
    .meta-bar {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #475569;
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      font-family: Arial, sans-serif;
      font-size: 8.5pt;
    }
    tr {
      page-break-inside: avoid;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #0f172a !important;
      color: #ffffff !important;
      border: 1px solid #000000;
      padding: 6px 8px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #64748b;
      vertical-align: top;
    }
    .sign-block {
      margin-top: 40px;
      text-align: right;
      page-break-inside: avoid;
      font-family: Georgia, serif;
    }
    .no-print-bar {
      background: #0f172a;
      color: white;
      padding: 10px 16px;
      margin: -16px -16px 16px -16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    .btn-print {
      background: #f59e0b;
      color: #000;
      font-weight: bold;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="no-print-bar">
    <span>OFFICIAL COURT CAUSE LIST - DIRECT PRINT VIEW</span>
    <button class="btn-print" onclick="window.print()">PRINT NOW (Ctrl + P)</button>
  </div>
  <div class="header-box">
    <div class="org-title">${escapeXml(orgName)}</div>
    <div class="app-title">${escapeXml(appName)}</div>
    <div class="report-title">${escapeXml(displayTitle)}</div>
  </div>
  <div class="meta-bar">
    <span>Total Matters: <strong>${schedules.length}</strong></span>
    <span>Generated: <strong>${formatDisplayDateTime(new Date().toISOString())}</strong></span>
    <span>Court: <strong>${escapeXml(orgName)}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50px;">SL NO</th>
        <th style="width: 100px;">DATE</th>
        <th style="width: 80px;">TIME</th>
        <th style="width: 170px;">COURT / VENUE</th>
        <th>CASE PARTICULARS & DESCRIPTION</th>
        <th style="width: 140px;">STATUS / REMARKS</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="sign-block">
    <p>___________________________________________</p>
    <p><strong>Authorized Court Registrar / Officer</strong></p>
    <p style="font-size: 9pt; color: #475569;">${escapeXml(orgName)}</p>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
