import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Check, X, RotateCcw, AlertTriangle, Building2, Calendar, Clock, FileText, MessageSquare } from 'lucide-react';
import { Schedule } from '../types';
import { formatDisplayDate, getTodayYmd } from '../utils/dateUtils';

interface ScheduleFormProps {
  editingSchedule: Schedule | null;
  nextSerialNo: number;
  onSaveNew: (formData: Partial<Schedule>) => Promise<boolean>;
  onUpdate: (id: number, formData: Partial<Schedule>) => Promise<boolean>;
  onClear: () => void;
  onCancel: () => void;
  onRequestNextSerial: () => void;
}

const COMMON_VENUES = [
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

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  editingSchedule,
  nextSerialNo,
  onSaveNew,
  onUpdate,
  onClear,
  onCancel,
  onRequestNextSerial
}) => {
  const [serialNo, setSerialNo] = useState<number>(nextSerialNo);
  const [scheduleDate, setScheduleDate] = useState<string>(getTodayYmd());
  const [scheduleTime, setScheduleTime] = useState<string>('10:00');
  const [venue, setVenue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  // Sync state when editingSchedule changes or nextSerialNo updates
  useEffect(() => {
    if (editingSchedule) {
      setSerialNo(editingSchedule.serialNo);
      setScheduleDate(editingSchedule.scheduleDate);
      setScheduleTime(editingSchedule.scheduleTime);
      setVenue(editingSchedule.venue);
      setDescription(editingSchedule.description);
      setRemarks(editingSchedule.remarks || '');
      setValidationErrors({});
      setDuplicateWarning(null);
    } else {
      setSerialNo(nextSerialNo);
      setScheduleDate(getTodayYmd());
      setScheduleTime('10:00');
      setVenue('');
      setDescription('');
      setRemarks('');
      setValidationErrors({});
      setDuplicateWarning(null);
    }
  }, [editingSchedule, nextSerialNo]);

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!serialNo || isNaN(serialNo)) {
      errors.serialNo = 'Serial number is required.';
    }
    if (!scheduleDate) {
      errors.scheduleDate = 'Date is required.';
    }
    if (!scheduleTime) {
      errors.scheduleTime = 'Time is required.';
    }
    if (!venue.trim()) {
      errors.venue = 'Venue is required.';
    }
    if (!description.trim()) {
      errors.description = 'Description is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewClick = () => {
    onClear();
    onRequestNextSerial();
    setScheduleDate(getTodayYmd());
    setScheduleTime('10:00');
    setVenue('');
    setDescription('');
    setRemarks('');
    setValidationErrors({});
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent, forceDuplicate = false) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Check for duplicates if not forced
      if (!forceDuplicate) {
        const dupCheckRes = await fetch('/api/schedules/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleDate,
            scheduleTime,
            venue,
            excludeId: editingSchedule ? editingSchedule.scheduleId : null
          })
        });
        const dupData = await dupCheckRes.json();

        if (dupData.isDuplicate) {
          setDuplicateWarning(dupData.existingRecord);
          setIsSubmitting(false);
          return;
        }
      }

      setDuplicateWarning(null);

      const payload: Partial<Schedule> = {
        serialNo: Number(serialNo),
        scheduleDate,
        scheduleTime,
        venue: venue.trim(),
        description: description.trim(),
        remarks: remarks.trim()
      };

      let success = false;
      if (editingSchedule) {
        success = await onUpdate(editingSchedule.scheduleId, payload);
      } else {
        success = await onSaveNew(payload);
        if (success) {
          handleNewClick();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!editingSchedule;

  return (
    <div id="schedule-entry-form" className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden form-container">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-serif">
            {isEditing ? `Edit Schedule (SL #${editingSchedule.serialNo})` : 'Schedule Entry Form'}
          </h3>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Date Format: <span className="font-semibold text-slate-700">DD-MM-YYYY</span>
        </div>
      </div>

      {duplicateWarning && (
        <div className="m-5 p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm">Potential Duplicate Warning</p>
            <p className="mt-1 leading-relaxed">
              A similar schedule already exists at <strong>{duplicateWarning.venue}</strong> on{' '}
              <strong>{formatDisplayDate(duplicateWarning.scheduleDate)}</strong> at{' '}
              <strong>{duplicateWarning.scheduleTime}</strong> (SL #{duplicateWarning.serialNo}).
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition-colors"
              >
                Yes, Continue & Save
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-medium rounded text-xs transition-colors"
              >
                Cancel / Modify
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="p-5 space-y-4">
        {/* First Row: Serial No, Date, Time, Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SERIAL NO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Serial No <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={serialNo}
              readOnly={isEditing}
              onChange={(e) => setSerialNo(parseInt(e.target.value, 10))}
              className={`w-full px-3 py-2 text-xs rounded border transition-colors ${
                isEditing
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-300 font-bold'
                  : 'bg-white text-slate-900 border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
              } ${validationErrors.serialNo ? 'border-rose-400 bg-rose-50' : ''}`}
              title={isEditing ? 'Serial number cannot be modified' : 'Auto-generated serial number'}
            />
            {validationErrors.serialNo && (
              <p className="text-[11px] text-rose-600 mt-1">{validationErrors.serialNo}</p>
            )}
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {isEditing ? 'Protected / Read-only' : 'Auto-assigned numeric ID'}
            </span>
          </div>

          {/* DATE (DD-MM-YYYY display throughout, standard picker input) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Date <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {formatDisplayDate(scheduleDate) || 'DD-MM-YYYY'}
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 ${
                  validationErrors.scheduleDate ? 'border-rose-400 bg-rose-50' : ''
                }`}
              />
            </div>
            {validationErrors.scheduleDate && (
              <p className="text-[11px] text-rose-600 mt-1">{validationErrors.scheduleDate}</p>
            )}
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Displayed as: {formatDisplayDate(scheduleDate)}
            </span>
          </div>

          {/* TIME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Time (24-hr) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 ${
                  validationErrors.scheduleTime ? 'border-rose-400 bg-rose-50' : ''
                }`}
              />
            </div>
            {validationErrors.scheduleTime && (
              <p className="text-[11px] text-rose-600 mt-1">{validationErrors.scheduleTime}</p>
            )}
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Matter hearing time
            </span>
          </div>

          {/* VENUE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Venue <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="venue-suggestions"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Court Room No. 1"
              className={`w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 ${
                validationErrors.venue ? 'border-rose-400 bg-rose-50' : ''
              }`}
            />
            <datalist id="venue-suggestions">
              {COMMON_VENUES.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            {validationErrors.venue && (
              <p className="text-[11px] text-rose-600 mt-1">{validationErrors.venue}</p>
            )}
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Court room or hearing chamber
            </span>
          </div>
        </div>

        {/* Second Row: DESCRIPTION & REMARKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed information: Case Number, Parties (Petitioner vs Respondent), Proceeding Stage, Advocate..."
              className={`w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 leading-relaxed ${
                validationErrors.description ? 'border-rose-400 bg-rose-50' : ''
              }`}
            ></textarea>
            {validationErrors.description && (
              <p className="text-[11px] text-rose-600 mt-1">{validationErrors.description}</p>
            )}
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Case number and scheduled matter particulars
            </span>
          </div>

          {/* REMARKS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional bench notes, urgency level, priority, witness attendance, directions..."
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 leading-relaxed"
            ></textarea>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Internal notes or judicial remarks
            </span>
          </div>
        </div>

        {/* FORM BUTTONS: New, Save, Update, Clear, Cancel */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* New Button */}
            <button
              type="button"
              onClick={handleNewClick}
              className="px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Start a new schedule record (Ctrl+N)"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
              <span>New</span>
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={() => {
                setVenue('');
                setDescription('');
                setRemarks('');
                setValidationErrors({});
              }}
              className="px-3 py-2 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Clear input fields"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Cancel Button (when editing) */}
            {isEditing && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Cancel</span>
              </button>
            )}

            {/* Save Button (active in New mode) */}
            {!isEditing ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Save schedule to database (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
              </button>
            ) : (
              /* Update Button (active in Edit mode) */
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Update existing schedule (Ctrl+S)"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{isSubmitting ? 'Updating...' : 'Update'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
