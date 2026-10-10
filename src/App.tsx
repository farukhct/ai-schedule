import React, { useState, useEffect, useCallback } from 'react';
import $ from 'jquery';
import { Header } from './components/Header';
import { Sidebar, ActiveNavTab } from './components/Sidebar';
import { DashboardCards } from './components/DashboardCards';
import { ScheduleForm } from './components/ScheduleForm';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ViewModal } from './components/ViewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { UserManagementView } from './components/UserManagementView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SettingsBackupView } from './components/SettingsBackupView';
import { InstallMscView } from './components/InstallMscView';
import { AuthViews } from './components/AuthViews';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Schedule, DashboardStats, AppSettings, User, QuickDateFilter } from './types';
import { exportToCSV, exportToExcel, formatDisplayDate } from './utils/dateUtils';
import { exportToPDF } from './utils/pdfExport';
import { Calendar, Search, Shield, User as UserIcon, Printer, Database, FileDown } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  applicationName: 'Justice Schedule',
  organizationName: 'Finance Division & Law and Justice Division, Government of Bangladesh',
  reportHeader: "GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH - OFFICIAL CAUSE LIST",
  defaultPrintOrientation: 'portrait',
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '24-hour',
  notice1: 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন সিডিউল সরাসরি প্রস্তুত ও সংরক্ষণ করা যাবে।',
  notice2: 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন কার্যযতালিকা প্রস্তুত ও রিমাইন্টডার ব্যবস্থাপনা(Justice Schedule Platform).'
};

const DEFAULT_STATS: DashboardStats = {
  totalSchedules: 0,
  todaySchedules: 0,
  upcomingSchedules: 0,
  thisMonthSchedules: 0,
  todayList: [],
  upcomingList: []
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('justice_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Schedules Data & Pagination
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [nextSerialNo, setNextSerialNo] = useState<number>(1001);

  // Dashboard dynamic stats
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);

  // Filtering & Search
  const [searchText, setSearchText] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>('all');
  const [sortBy, setSortBy] = useState<string>('scheduleDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Active Modals & Operations
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [printSingleSchedule, setPrintSingleSchedule] = useState<Schedule | null>(null);
  const [printCustomList, setPrintCustomList] = useState<Schedule[] | null>(null);
  const [printReportTitle, setPrintReportTitle] = useState<string>('OFFICIAL CAUSE LIST & PROCEEDING SCHEDULE');
  const [printDateRangeLabel, setPrintDateRangeLabel] = useState<string>('');

  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  // Fetch Next Serial Number
  const fetchNextSerialNo = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules/next-serial');
      const data = await res.json();
      if (data.nextSerialNo) {
        setNextSerialNo(data.nextSerialNo);
      }
    } catch (err) {
      console.error('Error fetching next serial:', err);
    }
  }, []);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch Schedule Grid Data with current filters
  const fetchSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
        search: searchText,
        dateFrom,
        dateTo,
        venue: venueFilter,
        dateFilter: quickDateFilter
      });

      const res = await fetch(`/api/schedules?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setSchedules(data.schedules || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        showToast('error', data.error || 'Failed to fetch schedules.');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      showToast('error', 'Unable to reach local database.');
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchText, dateFrom, dateTo, venueFilter, quickDateFilter, showToast]);

  // Initial load
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
      fetchNextSerialNo();
      fetchSchedules();
    }
  }, [currentUser, fetchStats, fetchNextSerialNo, fetchSchedules]);

  // Keyboard Shortcuts Listener (Ctrl+N, Ctrl+S, Ctrl+F, Ctrl+P, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + N: New Schedule
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveTab('schedule');
        setEditingSchedule(null);
        fetchNextSerialNo();
        setTimeout(() => {
          $('#schedule-entry-form input[type="date"]').focus();
        }, 100);
      }

      // Ctrl + F: Quick Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        // Only override if not already in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setActiveTab('schedule');
          setTimeout(() => {
            $('#search-input-field').focus().select();
          }, 100);
        }
      }

      // Ctrl + P: Print Preview
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleOpenPrintAll();
      }

      // Esc: Close any modal
      if (e.key === 'Escape') {
        if (viewingSchedule) setViewingSchedule(null);
        if (deletingSchedule) setDeletingSchedule(null);
        if (printModalOpen) setPrintModalOpen(false);
        if (changePasswordModalOpen) setChangePasswordModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingSchedule, deletingSchedule, printModalOpen, changePasswordModalOpen, fetchNextSerialNo]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('justice_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('justice_user');
    showToast('info', 'Logged out successfully.');
  };

  // Schedule CRUD Handlers
  const handleSaveNewSchedule = async (formData: Partial<Schedule>): Promise<boolean> => {
    try {
      const payload = {
        ...formData,
        createdBy: currentUser?.fullName || 'Administrator'
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Unable to save schedule. Please try again.');
        return false;
      }

      showToast('success', 'Schedule saved successfully.');
      fetchNextSerialNo();
      fetchStats();
      fetchSchedules();
      return true;
    } catch {
      showToast('error', 'Unable to save schedule. Please try again.');
      return false;
    }
  };

  const handleUpdateSchedule = async (id: number, formData: Partial<Schedule>): Promise<boolean> => {
    try {
      const payload = {
        ...formData,
        updatedBy: currentUser?.fullName || 'Administrator'
      };

      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Unable to update schedule. Please try again.');
        return false;
      }

      showToast('success', 'Schedule updated successfully.');
      setEditingSchedule(null);
      fetchStats();
      fetchSchedules();
      return true;
    } catch {
      showToast('error', 'Unable to update schedule. Please try again.');
      return false;
    }
  };

  const handleConfirmDeleteSchedule = async () => {
    if (!deletingSchedule) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedules/${deletingSchedule.scheduleId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Unable to delete schedule. Please try again.');
        return;
      }

      showToast('success', 'Schedule deleted successfully.');
      setDeletingSchedule(null);
      if (editingSchedule?.scheduleId === deletingSchedule.scheduleId) {
        setEditingSchedule(null);
      }
      fetchStats();
      fetchSchedules();
    } catch {
      showToast('error', 'Unable to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setActiveTab('schedule');
    // Use jQuery for smooth scroll to form
    $('html, body').animate(
      {
        scrollTop: $('#schedule-entry-form').offset()?.top || 0
      },
      300
    );
  };

  // Search & Filter Handlers
  const handleApplySearch = () => {
    setCurrentPage(1);
    fetchSchedules();
  };

  const handleResetFilters = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setVenueFilter('ALL');
    setQuickDateFilter('all');
    setCurrentPage(1);
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleQuickDateFilterChange = (filter: QuickDateFilter) => {
    setQuickDateFilter(filter);
    setCurrentPage(1);
  };

  // Print Handlers
  const handleOpenPrintAll = async () => {
    setPrintSingleSchedule(null);
    setPrintReportTitle(settings.reportHeader || 'OFFICIAL CAUSE LIST & PROCEEDING SCHEDULE');
    setPrintDateRangeLabel('Complete Judicial Registry');

    // If total registered records exceeds currently loaded page, fetch all for full report
    if (totalRecords > schedules.length) {
      try {
        const res = await fetch('/api/schedules?pageSize=10000&sortBy=scheduleDate&sortOrder=asc');
        const data = await res.json();
        if (data.schedules) {
          setPrintCustomList(data.schedules);
          setPrintModalOpen(true);
          return;
        }
      } catch (err) {
        console.error('Error fetching all schedules for print:', err);
      }
    }
    setPrintCustomList(null);
    setPrintModalOpen(true);
  };

  const handlePrintToday = () => {
    setPrintSingleSchedule(null);
    setPrintReportTitle("TODAY'S CAUSE LIST");
    setPrintDateRangeLabel(`Today: ${formatDisplayDate(new Date().toISOString())}`);
    if (stats.todayList && stats.todayList.length > 0) {
      setPrintCustomList(stats.todayList);
    } else {
      setPrintCustomList(null);
    }
    setPrintModalOpen(true);
  };

  const handlePrintSingleRecord = (schedule: Schedule) => {
    setPrintSingleSchedule(schedule);
    setPrintCustomList(null);
    setPrintReportTitle(`PROCEEDING SLIP - CAUSE SL #${schedule.serialNo}`);
    setPrintDateRangeLabel(`Hearing Date: ${formatDisplayDate(schedule.scheduleDate)}`);
    setPrintModalOpen(true);
  };

  // Settings Save Handler
  const handleUpdateSettings = async (newSettings: AppSettings): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to save settings.');
        return false;
      }

      setSettings(newSettings);
      return true;
    } catch {
      showToast('error', 'Error updating settings.');
      return false;
    }
  };

  // If user is not authenticated, display offline Login / Register views
  if (!currentUser) {
    return (
      <>
        <AuthViews
          settings={settings}
          onLoginSuccess={handleLoginSuccess}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        user={currentUser}
        settings={settings}
        onLogout={handleLogout}
        onOpenPrint={handleOpenPrintAll}
        onOpenBackup={() => setActiveTab('backup')}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenInstall={() => setActiveTab('install')}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-serif">
                    Judicial Schedule Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Welcome, {currentUser.fullName} · {settings.organizationName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('schedule');
                      setEditingSchedule(null);
                      fetchNextSerialNo();
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    + New Schedule
                  </button>
                  <button
                    onClick={handlePrintToday}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600" />
                    <span>Print Today's Docket</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Dashboard Cards & Lists */}
              <DashboardCards
                stats={stats}
                onViewSchedule={(s) => setViewingSchedule(s)}
                onPrintSchedule={(s) => handlePrintSingleRecord(s)}
                onPrintToday={handlePrintToday}
                onNewSchedule={() => {
                  setActiveTab('schedule');
                  setEditingSchedule(null);
                  fetchNextSerialNo();
                }}
                onViewAllToday={() => {
                  setQuickDateFilter('today');
                  setActiveTab('schedule');
                }}
              />
            </div>
          )}

          {/* TAB 2: SCHEDULE (ONE-PAGE ENTRY & MASTER GRID) */}
          {(activeTab === 'schedule' || activeTab === 'search') && (
            <div className="space-y-6">
              {/* Schedule Entry Form */}
              <ScheduleForm
                editingSchedule={editingSchedule}
                nextSerialNo={nextSerialNo}
                onSaveNew={handleSaveNewSchedule}
                onUpdate={handleUpdateSchedule}
                onClear={() => setEditingSchedule(null)}
                onCancel={() => setEditingSchedule(null)}
                onRequestNextSerial={fetchNextSerialNo}
              />

              {/* Schedule Data Grid */}
              <ScheduleGrid
                schedules={schedules}
                totalRecords={totalRecords}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                venueFilter={venueFilter}
                onVenueFilterChange={setVenueFilter}
                quickDateFilter={quickDateFilter}
                onQuickDateFilterChange={handleQuickDateFilterChange}
                onApplySearch={handleApplySearch}
                onResetFilters={handleResetFilters}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onView={(s) => setViewingSchedule(s)}
                onEdit={handleEditClick}
                onDelete={(s) => setDeletingSchedule(s)}
                onPrintRow={(s) => handlePrintSingleRecord(s)}
                onNewSchedule={() => {
                  setEditingSchedule(null);
                  fetchNextSerialNo();
                  $('html, body').animate({ scrollTop: $('#schedule-entry-form').offset()?.top || 0 }, 300);
                }}
                onExportPDF={() => {
                  exportToPDF(schedules, {
                    orientation: settings.defaultPrintOrientation || 'portrait',
                    filename: `justice_schedules_${Date.now()}.pdf`,
                    settings,
                    reportTitle: quickDateFilter !== 'all' ? `${quickDateFilter.toUpperCase()} CAUSE PROCEEDINGS` : 'ACTIVE CAUSE LIST',
                    dateRangeLabel: dateFrom || dateTo ? `From: ${dateFrom || 'Start'} To: ${dateTo || 'End'}` : undefined,
                    currentUser
                  });
                  showToast('success', 'Official Cause List exported as .PDF successfully!');
                }}
                onExportCSV={() => exportToCSV(schedules, `justice_schedules_${Date.now()}.csv`, settings, 'Active Grid Selection')}
                onExportExcel={() => exportToExcel(schedules, `justice_schedules_${Date.now()}.xls`, settings, 'Active Grid Selection')}
              />
            </div>
          )}

          {/* TAB 3: PRINT REPORTS */}
          {activeTab === 'print' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">Official Printing Center</h3>
                <p className="text-xs text-slate-500">
                  Generate official printed court cause lists, proceeding slips, and vector PDF dockets
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Listed Schedules</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Complete judicial registry in the database ({totalRecords} records).
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleOpenPrintAll}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print / Preview All ({totalRecords})</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/schedules?limit=5000&sortBy=serialNo&sortOrder=ASC');
                          const json = await res.json();
                          const allData: Schedule[] = json.data || [];
                          exportToPDF(allData, {
                            orientation: settings.defaultPrintOrientation || 'portrait',
                            filename: `complete_cause_list_${Date.now()}.pdf`,
                            settings,
                            reportTitle: 'COMPLETE OFFICIAL CAUSE LIST REGISTRY',
                            currentUser
                          });
                          showToast('success', 'Complete Registry exported as .PDF successfully!');
                        } catch (e) {
                          showToast('error', 'Failed to export PDF');
                        }
                      }}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Export All as .PDF</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Today's Cause List</h4>
                    <p className="text-xs text-amber-800/80 mt-1">
                      Proceedings scheduled specifically for today ({stats.todaySchedules} matters).
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePrintToday}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Today's Docket</span>
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF(stats.todayList || [], {
                          orientation: settings.defaultPrintOrientation || 'portrait',
                          filename: `today_cause_list_${Date.now()}.pdf`,
                          settings,
                          reportTitle: "TODAY'S OFFICIAL CAUSE LIST & HEARINGS",
                          dateRangeLabel: formatDisplayDate(new Date().toISOString().slice(0, 10)),
                          currentUser
                        });
                        showToast('success', "Today's Cause List exported as .PDF successfully!");
                      }}
                      className="w-full py-1.5 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-amber-700" />
                      <span>Export Today as .PDF</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Custom Filtered Report</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Active search criteria and date filters ({schedules.length} visible rows).
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setPrintSingleSchedule(null);
                        setPrintCustomList(null);
                        setPrintReportTitle('FILTERED CAUSE PROCEEDINGS');
                        setPrintDateRangeLabel('Active Filter Selection');
                        setPrintModalOpen(true);
                      }}
                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print Filtered Records</span>
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF(schedules, {
                          orientation: settings.defaultPrintOrientation || 'portrait',
                          filename: `filtered_cause_list_${Date.now()}.pdf`,
                          settings,
                          reportTitle: 'FILTERED CAUSE PROCEEDINGS',
                          dateRangeLabel: dateFrom || dateTo ? `From: ${dateFrom || 'Start'} To: ${dateTo || 'End'}` : undefined,
                          currentUser
                        });
                        showToast('success', 'Filtered records exported as .PDF successfully!');
                      }}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Export Filtered as .PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTALL DESKTOP & .MSC CONSOLE */}
          {activeTab === 'install' && (
            <InstallMscView settings={settings} onShowToast={showToast} />
          )}

          {/* TAB 5: USER MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'users' && currentUser.role === 'Administrator' && (
            <UserManagementView currentUser={currentUser} onShowToast={showToast} />
          )}

          {/* TAB 5: BACKUP & SETTINGS */}
          {activeTab === 'backup' && (
            <SettingsBackupView
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={handleUpdateSettings}
              onShowToast={showToast}
              onRefreshStats={() => {
                fetchStats();
                fetchSchedules();
                fetchNextSerialNo();
              }}
            />
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-6 max-w-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-400 font-bold text-lg flex items-center justify-center font-serif">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">{currentUser.fullName}</h3>
                  <p className="text-xs text-slate-500">@{currentUser.username} · {currentUser.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Email</span>
                  <span className="font-medium text-slate-800">{currentUser.email}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">System Role</span>
                  <span className="font-semibold text-amber-800">{currentUser.role}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setChangePasswordModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
                >
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: CHANGE PASSWORD DIRECT ACCESS */}
          {activeTab === 'password' && (
            <div className="max-w-md">
              <button
                onClick={() => setChangePasswordModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold"
              >
                Open Password Change Dialog
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. View Schedule Modal */}
      <ViewModal
        schedule={viewingSchedule}
        onClose={() => setViewingSchedule(null)}
        onPrint={(s) => {
          setViewingSchedule(null);
          handlePrintSingleRecord(s);
        }}
      />

      {/* 2. Delete Confirmation Modal */}
      <DeleteConfirmModal
        schedule={deletingSchedule}
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={handleConfirmDeleteSchedule}
        isDeleting={isDeleting}
      />

      {/* 3. Official Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setPrintSingleSchedule(null);
          setPrintCustomList(null);
        }}
        schedules={printCustomList || schedules}
        reportTitle={printReportTitle}
        dateRangeLabel={printDateRangeLabel}
        settings={settings}
        currentUser={currentUser}
        singleSchedule={printSingleSchedule}
      />

      {/* 4. Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onShowToast={showToast}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
