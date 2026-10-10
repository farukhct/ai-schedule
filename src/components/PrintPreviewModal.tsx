import React, { useState, useEffect } from 'react';
import { Printer, X, FileSpreadsheet, FileText, ArrowLeft, FileDown, Scale, Check, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { Schedule, AppSettings, User } from '../types';
import { formatDisplayDate, formatDisplayDateTime, exportToCSV, exportToExcel, exportToWord, exportToPrintableHtml } from '../utils/dateUtils';
import { exportToPDF } from '../utils/pdfExport';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  reportTitle?: string;
  dateRangeLabel?: string;
  settings: AppSettings;
  currentUser: User;
  singleSchedule?: Schedule | null;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  schedules,
  reportTitle = 'OFFICIAL CAUSE LIST & PROCEEDING SCHEDULE',
  dateRangeLabel,
  settings,
  currentUser,
  singleSchedule
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    settings.defaultPrintOrientation || 'portrait'
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const dataToPrint = singleSchedule ? [singleSchedule] : schedules;
  const isSingle = !!singleSchedule;

  const handleExportPDF = () => {
    try {
      const sanitizeName = (reportTitle || 'cause_list')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 30);
      const pdfFilename = `justice_${sanitizeName}_${Date.now()}.pdf`;

      exportToPDF(dataToPrint, {
        orientation,
        filename: pdfFilename,
        reportTitle,
        dateRangeLabel,
        settings,
        currentUser
      });

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const handleDirectPrint = () => {
    try {
      setIsPrinting(true);
      setPrintFeedback(null);

      // 1. Inject or update dynamic page orientation rule for print
      let styleEl = document.getElementById('justice-schedule-print-page-style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'justice-schedule-print-page-style';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `@media print { @page { size: ${orientation}; margin: 12mm 10mm 15mm 10mm; } }`;

      // 2. Set temporary title so printer dialog and Save as PDF use official report name
      const originalTitle = document.title;
      document.title = `${settings.organizationName || 'Court'} - ${reportTitle}`;

      // 3. Trigger native print dialog
      window.print();

      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3500);
      setIsPrinting(false);

      // Restore original page title
      setTimeout(() => {
        document.title = originalTitle;
      }, 1200);
    } catch (err: any) {
      console.warn('Native window.print() was blocked or failed:', err);
      setIsPrinting(false);
      // Auto-fallback to PDF export so the user gets their document without disruption
      handleExportPDF();
      setPrintFeedback(
        'Direct printer was restricted by browser iframe. A vector .pdf document has been generated and downloaded for you.'
      );
    }
  };

  // Keyboard shortcut Ctrl+P / Cmd+P to directly print from preview modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, orientation, reportTitle, settings, dataToPrint]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print-modal-overlay">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-5xl my-4 overflow-hidden flex flex-col max-h-[92vh] print-modal-content">
        {/* Modal Controls Toolbar (Hidden in browser print) */}
        <div className="px-5 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Back (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold font-serif">Print Preview</h3>
              <p className="text-[11px] text-slate-300">
                Official Judicial Cause List Document · {dataToPrint.length} Record(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation selector */}
            <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  orientation === 'portrait' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Print vertically (Standard A4 / Letter)"
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  orientation === 'landscape' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Print horizontally (Wide Table format)"
              >
                Landscape
              </button>
            </div>

            {/* Quick Export actions */}
            <button
              onClick={() => exportToCSV(dataToPrint, 'justice_schedule_report.csv', settings, reportTitle)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Export as CSV file"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => exportToExcel(dataToPrint, 'justice_schedule_report.xls', settings, reportTitle)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Export as Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => exportToWord(dataToPrint, 'justice_schedule_report.doc', settings, reportTitle)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Export as Word document"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* Standalone HTML Print Slip */}
            <button
              onClick={() => exportToPrintableHtml(dataToPrint, 'justice_schedule_print.html', settings, reportTitle, orientation)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Download standalone auto-printing HTML file"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">HTML Slip</span>
            </button>

            {/* Export as .PDF button */}
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Generate and download official vector .PDF document"
            >
              {pdfSuccess ? (
                <Check className="w-3.5 h-3.5 text-rose-200" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{pdfSuccess ? 'PDF Downloaded!' : 'Export as .PDF'}</span>
            </button>

            {/* Direct to Printer Trigger */}
            <button
              onClick={handleDirectPrint}
              disabled={isPrinting}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Send directly to printer or system print spooler (Ctrl + P)"
            >
              {printSuccess ? (
                <Check className="w-4 h-4 text-emerald-950" />
              ) : (
                <Printer className="w-4 h-4 text-slate-950" />
              )}
              <span>
                {isPrinting ? 'Printing...' : printSuccess ? 'Sent to Printer!' : 'Print Directly'}
              </span>
              <span className="hidden md:inline text-[10px] font-mono px-1 py-0.5 bg-amber-600/30 text-slate-950 rounded font-bold ml-0.5">
                Ctrl+P
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors ml-1"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser iframe sandbox notice if window.print was restricted */}
        {printFeedback && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{printFeedback}</span>
            </div>
            <button
              onClick={() => setPrintFeedback(null)}
              className="text-amber-700 hover:text-amber-900 text-xs font-bold underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable Document Paper Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200/60 p-4 sm:p-8 print-scroll-container">
          <div
            id="printable-schedule-document"
            className={`printable-area mx-auto bg-white p-8 sm:p-12 shadow-md border border-slate-300 text-black font-serif ${
              orientation === 'landscape' ? 'max-w-[1100px]' : 'max-w-[850px]'
            }`}
          >
            {/* Formal Judicial Letterhead Header from Application & Court Settings */}
            <div className="text-center pb-5 mb-6 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Scale className="w-7 h-7 text-slate-900" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase font-serif text-slate-950">
                  {settings.organizationName || 'HIGH COURT & DISTRICT JUDICIARY'}
                </h1>
              </div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 font-sans">
                {settings.applicationName || 'JUSTICE SCHEDULE'}
              </div>
              
              {/* Official Report Header from Settings */}
              <div className="mt-3 inline-block">
                <div className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 font-serif border-y-2 border-slate-900 py-1 px-6 bg-slate-50">
                  {settings.reportHeader || 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST'}
                </div>
              </div>

              {/* Sub-report category / Scope badge (if distinct from report header) */}
              {reportTitle && reportTitle.toUpperCase() !== (settings.reportHeader || '').toUpperCase() && (
                <div className="mt-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900 bg-slate-100 py-0.5 px-3 inline-block rounded border border-slate-300">
                    {reportTitle}
                  </span>
                </div>
              )}
            </div>

            {/* Report Metadata Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-sans mb-5 pb-3 border-b border-slate-300 text-slate-800">
              <div>
                <span className="font-bold text-slate-900">Court / Organization:</span>{' '}
                {settings.organizationName || 'Judicial Chamber'}
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">Report Date:</span>{' '}
                {formatDisplayDate(new Date().toISOString())}
              </div>
              <div>
                <span className="font-bold text-slate-900">Official Report:</span>{' '}
                {settings.reportHeader || 'Cause List'}
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">Generated On:</span>{' '}
                {formatDisplayDateTime(new Date().toISOString())}
              </div>
              <div>
                <span className="font-bold text-slate-900">Period / Scope:</span>{' '}
                {dateRangeLabel || 'All Listed Dates'}
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">Authorized User:</span>{' '}
                {currentUser.fullName} ({currentUser.role})
              </div>
            </div>

            {/* Table or Single Item Sheet */}
            {!isSingle ? (
              <div>
                <table className="w-full border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950">
                      <th className="border border-slate-400 p-2 text-center w-12 font-bold uppercase text-[11px]">
                        SL
                      </th>
                      <th className="border border-slate-400 p-2 text-center w-24 font-bold uppercase text-[11px]">
                        DATE
                      </th>
                      <th className="border border-slate-400 p-2 text-center w-20 font-bold uppercase text-[11px]">
                        TIME
                      </th>
                      <th className="border border-slate-400 p-2 text-left w-36 font-bold uppercase text-[11px]">
                        VENUE
                      </th>
                      <th className="border border-slate-400 p-2 text-left font-bold uppercase text-[11px]">
                        DESCRIPTION
                      </th>
                      <th className="border border-slate-400 p-2 text-left w-40 font-bold uppercase text-[11px]">
                        REMARKS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataToPrint.length > 0 ? (
                      dataToPrint.map((item, index) => (
                        <tr key={item.scheduleId} className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="border border-slate-300 p-2 text-center font-serif font-bold text-slate-900">
                            {item.serialNo}
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-medium whitespace-nowrap">
                            {formatDisplayDate(item.scheduleDate)}
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-bold">
                            {item.scheduleTime}
                          </td>
                          <td className="border border-slate-300 p-2 font-medium">
                            {item.venue}
                          </td>
                          <td className="border border-slate-300 p-2 leading-relaxed">
                            {item.description}
                          </td>
                          <td className="border border-slate-300 p-2 text-slate-600 italic">
                            {item.remarks || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 p-6 text-center text-slate-500 italic">
                          No schedule records found matching the specified report criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Report Summary Footnote */}
                <div className="mt-5 pt-3 border-t border-slate-300 flex items-center justify-between text-xs font-sans text-slate-800">
                  <div className="font-bold">
                    Total Schedules Listed: {dataToPrint.length}
                  </div>
                  <div>
                    Official Judicial Record · {settings.applicationName || 'Justice Schedule'} · {settings.organizationName || 'Judiciary'}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Hearing Slip / Matter Notice */
              <div className="space-y-4 font-sans text-xs">
                <div className="bg-slate-50 p-4 rounded border border-slate-300 grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-600 uppercase block text-[10px]">Serial No</span>
                    <span className="text-base font-bold text-slate-900 font-serif">#{singleSchedule.serialNo}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 uppercase block text-[10px]">Hearing Date</span>
                    <span className="text-base font-bold text-slate-900">{formatDisplayDate(singleSchedule.scheduleDate)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 uppercase block text-[10px]">Hearing Time</span>
                    <span className="text-base font-bold text-slate-900">{singleSchedule.scheduleTime}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 uppercase block text-[10px]">Assigned Venue</span>
                    <span className="text-base font-bold text-slate-900">{singleSchedule.venue}</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded p-4 space-y-1">
                  <span className="font-bold text-slate-700 uppercase block text-[10px]">Matter Particulars / Cause Description</span>
                  <p className="text-sm leading-relaxed text-slate-950 font-serif whitespace-pre-wrap">
                    {singleSchedule.description}
                  </p>
                </div>

                <div className="border border-slate-300 rounded p-4 space-y-1">
                  <span className="font-bold text-slate-700 uppercase block text-[10px]">Bench Directions & Remarks</span>
                  <p className="text-xs leading-relaxed text-slate-700 italic whitespace-pre-wrap">
                    {singleSchedule.remarks || 'None recorded.'}
                  </p>
                </div>
              </div>
            )}

            {/* Official Judicial Sign-off Stamp Area */}
            <div className="mt-14 pt-8 border-t border-slate-400 flex items-end justify-between text-xs font-sans">
              <div className="text-slate-600">
                <p>Computer-generated official offline court record.</p>
                <p className="text-[10px]">
                  {settings.applicationName || 'Justice Schedule'} · {settings.organizationName || 'Judiciary'} · Verified by {currentUser.username}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="w-56 border-b border-slate-900 mb-1 ml-auto"></div>
                <p className="font-bold text-slate-950">Bench Clerk / Registrar</p>
                <p className="text-[11px] text-slate-600">{settings.organizationName || 'Authorized Officer'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
