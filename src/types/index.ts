export interface User {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  role: 'Administrator' | 'User';
  isActive?: number;
  createdDate?: string;
  lastLogin?: string;
}

export interface Schedule {
  scheduleId: number;
  serialNo: number;
  scheduleDate: string; // YYYY-MM-DD
  scheduleTime: string; // HH:MM or HH:MM AM/PM
  venue: string;
  description: string;
  remarks?: string;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}

export interface DashboardStats {
  totalSchedules: number;
  todaySchedules: number;
  upcomingSchedules: number;
  thisMonthSchedules: number;
  todayList: Schedule[];
  upcomingList: Schedule[];
}

export interface AppSettings {
  applicationName: string;
  organizationName: string;
  reportHeader: string;
  defaultPrintOrientation: 'portrait' | 'landscape';
  dateFormat: string;
  timeFormat: string;
  notice1?: string;
  notice2?: string;
}

export type QuickDateFilter = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';
