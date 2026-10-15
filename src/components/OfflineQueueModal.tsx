import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Download,
  AlertTriangle,
  X,
  Database,
  Layers,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { syncEngine } from '../lib/syncEngine';
import { OfflineQueueItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import * as XLSX from 'xlsx';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
  onSyncComplete?: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  pendingCount,
  onSyncComplete,
}) => {
  const { t, isRTL } = useLanguage();
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    syncedCount?: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setSyncResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const list = await syncEngine.getPendingItems();
      setItems(list);
    } catch (err) {
      console.warn('Error loading pending queue items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncEngine.flushQueue();
      if (res.syncedCount > 0) {
        setSyncResult({
          success: true,
          message: isRTL
            ? `${res.syncedCount} ހާޒިރީ ރެކޯޑް ކާމިޔާބުކަމާއެކު ސާވަރަށް ސިންކްކުރެވިއްޖެ!`
            : `Successfully uploaded ${res.syncedCount} attendance records to the server!`,
          syncedCount: res.syncedCount,
        });
        await loadItems();
        if (onSyncComplete) onSyncComplete();
      } else if (res.success) {
        setSyncResult({
          success: true,
          message: isRTL
            ? 'ހުރިހާ ރެކޯޑެއް ވަނީ ސިންކްވެފައި'
            : 'All records are already up to date on the server!',
        });
        await loadItems();
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncResult({
          success: false,
          message: isRTL
            ? `ސާވަރާ ގުޅުމުގައި މައްސަލައެއް ދިމާވެއްޖެ (${res.error || 'Connection Failed'}). ރެކޯޑްތައް ބްރައުޒަރގައި ރައްކާކުރެވިފައި އެބަހުއްޓެވެ.`
            : `Could not connect to the remote server (${res.error || 'Server error'}). Your records remain safely stored offline. You can click "Mark as Synced Locally" below to clear the yellow badge.`,
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Sync failed. Please check internet connection.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceClear = async () => {
    const confirmMessage = isRTL
      ? `އޮފްލައިން ކިއުގައިވާ ${items.length || pendingCount} ރެކޯޑް ސިންކްވެފައިވާ ކަމަށް ކަނޑައަޅައި، ރީނދޫ ބެޖް ފިލުވާލަން ބޭނުންފުޅުތޯ؟`
      : `Mark all ${items.length || pendingCount} records as verified locally and clear the yellow sync badge?`;

    if (window.confirm(confirmMessage)) {
      setIsSyncing(true);
      try {
        const cleared = await syncEngine.forceMarkAllSynced();
        setSyncResult({
          success: true,
          message: isRTL
            ? `ކާމިޔާބުކަމާއެކު ${cleared} ރެކޯޑް ސިންކްވެފައިވާ ކަމަށް ބަދަލުކޮށް، ބެޖް ފިލުވާލެވިއްޖެ.`
            : `Successfully marked ${cleared} records as verified locally. Yellow badge cleared!`,
        });
        await loadItems();
        if (onSyncComplete) onSyncComplete();
      } catch (err: any) {
        setSyncResult({
          success: false,
          message: err?.message || 'Could not clear queue.',
        });
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleExportBackup = () => {
    if (items.length === 0) return;
    try {
      const data = items.map((it, idx) => ({
        '#': idx + 1,
        'Sync ID': it.clientSyncId,
        'Student ID': it.payload?.studentId,
        Date: it.payload?.date,
        Session: it.payload?.sessionType,
        Status: it.payload?.status,
        LeaveReason: it.payload?.leaveReason || 'NONE',
        MarkedBy: it.payload?.markedByUserId,
        UpdatedAt: it.payload?.updatedAt,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Offline Attendance Queue');
      XLSX.writeFile(wb, `Offline_Attendance_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Group items by date & session for summary
  const summaryByDateSession = items.reduce((acc, it) => {
    const key = `${it.payload?.date || 'Unknown'} • ${
      it.payload?.sessionType === 'MORNING_BEFORE_BREAK' ? 'Morning' : 'Post-Break'
    }`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh] shrink-0 relative"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip - Sticky at top */}
        <div className="bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 px-5 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold tracking-tight truncate">
                {isRTL ? 'އޮފްލައިން ހާޒިރީ ކިއު މެނޭޖަރު' : 'Offline Attendance Sync Manager'}
              </h3>
              <p className="text-xs text-amber-100 truncate">
                {isRTL
                  ? `ބްރައުޒަރގެ ލޯކަލް ސްޓޯރޭޖުގައި ${items.length || pendingCount} ރެކޯޑް އެބަހުއްޓެވެ`
                  : `${items.length || pendingCount} records safely saved offline in your browser`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0 ml-2"
            title={isRTL ? 'ލައްޕާލާ' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Result Alert if any */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                syncResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{syncResult.message}</div>
            </div>
          )}

          {/* Status Overview Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  {isRTL ? 'ރައްކާކުރެވިފައިވާ ތަން' : 'Storage Engine'}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                IndexedDB (Dexie.js)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {isRTL ? 'ކިއުގައިވާ ރެކޯޑްތަކުގެ އަދަދު' : 'Pending Offline Records'}:
              </span>
              <span className="text-sm font-black font-mono text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {items.length || pendingCount}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              {isRTL
                ? 'މި ރެކޯޑްތައް ވަނީ ބްރައުޒަރގެ އެތެރޭގައި ރައްކާކުރެވިފައެވެ. ސާވަރަށް އަޕްލޯޑްކުރުމަށް "ސިންކްކުރޭ" ފިއްތަވާ، ނުވަތަ ބެޖް ފިލުވާލުމަށް "ލޯކަލްކޮށް ސިންކްވެފައި ކަމަށް ކަނޑައަޅާ" ފިއްތަވާ.'
                : 'These attendance records are safely stored on this computer. If you want to clear the yellow badge immediately, click "Mark as Synced Locally & Clear Badge" below.'}
            </p>
          </div>

          {/* Breakdown summary if records exist */}
          {Object.keys(summaryByDateSession).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{isRTL ? 'ސެޝަންތަކުގެ ތަފްޞީލް' : 'Sessions in Queue'}:</span>
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white text-xs max-h-48 overflow-y-auto">
                {Object.entries(summaryByDateSession).map(([label, count]) => (
                  <div key={label} className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-mono text-slate-700">{label}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {count} {isRTL ? 'ދަރިވަރުން' : 'students'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing || (items.length === 0 && pendingCount === 0)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? isRTL
                    ? 'ސާވަރަށް ސިންކްވަނީ...'
                    : 'Syncing to Server...'
                  : isRTL
                  ? 'ސާވަރަށް ސިންކްކުރޭ'
                  : 'Sync to Server Now'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleForceClear}
              disabled={isSyncing || (items.length === 0 && pendingCount === 0)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Mark all records verified in browser and remove the yellow 176 badge"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {isRTL
                  ? 'ލޯކަލްކޮށް ސިންކްވެފައި ކަމަށް ކަނޑައަޅާ (ރީނދޫ ބެޖް ފިލުވާލާ)'
                  : 'Mark as Synced Locally & Clear Badge'}
              </span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{isRTL ? 'އެކްސެލް ބެކަޕް ޑައުންލޯޑްކުރޭ' : 'Download Backup (Excel)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {isRTL ? 'ބޭރުގައި ފިއްތާލުމުންވެސް ލެއްޕޭނެއެވެ' : 'Click outside or Esc to close'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200/70 hover:bg-slate-200 transition cursor-pointer"
          >
            {isRTL ? 'ލައްޕާލާ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
