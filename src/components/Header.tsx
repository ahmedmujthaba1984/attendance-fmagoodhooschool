import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Sparkles,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Layers,
  GraduationCap,
  Database,
  Key,
  Lock,
  LogOut,
  ShieldAlert,
  Mail,
  BookOpen,
  RotateCcw,
  Zap,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { syncEngine, SyncState } from '../lib/syncEngine';
import { User } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  staffList: User[];
  studentsCount?: number;
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onOpenSyncModal?: () => void;
  onOpenLoginView?: () => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  onOpenSuperAdminPasswords?: () => void;
  onResetAllAttendance?: () => void;
  pendingExtraClassesCount?: number;
  onOpenTimingsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  staffList,
  studentsCount,
  currentUser,
  onSwitchUser,
  onOpenSyncModal,
  onOpenLoginView,
  onLogout,
  onOpenChangePassword,
  onOpenSuperAdminPasswords,
  onResetAllAttendance,
  pendingExtraClassesCount,
  onOpenTimingsModal,
}) => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const [syncState, setSyncState] = useState<SyncState>('online_synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showStaffMenu, setShowStaffMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.flushQueue();
    setIsSyncing(false);
  };

  const navItems = [
    { id: 'attendance', label: t.navAttendance, icon: GraduationCap },
    {
      id: 'extra_classes',
      label: isRTL ? 'އިތުރު ކްލާސްތައް' : 'Extra Classes',
      icon: BookOpen,
      badge: pendingExtraClassesCount && pendingExtraClassesCount > 0 ? pendingExtraClassesCount : undefined,
    },
    { id: 'analytics', label: t.navAnalytics, icon: BarChart3 },
    { id: 'reports', label: t.navReports, icon: FileSpreadsheet },
    { id: 'sync', label: isRTL ? 'ޑައިރެކްޓަރީ ސިންކް' : 'Portal Sync', icon: Database, highlight: true },
    { id: 'delegations', label: t.navDelegations, icon: Users },
    { id: 'calendar', label: t.navCalendar, icon: Calendar },
    { id: 'ai', label: t.navAiAssistant, icon: Sparkles },
    { id: 'audit', label: t.navAudit, icon: ShieldCheck },
    { id: 'schema', label: t.navSchema, icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner: Maldivian Authority & Connectivity Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs px-3 sm:px-4 py-1 flex items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          {/* Maldivian Crescent & Palm Emblem */}
          <div className="w-4 h-4 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
            🇲🇻
          </div>
          <span className="font-medium tracking-wide truncate text-[11px] sm:text-xs">
            {isRTL ? 'މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަން' : 'Ministry of Education'}
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-300 font-semibold truncate">
            {isRTL ? 'ފ. މަގޫދޫ ސްކޫލް' : 'F. Magoodhoo School'}
          </span>
        </div>

        {/* Connectivity & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {syncState === 'online_synced' && (
            <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px] sm:text-xs">
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">{isRTL ? 'އޮންލައިން' : 'Online'}</span>
            </div>
          )}

          {syncState === 'offline_saved' && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>{pendingCount}</span>
              </span>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-[10px] transition cursor-pointer"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isRTL ? 'ސިންކް' : 'Sync'}</span>
              </button>
            </div>
          )}

          {syncState === 'syncing' && (
            <div className="flex items-center gap-1 text-sky-400 animate-pulse font-medium text-[11px]">
              <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden xs:inline">{isRTL ? 'ސިންކް...' : 'Sync...'}</span>
            </div>
          )}

          {/* Language Switcher */}
          <button
            id="language-toggle-btn"
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-[11px] sm:text-xs transition cursor-pointer border border-slate-700"
            title="Toggle between English and Dhivehi Thaana"
          >
            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-bold">{language === 'en' ? 'ދިވެހި' : 'En'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* School Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-sky-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {isRTL ? t.schoolNameDhivehi : t.schoolName}
              </h1>
              <span className="hidden xs:inline px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold uppercase rounded bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                {isRTL ? 'ހާޒިރީ' : 'Portal'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 truncate hidden sm:block">
              {isRTL
                ? `${studentsCount || 215} ދަރިވަރުން • 12 ގްރޭޑް • ${staffList.length || 46} ސްޓާފުން`
                : `${studentsCount || 215} Students • 12 Grades • ${staffList.length || 46} Staff`}
            </p>
          </div>
        </div>

        {/* Right Section: Active Staff Profile & Install PWA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Session Timings Direct Button */}
          {onOpenTimingsModal && (
            <button
              type="button"
              id="header-session-timings-btn"
              onClick={onOpenTimingsModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold shadow-2xs transition cursor-pointer"
              title={isRTL ? 'ސެޝަން ވަގުތުތައް ބަދަލުކުރުން' : 'Configure Session Timings & Duration'}
            >
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden md:inline">{isRTL ? 'ސެޝަން ގަޑިތައް' : 'Session Timings'}</span>
            </button>
          )}

          {/* Super Admin Direct Access Button */}
          {((currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv') && onOpenSuperAdminPasswords) && (
            <button
              type="button"
              onClick={onOpenSuperAdminPasswords}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black shadow-2xs transition cursor-pointer"
              title="Manage staff passwords and reset to 1234"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>{isRTL ? 'ސްޓާފް ޕާސްވޯޑްތައް' : 'Staff Passwords'}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black">
                SUPER ADMIN
              </span>
            </button>
          )}

          {/* Staff Switcher / Profile Dropdown */}
          <div className="relative">
            <button
              id="staff-selector-btn"
              type="button"
              onClick={() => setShowStaffMenu(!showStaffMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>{isRTL ? currentUser?.fullNameDhivehi || currentUser?.fullName : currentUser?.fullName}</span>
                  {(currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv') && (
                    <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black">
                      SUPER
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  {currentUser?.role === 'ADMIN' ? (
                    <span className="text-amber-700 font-semibold">{t.admin}</span>
                  ) : (
                    <span>{currentUser?.designation || t.teacher}</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showStaffMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                {/* Active User Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                    <span>{isRTL ? currentUser?.fullNameDhivehi || currentUser?.fullName : currentUser?.fullName}</span>
                    {(currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv') ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black">
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        {currentUser?.role || 'STAFF'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-teal-800 font-mono flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="truncate">{currentUser?.email}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{currentUser?.designation} • {currentUser?.staffId}</span>
                    {(currentUser?.hasRapidRollCallPrivilege || currentUser?.loginViaMobile) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px]">
                        <Zap className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                        <span>Rapid</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="space-y-1">
                  {/* Super Admin Password Management Option */}
                  {((currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv') && onOpenSuperAdminPasswords) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffMenu(false);
                        onOpenSuperAdminPasswords();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <div>{isRTL ? 'ސްޓާފް ޕާސްވޯޑް މެނޭޖްމަންޓް' : 'Staff Password Management'}</div>
                        <div className="text-[10px] text-amber-700/80 font-normal">
                          Reset all to 1234 or manage staff passwords
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Super Admin Reset All Attendance Option */}
                  {((currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv') && onResetAllAttendance) && (
                    <button
                      id="reset-all-attendance-header-btn"
                      type="button"
                      onClick={() => {
                        setShowStaffMenu(false);
                        onResetAllAttendance();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 font-bold text-xs flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                      <div className="flex-1">
                        <div>{isRTL ? 'ހުރިހާ ހާޒިރީއެއް ފޮހެލާ / ރީސެޓް' : 'Reset All Attendance'}</div>
                        <div className="text-[10px] text-rose-700/80 font-normal">
                          {isRTL ? 'ހުރިހާ ދަންފަޅިތަކެއްގެ ހާޒިރީ ރީސެޓްކުރުން' : 'Clear all attendance records & reset marked sessions'}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Session Timings & Duration Settings */}
                  {onOpenTimingsModal && (
                    <button
                      type="button"
                      id="dropdown-session-timings-btn"
                      onClick={() => {
                        setShowStaffMenu(false);
                        onOpenTimingsModal();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="flex-1">
                        <div>{isRTL ? 'ސެޝަން ވަގުތުތައް' : 'Session Timings & Duration'}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {isRTL ? 'ހެނދުނާއި މެންދުރުފަހުގެ ގަޑިތައް ކަނޑައެޅުން' : 'Configure morning and afternoon bell timings'}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Change Password for Self */}
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffMenu(false);
                        onOpenChangePassword();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{isRTL ? 'ޕާސްވޯޑް ބަދަލުކުރުން' : 'Change My Password'}</span>
                    </button>
                  )}

                  {/* Switch Staff (Prompt Login) */}
                  {onOpenLoginView && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffMenu(false);
                        onOpenLoginView();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{isRTL ? 'އެހެން ސްޓާފެއްގެ އެކައުންޓަށް ވަނުން' : 'Switch Staff (Login)'}</span>
                    </button>
                  )}

                  {/* Sign Out */}
                  {onLogout && (
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowStaffMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{isRTL ? 'ޕޯޓަލުން ބޭރުވުން' : 'Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (Desktop only - mobile uses MobileBottomNav & MobileMenuDrawer) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav-tab-${item.id}`}
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${item.highlight && !isActive ? 'text-indigo-600 font-bold bg-indigo-50/70 hover:bg-indigo-100' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                      isActive ? 'bg-white text-teal-900' : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
