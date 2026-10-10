import React from 'react';
import {
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Schedule, QuickDateFilter } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface ScheduleGridProps {
  schedules: Schedule[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  // Search & Filter state
  searchText: string;
  onSearchTextChange: (val: string) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  venueFilter: string;
  onVenueFilterChange: (val: string) => void;
  quickDateFilter: QuickDateFilter;
  onQuickDateFilterChange: (val: QuickDateFilter) => void;
  onApplySearch: () => void;
  onResetFilters: () => void;

  // Sorting state
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;

  // Row Actions
  onView: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  onPrintRow: (schedule: Schedule) => void;
  onNewSchedule: () => void;

  // Export
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF?: () => void;
}

const VENUE_OPTIONS = [
  'ALL',
  'Court Room No. 1',
  'Court Room No. 2',
  'Court Room No. 3',
  'Chief Justice Chamber',
  'Appellate Bench Room',
  'High Court Division Bench',
  'Special Tribunal Hall',
  'Arbitration & Mediation Chamber',
  'Magistrate Court No. 1',
  'Conference Room'
];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedules,
  totalRecords,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchText,
  onSearchTextChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  venueFilter,
  onVenueFilterChange,
  quickDateFilter,
  onQuickDateFilterChange,
  onApplySearch,
  onResetFilters,
  sortBy,
  sortOrder,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onPrintRow,
  onNewSchedule,
  onExportCSV,
  onExportExcel,
  onExportPDF
}) => {
  const quickFilters: { key: QuickDateFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'thisYear', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' }
  ];

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-500 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-500 font-bold" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Search & Filter Section */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3.5 search-panel">
        {/* Quick Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-md">
            {quickFilters.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onQuickDateFilterChange(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  quickDateFilter === tab.key
                    ? 'bg-[#006FB8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export tools */}
          <div className="flex items-center gap-2">
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export visible schedule records to PDF (.pdf)"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
            )}
            <button
              onClick={onExportCSV}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export visible schedule records to CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={onExportExcel}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export visible schedule records to Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Detailed Search Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Search Text Input */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Search Text
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="search-input-field"
                type="text"
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onApplySearch()}
                placeholder="Serial No, Venue, Description, Remarks..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900"
            />
          </div>

          {/* Venue Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Venue
            </label>
            <select
              value={venueFilter}
              onChange={(e) => onVenueFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900"
            >
              {VENUE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v === 'ALL' ? 'All Venues' : v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Action Buttons & Record Count Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <button
              onClick={onApplySearch}
              className="px-4 py-1.5 text-xs font-bold rounded bg-[#006FB8] hover:bg-[#005a96] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#D5F51F]" />
              <span>Search</span>
            </button>
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded border border-slate-300">
            Total Records: <span className="text-[#006FB8] font-serif font-bold text-sm">{totalRecords}</span>
          </div>
        </div>
      </div>

      {/* Schedule Data Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#022F62] text-slate-100 sticky top-0 z-10 select-none">
            <tr>
              <th
                onClick={() => onSortChange('serialNo')}
                className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#006FB8] transition-colors w-24 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SL No</span>
                  {renderSortIcon('serialNo')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('scheduleDate')}
                className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#006FB8] transition-colors w-28"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {renderSortIcon('scheduleDate')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('scheduleTime')}
                className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#006FB8] transition-colors w-24"
              >
                <div className="flex items-center gap-1">
                  <span>Time</span>
                  {renderSortIcon('scheduleTime')}
                </div>
              </th>

              <th
                onClick={() => onSortChange('venue')}
                className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-[#006FB8] transition-colors w-44"
              >
                <div className="flex items-center gap-1">
                  <span>Venue</span>
                  {renderSortIcon('venue')}
                </div>
              </th>

              <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[200px]">
                Description
              </th>

              <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] w-48">
                Remarks
              </th>

              <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] w-36 text-center action-column">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {schedules.length > 0 ? (
              schedules.map((schedule, idx) => (
                <tr
                  key={schedule.scheduleId}
                  className={`transition-colors hover:bg-[#006FB8]/5 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <td className="py-3 px-3.5 text-center font-serif font-bold text-slate-900">
                    {schedule.serialNo}
                  </td>

                  <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                    {formatDisplayDate(schedule.scheduleDate)}
                  </td>

                  <td className="py-3 px-3.5 font-bold text-[#006FB8] whitespace-nowrap font-mono">
                    {schedule.scheduleTime}
                  </td>

                  <td className="py-3 px-3.5 font-medium text-slate-800">
                    {schedule.venue}
                  </td>

                  <td className="py-3 px-3.5 text-slate-700 leading-relaxed font-normal">
                    <p className="line-clamp-2" title={schedule.description}>
                      {schedule.description}
                    </p>
                  </td>

                  <td className="py-3 px-3.5 text-slate-500 italic text-[11px] leading-relaxed">
                    <p className="line-clamp-2" title={schedule.remarks || ''}>
                      {schedule.remarks || '-'}
                    </p>
                  </td>

                  <td className="py-3 px-3.5 text-center action-column">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(schedule)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEdit(schedule)}
                        className="p-1.5 text-sky-600 hover:text-sky-900 hover:bg-sky-50 rounded transition-colors"
                        title="Edit Schedule Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(schedule)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Schedule Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onPrintRow(schedule)}
                        className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition-colors"
                        title="Print Hearing Order Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <p className="text-sm font-semibold text-slate-700">
                      No schedule records found.
                    </p>
                    <p className="text-xs text-slate-500">
                      There are currently no matters scheduled matching your filter criteria, or the database has not had any schedules entered yet.
                    </p>
                    <button
                      onClick={onNewSchedule}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-400" />
                      <span>+ Add New Schedule</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar */}
      {totalRecords > 0 && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pagination-bar">
          <div className="flex items-center gap-2">
            <span>Show rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Showing {Math.min(totalRecords, (currentPage - 1) * pageSize + 1)} -{' '}
              {Math.min(totalRecords, currentPage * pageSize)} of {totalRecords}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
