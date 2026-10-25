import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { syncEngine, SyncState } from '../../lib/syncEngine';
import { useLanguage } from '../../i18n/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>('online_synced');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const { isRTL } = useLanguage();

  useEffect(() => {
    // 1. Subscribe to SyncEngine
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
      if (state === 'online_synced' && count === 0) {
        setJustSynced(true);
        const timer = setTimeout(() => setJustSynced(false), 4000);
        return () => clearTimeout(timer);
      }
    });

    // 2. Window online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncEngine.flushQueue().catch(() => {});
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsManualSyncing(true);
    try {
      await syncEngine.flushQueue();
    } finally {
      setIsManualSyncing(false);
    }
  };

  // If online and nothing is pending and not just synced, keep viewport clean
  if (isOnline && pendingCount === 0 && !justSynced && syncState !== 'syncing') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 pointer-events-auto transition-all duration-300">
      {/* 1. Offline Mode Active */}
      {!isOnline && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/95 text-white shadow-xl border border-amber-500/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-400">
                  {isRTL ? 'އޮފްލައިން މޯޑް' : 'Offline Mode (No Internet)'}
                </span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {pendingCount} {isRTL ? 'ރެކޯޑް' : 'pending'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {isRTL
                  ? 'ހާޒިރީ މާކުކުރެވޭނެ. އިންޓަނެޓް ލިބުމުން އަމިއްލައަށް ސިންކްވާނެ.'
                  : 'Attendance saved on mobile. Will auto-sync when online.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Online & Syncing in Progress */}
      {isOnline && (syncState === 'syncing' || isManualSyncing || pendingCount > 0) && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-sky-950/95 text-white shadow-xl border border-sky-500/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-sky-400 block">
                {isRTL ? 'އިންޓަނެޓް ލިބިއްޖެ - ސިންކްކުރެވެނީ...' : 'Internet Connected — Syncing...'}
              </span>
              <p className="text-[11px] text-slate-300 truncate">
                {pendingCount > 0
                  ? isRTL
                    ? `${pendingCount} ރެކޯޑް ސާވަރަށް ފޮނުވެނީ`
                    : `Uploading ${pendingCount} offline attendance record(s)...`
                  : isRTL
                  ? 'ސާވަރާ ގުޅައި ސިންކްކުރެވެނީ'
                  : 'Synchronizing with Ministry server...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="p-1.5 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shrink-0 transition active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ސިންކް' : 'Sync'}</span>
          </button>
        </div>
      )}

      {/* 3. Just Successfully Synced Flash */}
      {isOnline && justSynced && pendingCount === 0 && syncState === 'online_synced' && (
        <div className="flex items-center gap-2.5 p-2.5 px-3.5 rounded-2xl bg-emerald-950/95 text-white shadow-xl border border-emerald-500/40 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-200">
            {isRTL ? 'ހުރިހާ ހާޒިރީ ރެކޯޑެއް ސާވަރަށް ސިންކްވެއްޖެ ✓' : 'All attendance records synced with server ✓'}
          </span>
        </div>
      )}
    </div>
  );
};
