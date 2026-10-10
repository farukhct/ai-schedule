import React from 'react';
import { X, Printer, Calendar, Clock, Building2, User, FileText, CheckCircle2 } from 'lucide-react';
import { Schedule } from '../types';
import { formatDisplayDate, formatDisplayDateTime } from '../utils/dateUtils';

interface ViewModalProps {
  schedule: Schedule | null;
  onClose: () => void;
  onPrint: (schedule: Schedule) => void;
}

export const ViewModal: React.FC<ViewModalProps> = ({ schedule, onClose, onPrint }) => {
  if (!schedule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
              #{schedule.serialNo}
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">Justice Schedule Record</h3>
              <p className="text-[11px] text-slate-300">Official Court Proceeding Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Key Facts Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Serial No
              </span>
              <span className="text-base font-bold text-slate-900 font-serif">
                {schedule.serialNo}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Date (DD-MM-YYYY)
              </span>
              <span className="text-sm font-bold text-amber-900">
                {formatDisplayDate(schedule.scheduleDate)}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Time
              </span>
              <span className="text-sm font-bold text-slate-800">
                {schedule.scheduleTime}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Venue
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate block">
                {schedule.venue}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Matter Description & Cause Details</span>
            </h4>
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {schedule.description}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Judicial Remarks / Bench Notes
            </h4>
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap">
              {schedule.remarks || 'No remarks recorded.'}
            </div>
          </div>

          {/* Audit Information */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Created By:</span> {schedule.createdBy} (
              {formatDisplayDateTime(schedule.createdDate)})
            </div>
            {schedule.updatedBy && (
              <div>
                <span className="font-semibold text-slate-700">Last Updated By:</span> {schedule.updatedBy} (
                {formatDisplayDateTime(schedule.updatedDate)})
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onPrint(schedule)}
            className="px-4 py-2 text-xs font-bold rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Hearing Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
