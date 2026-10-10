import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Search,
  Printer,
  Users,
  KeyRound,
  Database,
  Info,
  LogOut,
  Download,
  Building2,
  FileText
} from 'lucide-react';
import { User } from '../types';

export type ActiveNavTab = 'dashboard' | 'schedule' | 'search' | 'print' | 'install' | 'users' | 'backup' | 'password' | 'profile';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  user: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveNavTab, label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'schedule' as ActiveNavTab, label: 'Court Schedules & Cause List', icon: CalendarDays },
    { id: 'search' as ActiveNavTab, label: 'Search & Case Queries', icon: Search },
    { id: 'print' as ActiveNavTab, label: 'Official Print Reports', icon: Printer },
    { id: 'install' as ActiveNavTab, label: 'Windows .MSC Console', icon: Download },
  ];

  if (user.role === 'Administrator') {
    navItems.push({ id: 'users' as ActiveNavTab, label: 'User & Staff Management', icon: Users });
  }

  navItems.push(
    { id: 'backup' as ActiveNavTab, label: 'Database & System Backup', icon: Database },
    { id: 'password' as ActiveNavTab, label: 'Change Security Password', icon: KeyRound },
    { id: 'profile' as ActiveNavTab, label: 'Account Profile Details', icon: Info }
  );

  return (
    <aside className="w-64 bg-[#022F62] text-slate-200 border-r border-[#0e2a47] flex flex-col justify-between shrink-0 no-print min-h-[calc(100vh-80px)]">
      <div className="py-4">
        {/* Navigation Category */}
        <div className="px-5 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-serif">
          Judicial Modules
        </div>

        <nav className="space-y-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#006FB8] text-white shadow-sm border-l-4 border-[#D5F51F]'
                    : 'text-slate-200 hover:bg-[#0e2a47] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D5F51F]' : 'text-cyan-300'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Shortcuts */}
      <div className="p-3.5 border-t border-[#0e2a47] text-[11px] text-slate-300 space-y-3">
        <div className="bg-[#0e2a47]/90 rounded p-2.5 space-y-1.5 border border-[#66A0C7]/20">
          <div className="font-bold text-cyan-300 text-[10px] uppercase tracking-wider flex items-center justify-between">
            <span>Fast Shortcuts</span>
            <span className="text-[9px] text-slate-400">Windows</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 font-mono">Ctrl + N</span>
            <span>New Schedule</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 font-mono">Ctrl + S</span>
            <span>Save Record</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400 font-mono">Ctrl + P</span>
            <span>Print Preview</span>
          </div>
        </div>

        {/* Server & Data Center Compliance Tag */}
        <div className="text-[10px] text-cyan-200/80 leading-tight space-y-0.5">
          <p className="font-semibold text-white">Tier-IV National Data Center</p>
          <p>Financial System Management Unit (FSMU)</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#0e2a47] hover:bg-rose-950 text-rose-300 hover:text-white rounded border border-rose-800/40 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
