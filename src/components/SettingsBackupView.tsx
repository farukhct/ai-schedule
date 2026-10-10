import React, { useState } from 'react';
import { Database, Download, Upload, Save, AlertTriangle, Shield, Check, RefreshCw, Monitor, Terminal, Archive, FolderDown } from 'lucide-react';
import { AppSettings, User } from '../types';
import { downloadMscFile, downloadBatInstaller, generateAndDownloadZipBundle } from '../utils/mscInstaller';

interface SettingsBackupViewProps {
  settings: AppSettings;
  currentUser: User;
  onUpdateSettings: (newSettings: AppSettings) => Promise<boolean>;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
  onRefreshStats: () => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onShowToast,
  onRefreshStats
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await onUpdateSettings(formData);
      if (ok) {
        onShowToast('success', 'Application settings saved successfully.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSqlite = () => {
    window.location.href = '/api/backup/download';
    onShowToast('info', 'Downloading SQLite database backup (.sqlite)...');
  };

  const handleDownloadJson = () => {
    window.location.href = '/api/backup/export-json';
    onShowToast('info', 'Exporting JSON database dump...');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile) return;

    setIsRestoring(true);
    const body = new FormData();
    body.append('file', restoreFile);

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Failed to restore database.');
        return;
      }

      onShowToast('success', data.message || 'Database restored successfully.');
      setShowRestoreConfirm(false);
      setRestoreFile(null);
      onRefreshStats();
    } catch {
      onShowToast('error', 'Error occurred during database restore.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Backup & Disaster Recovery Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-serif">
                Database Backup & Restore
              </h3>
              <p className="text-[11px] text-slate-500">
                Local offline embedded SQLite storage (.sqlite) maintenance
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Local SQLite Active
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Panel */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-50/70 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-sky-600" />
              <span>Create Database Backup</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export a standalone binary backup copy of your local SQLite database containing all judicial schedules, audit logs, and settings.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadSqlite}
                className="px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download SQLite Database (.sqlite)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-3 py-2 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Export JSON Dump</span>
              </button>
            </div>
          </div>

          {/* Restore Panel */}
          <div className="space-y-3 p-4 rounded-lg bg-amber-50/40 border border-amber-200">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-amber-700" />
              <span>Restore Database from Backup</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Upload a previously downloaded <code className="font-mono bg-white px-1 border rounded">.sqlite</code> or <code className="font-mono bg-white px-1 border rounded">.json</code> file to restore schedules.
            </p>

            <div className="space-y-2 pt-1">
              <input
                type="file"
                accept=".sqlite,.db,.json"
                onChange={handleFileSelect}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
              />

              {restoreFile && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    Selected: {restoreFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Proceed to Restore
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Windows Console (.msc) & Desktop Deployment Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-serif">
              Windows Microsoft Management Console (.msc) & Setup
            </h3>
          </div>
          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Windows 10 / 11 / Server
          </span>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Download the official Microsoft Management Console document (<code className="font-mono font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.msc</code>) to install and run {settings.applicationName} natively on courtroom PCs without third-party runtimes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-amber-700" />
                  <span>Microsoft Console (.msc)</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  XML console document. Double-click in Windows to launch via <code className="font-mono text-[11px]">mmc.exe</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadMscFile(settings);
                  onShowToast('success', 'Saved JusticeSchedule.msc to your Downloads folder!');
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .msc Console</span>
              </button>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>Windows 1-Click Installer</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Automated batch script that installs the .msc file and creates Desktop and Start Menu shortcuts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadBatInstaller(settings);
                  onShowToast('success', 'Saved Install-JusticeSchedule.bat to your Downloads folder!');
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Installer (.bat)</span>
              </button>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-emerald-700" />
                  <span>All-in-One Installer (.zip)</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Complete bundle with all 10 packages: .msc, installer, shortcuts, documentation, and tools.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await generateAndDownloadZipBundle(settings);
                    onShowToast('success', 'Saved All-in-One Installer (.zip) to your Downloads folder!');
                  } catch {
                    window.location.href = '/api/download/full-package-zip';
                    onShowToast('info', 'Downloading Installer package to your Downloads folder...');
                  }
                }}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Download All (.zip)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Application Settings Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-serif">
            Application & Court Settings
          </h3>
          <span className="text-xs text-slate-500">
            Branding & Printing Defaults
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={formData.applicationName}
                onChange={(e) => setFormData({ ...formData, applicationName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Court / Organization Name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Official Printed Report Header
            </label>
            <input
              type="text"
              value={formData.reportHeader}
              onChange={(e) => setFormData({ ...formData, reportHeader: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-semibold text-slate-900"
              placeholder="e.g. JUSTICE SCHEDULE - OFFICIAL CAUSE LIST"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This exact title is used as the primary header across all official court reports, printed cause lists, single proceeding slips, Excel, Word, and CSV exports.
            </p>
          </div>

          {/* Live Report Header Visual Preview */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Live Reports' Header Preview
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                Appears on all printouts, PDF, Word, Excel & CSV
              </span>
            </div>
            <div className="bg-white p-4 rounded border border-slate-200 text-center font-serif shadow-2xs">
              <div className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-950">
                {formData.organizationName || 'HIGH COURT & DISTRICT JUDICIARY'}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-sans mt-0.5">
                {formData.applicationName || 'JUSTICE SCHEDULE'}
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-950 font-serif border-y border-slate-900/60 py-1 px-4 inline-block bg-slate-50">
                {formData.reportHeader || 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date Display Format
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-semibold bg-white"
              >
                <option value="DD-MM-YYYY">DD-MM-YYYY (Standard e.g. 23-09-2026)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Time Format
              </label>
              <select
                value={formData.timeFormat}
                onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-semibold bg-white"
              >
                <option value="24-hour">24-hour format (e.g. 14:30)</option>
                <option value="12-hour">12-hour format (e.g. 02:30 PM)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Print Orientation
              </label>
              <select
                value={formData.defaultPrintOrientation}
                onChange={(e) => setFormData({ ...formData, defaultPrintOrientation: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-semibold bg-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Login Screen Marquee Notices (Notice 1 & Notice 2) */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Login Screen Notices (Notice 1 & Notice 2)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Configure the urgent ticker messages displayed on the top of the portal login screen.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Live Marquee Tickers
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                    <span>Notice 1 (জরুরি নোটিশ / Urgent Notice)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Top red banner ticker</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.notice1 !== undefined ? formData.notice1 : ''}
                  onChange={(e) => setFormData({ ...formData, notice1: e.target.value })}
                  placeholder="জরুরি নোটিশঃ মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন সিডিউল সরাসরি প্রস্তুত ও সংরক্ষণ করা যাবে।"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
                    <span>Notice 2 (বিজ্ঞপ্তি / General Notice)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Second blue banner ticker</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.notice2 !== undefined ? formData.notice2 : ''}
                  onChange={(e) => setFormData({ ...formData, notice2: e.target.value })}
                  placeholder="বিজ্ঞপ্তিঃ মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন কার্যযতালিকা প্রস্তুত ও রিমাইন্টডার ব্যবস্থাপনা(Justice Schedule Platform)."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            {/* Live Visual Preview of Notices */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Live Login Screen Preview
              </span>
              
              {/* Notice 1 Preview */}
              <div className="bg-[#1b2533] border border-white/10 rounded px-2.5 py-1.5 flex items-center text-[11px]">
                <span className="font-bold text-white bg-rose-700 px-1.5 py-0.5 rounded mr-2 text-[10px] shrink-0 font-serif">
                  জরুরি নোটিশঃ
                </span>
                <span className="text-white truncate">
                  {formData.notice1 || '(Empty - will not display)'}
                </span>
              </div>

              {/* Notice 2 Preview */}
              <div className="bg-[#022F62]/90 border border-white/10 rounded px-2.5 py-1.5 flex items-center text-[11px]">
                <span className="font-semibold text-cyan-200 mr-2 text-[10px] shrink-0">
                  বিজ্ঞপ্তিঃ
                </span>
                <span className="text-white truncate">
                  {formData.notice2 || '(Empty - will not display)'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Restore */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-rose-300 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="text-sm font-bold text-rose-950 font-serif">
                Confirm Database Restore
              </h3>
            </div>
            <div className="p-5 space-y-3 text-xs leading-relaxed text-slate-700">
              <p className="font-bold text-rose-700 text-sm">
                Restoring a database may replace existing data. Continue?
              </p>
              <p>
                You are about to restore the local database from:{' '}
                <strong className="text-slate-900 font-mono">{restoreFile?.name}</strong>.
                Current schedules and tables will be superseded by the backup data.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                disabled={isRestoring}
                className="px-3.5 py-1.5 rounded border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Yes, Replace & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
