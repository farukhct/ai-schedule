import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Printer,
  Database,
  Download,
  Globe,
  Clock,
  ExternalLink
} from 'lucide-react';
import { User, AppSettings } from '../types';
import { GovtEmblem } from './GovtEmblem';

interface HeaderProps {
  user: User;
  settings: AppSettings;
  onLogout: () => void;
  onOpenPrint: () => void;
  onOpenBackup: () => void;
  onOpenProfile: () => void;
  onOpenInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  onLogout,
  onOpenPrint,
  onOpenBackup,
  onOpenProfile,
  onOpenInstall
}) => {
  const [lang, setLang] = useState<'EN' | 'BN'>('EN');
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' ' +
        now.toLocaleTimeString(lang === 'BN' ? 'bn-BD' : 'en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <header className="no-print sticky top-0 z-30 shadow-md">
      {/* Topmost Official Government Bar (Govt of Bangladesh) */}
      <div className="bg-[#022F62] text-white border-b border-[#0e2a47] px-4 sm:px-6 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Government Name in Bangla & English */}
          <div className="flex items-center gap-2">
            <GovtEmblem size={22} className="shrink-0" />
            <span className="font-semibold text-slate-100 hidden sm:inline">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-200">
              Government of the People's Republic of Bangladesh
            </span>
          </div>

          {/* Right Meta: Clock & Language Switcher */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300 ml-auto">
            <div className="hidden md:flex items-center gap-1.5 text-cyan-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{timeStr}</span>
            </div>

            <div className="flex items-center bg-[#0e2a47] rounded p-0.5 border border-[#66A0C7]/40">
              <button
                type="button"
                onClick={() => setLang('EN')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  lang === 'EN'
                    ? 'bg-[#006FB8] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('BN')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  lang === 'BN'
                    ? 'bg-[#006FB8] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Portal Navigation Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Ministry Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#006FB8]/10 border border-[#006FB8]/30 flex items-center justify-center shrink-0">
              <GovtEmblem size={32} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#022F62] font-serif">
                  {settings.applicationName || 'Justice Schedule'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'BN'
                  ? 'আইন ও বিচার বিভাগ এবং অর্থ বিভাগ, বাংলাদেশ'
                  : settings.organizationName || 'Finance Division & Law and Justice Division'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* MSC Installer button */}
            <button
              onClick={onOpenInstall}
              title="Download Windows Console (.msc) & Desktop Installer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#006FB8] hover:bg-[#005a96] rounded border border-[#005a96] transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install .MSC</span>
            </button>

            {/* Print Report */}
            <button
              onClick={onOpenPrint}
              title="Print Schedule Report (Ctrl+P)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#006FB8]" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Backup / DB */}
            <button
              onClick={onOpenBackup}
              title="Database Backup & System Settings"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#2C8CBC]" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* User Profile Info */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 transition-colors text-left"
              title="View profile settings"
            >
              <div className="w-8 h-8 rounded-full bg-[#022F62] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  {user.fullName}
                  {user.role === 'Administrator' && (
                    <span title="Administrator">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#006FB8]" />
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user.role} · @{user.username}
                </div>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sign out of Justice Schedule"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-700 rounded border border-rose-200 hover:border-rose-700 transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
