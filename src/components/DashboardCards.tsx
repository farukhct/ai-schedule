import React from 'react';
import { Calendar, CalendarCheck2, Clock, CalendarDays, Eye, Printer, PlusCircle, Building2, BellRing } from 'lucide-react';
import { DashboardStats, Schedule } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface DashboardCardsProps {
  stats: DashboardStats;
  onViewSchedule: (schedule: Schedule) => void;
  onPrintSchedule: (schedule: Schedule) => void;
  onNewSchedule: () => void;
  onViewAllToday: () => void;
  onPrintToday?: () => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  stats,
  onViewSchedule,
  onPrintSchedule,
  onNewSchedule,
  onViewAllToday,
  onPrintToday
}) => {
  return (
    <div className="space-y-6">
      {/* Government Portal Daily Bulletin Marquee */}
      <div className="bg-[#022F62] border border-[#66A0C7]/40 rounded-lg p-2.5 shadow-xs flex items-center gap-3 text-xs text-white">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#006FB8] font-bold text-[11px] shrink-0 text-white font-serif">
          <BellRing className="w-3.5 h-3.5 text-[#D5F51F]" />
          <span>কোর্ট বুলেটিন (Court Notice):</span>
        </div>
        <div className="truncate text-slate-200">
          আজকের সকল বেঞ্চ এবং আদালতের দৈনন্দিন কার্যতালিকা ও কজ লিস্ট প্রস্তুত রয়েছে। যেকোনো মামলার তথ্য দ্রুত অনুসন্ধান করুন।
        </div>
      </div>

      {/* 4 Summary Cards (iBAS Color Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schedules */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between border-t-4 border-t-[#006FB8]">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Schedules</p>
            <h3 className="text-2xl font-bold text-[#006FB8] mt-1 font-serif">{stats.totalSchedules}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">All registered court matters</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#006FB8]/10 border border-[#006FB8]/20 flex items-center justify-center text-[#006FB8]">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between border-t-4 border-t-[#2C8CBC]">
          <div>
            <p className="text-xs font-semibold text-[#2C8CBC] uppercase tracking-wider">Today's Schedule</p>
            <h3 className="text-2xl font-bold text-[#022F62] mt-1 font-serif">{stats.todaySchedules}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Matters listed for today</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#2C8CBC]/10 border border-[#2C8CBC]/20 flex items-center justify-center text-[#2C8CBC]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between border-t-4 border-t-[#022F62]">
          <div>
            <p className="text-xs font-semibold text-[#022F62] uppercase tracking-wider">Upcoming Schedule</p>
            <h3 className="text-2xl font-bold text-[#022F62] mt-1 font-serif">{stats.upcomingSchedules}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Future court proceedings</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#022F62]/10 border border-[#022F62]/20 flex items-center justify-center text-[#022F62]">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between border-t-4 border-t-[#3584AA]">
          <div>
            <p className="text-xs font-semibold text-[#3584AA] uppercase tracking-wider">This Month</p>
            <h3 className="text-2xl font-bold text-[#0e2a47] mt-1 font-serif">{stats.thisMonthSchedules}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Total month cause list</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#3584AA]/10 border border-[#3584AA]/20 flex items-center justify-center text-[#3584AA]">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid of Today's Schedule & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule Section */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#022F62] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-300" />
              <h4 className="text-sm font-bold uppercase tracking-wide font-serif">
                Today's Judicial Cause List
              </h4>
            </div>
            {stats.todaySchedules > 0 && (
              <div className="flex items-center gap-2">
                {onPrintToday && (
                  <button
                    onClick={onPrintToday}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-900 bg-[#D5F51F] hover:bg-yellow-300 rounded shadow-2xs transition-colors cursor-pointer"
                    title="Print Today's Official Cause List"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print List</span>
                  </button>
                )}
                <button
                  onClick={onViewAllToday}
                  className="text-xs font-semibold text-cyan-200 hover:text-white underline cursor-pointer"
                >
                  View All ({stats.todaySchedules})
                </button>
              </div>
            )}
          </div>

          <div className="p-4 flex-1 bg-slate-50/50">
            {stats.todayList && stats.todayList.length > 0 ? (
              <div className="space-y-2.5">
                {stats.todayList.map((item) => (
                  <div
                    key={item.scheduleId}
                    className="p-3 rounded-md border border-slate-200 bg-white hover:border-[#006FB8] hover:shadow-xs transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#006FB8] bg-[#006FB8]/10 px-2 py-0.5 rounded text-[11px] font-mono">
                          {item.scheduleTime}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.venue}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          SL #{item.serialNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      {item.remarks && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          Remarks: {item.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={() => onViewSchedule(item)}
                        className="p-1.5 text-slate-600 hover:text-[#006FB8] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="View Schedule"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPrintSchedule(item)}
                        className="p-1.5 text-slate-600 hover:text-[#006FB8] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Print Hearing Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center text-slate-500">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No schedule listed for today.</p>
                <p className="text-xs text-slate-400 mt-1">Select an upcoming date or add a new proceeding matter.</p>
                <button
                  onClick={onNewSchedule}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006FB8] hover:bg-[#005a96] rounded transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Schedule Matter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Schedule Section */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#0e2a47] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-cyan-300" />
              <h4 className="text-sm font-bold uppercase tracking-wide font-serif">
                Upcoming Schedule & Docket
              </h4>
            </div>
            <span className="text-xs text-cyan-200">Chronological</span>
          </div>

          <div className="p-4 flex-1 bg-slate-50/50">
            {stats.upcomingList && stats.upcomingList.length > 0 ? (
              <div className="space-y-2.5">
                {stats.upcomingList.map((item) => (
                  <div
                    key={item.scheduleId}
                    className="p-3 rounded-md border border-slate-200 bg-white hover:border-[#006FB8] hover:shadow-xs transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#022F62] bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200">
                          {formatDisplayDate(item.scheduleDate)}
                        </span>
                        <span className="font-semibold text-[#006FB8]">
                          {item.scheduleTime}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700 truncate">
                          {item.venue}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      {item.remarks && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          Remarks: {item.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={() => onViewSchedule(item)}
                        className="p-1.5 text-slate-600 hover:text-[#006FB8] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="View Schedule"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPrintSchedule(item)}
                        className="p-1.5 text-slate-600 hover:text-[#006FB8] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Print Hearing Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center text-slate-500">
                <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No upcoming schedules found.</p>
                <p className="text-xs text-slate-400 mt-1">All matters are current or no proceedings scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
