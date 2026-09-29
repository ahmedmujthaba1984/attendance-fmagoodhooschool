import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { AuditLog } from '../types';

interface AuditLogViewerProps {
  logs: AuditLog[];
  onRefresh: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs, onRefresh }) => {
  const { t, isRTL } = useLanguage();
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'ALL' && log.actionType !== filterType) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      (log.userName && log.userName.toLowerCase().includes(q))
    );
  });

  const actionColors: Record<string, { bg: string; text: string }> = {
    SYSTEM_BOOT: { bg: 'bg-slate-100', text: 'text-slate-800' },
    BULK_ATTENDANCE_MARKED: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800' },
    ATTENDANCE_UPDATE: { bg: 'bg-sky-50 border border-sky-200', text: 'text-sky-800' },
    OFFLINE_QUEUE_FLUSH: { bg: 'bg-indigo-50 border border-indigo-200', text: 'text-indigo-800' },
    SUBSTITUTE_ASSIGNED: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-800' },
    CALENDAR_OVERRIDE: { bg: 'bg-purple-50 border border-purple-200', text: 'text-purple-800' },
    USER_SWITCH: { bg: 'bg-teal-50 border border-teal-200', text: 'text-teal-800' },
    STAFF_LOGIN: { bg: 'bg-teal-50 border border-teal-300', text: 'text-teal-900' },
    PASSWORD_CHANGE: { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-900' },
    ADMIN_PASSWORD_RESET: { bg: 'bg-amber-50 border border-amber-300', text: 'text-amber-950 font-bold' },
    PASSWORD_SELF_RESET: { bg: 'bg-cyan-50 border border-cyan-200', text: 'text-cyan-900' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{t.auditTitle}</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t.auditDesc}</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isRTL ? 'އައުކުރޭ' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['ALL', 'BULK_ATTENDANCE_MARKED', 'OFFLINE_QUEUE_FLUSH', 'SUBSTITUTE_ASSIGNED', 'CALENDAR_OVERRIDE'].map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterType === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {type}
              </button>
            )
          )}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isRTL ? 'އޮޑިޓް ލޮގް ހޯދާ...' : 'Search audit records...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4">{t.auditTimestamp}</th>
                <th className="py-2.5 px-4">{t.auditAction}</th>
                <th className="py-2.5 px-4">{t.auditUser}</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">{t.auditDetails}</th>
                <th className="py-2.5 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const color = actionColors[log.actionType] || { bg: 'bg-slate-50', text: 'text-slate-700' };
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-[10px] text-slate-400">({new Date(log.timestamp).toISOString().slice(0, 10)})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color.bg} ${color.text}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.userName || log.userId}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{log.entityAffected}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-md truncate">{log.details}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
