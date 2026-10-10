import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Schedule } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface DeleteConfirmModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  schedule,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-lg shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-rose-950 font-serif">
              Confirm Schedule Deletion
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            Are you sure you want to delete this schedule? This action will permanently remove the record from the local database.
          </p>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
            <div>
              <span className="font-semibold text-slate-600">Serial No:</span>{' '}
              <span className="font-bold text-slate-900 font-serif">#{schedule.serialNo}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Date:</span>{' '}
              <span className="font-bold text-amber-900">{formatDisplayDate(schedule.scheduleDate)}</span> at{' '}
              <span className="font-bold text-slate-900">{schedule.scheduleTime}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Venue:</span> {schedule.venue}
            </div>
            <div className="line-clamp-2 text-slate-600 italic mt-1">
              "{schedule.description}"
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
