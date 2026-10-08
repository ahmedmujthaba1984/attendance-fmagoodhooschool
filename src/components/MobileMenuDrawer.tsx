import React from 'react';
import {
  X,
  UserCheck,
  LogOut,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  Layers,
  Database,
  Globe,
  RefreshCw,
  Wifi,
  ChevronRight,
  GraduationCap,
  Key,
  Lock,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyncModal: () => void;
  onOpenLoginView: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
  onOpenSuperAdminPasswords?: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  setActiveTab,
  onOpenSyncModal,
  onOpenLoginView,
  onManualSync,
  isSyncing = false,
  onOpenSuperAdminPasswords,
  onOpenChangePassword,
  onLogout,
}) => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv';

  const menuItems = [
    {
      id: 'extra_classes',
      label: isRTL ? 'އިތުރު ކްލާސްތަކާއި ހާޒިރީ' : 'Extra Classes & Attendance',
      icon: BookOpen,
      desc: isRTL ? 'އިތުރު ކްލާސް ޝެޑިއުލް، އެޕްރޫވަލް އަދި ހާޒިރީ' : 'Schedule, approval & attendance',
      action: () => {
        setActiveTab('extra_classes');
        onClose();
      },
    },
    {
      id: 'sync',
      label: isRTL ? 'މަގޫދޫ ޑައިރެކްޓަރީ ސިންކް' : 'Portal Directory Sync',
      icon: Database,
      desc: isRTL ? 'ލައިވް ސްޓޫޑެންޓް ޑޭޓާބޭސް' : 'Live remote student roster',
      action: () => {
        onOpenSyncModal();
        onClose();
      },
    },
    {
      id: 'delegations',
      label: t.navDelegations,
      icon: Users,
      desc: isRTL ? 'ސަބްސްޓިޓިއުޓް ޓީޗަރުން' : 'Substitute teacher roster',
      action: () => {
        setActiveTab('delegations');
        onClose();
      },
    },
    {
      id: 'calendar',
      label: t.navCalendar,
      icon: Calendar,
      desc: isRTL ? 'ދިވެހިރާއްޖޭގެ އެކަޑަމިކް ކަލަންޑަރު' : 'Maldives academic holidays',
      action: () => {
        setActiveTab('calendar');
        onClose();
      },
    },
    {
      id: 'ai',
      label: t.navAiAssistant,
      icon: Sparkles,
      desc: isRTL ? 'ޖެމިނައި އޭއައި އެސިސްޓެންޓް' : 'Gemini AI intelligence brief',
      action: () => {
        setActiveTab('ai');
        onClose();
      },
    },
    {
      id: 'audit',
      label: t.navAudit,
      icon: ShieldCheck,
      desc: isRTL ? 'އޮޑިޓް އަދި ބަދަލުތަކުގެ ލޮގް' : 'Compliance & activity logs',
      action: () => {
        setActiveTab('audit');
        onClose();
      },
    },
    {
      id: 'schema',
      label: t.navSchema,
      icon: Layers,
      desc: isRTL ? 'ޑޭޓާބޭސް ސްކީމާ' : 'Offline Dexie & SQL schema',
      action: () => {
        setActiveTab('schema');
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Card Sheet */}
      <div
        className={`relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-200 ${
          isRTL ? 'font-thaana' : 'font-sans'
        }`}
      >
        {/* Header handle & Close button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {isRTL ? 'ފ. މަގޫދޫ ސްކޫލް' : 'F. Magoodhoo School'}
              </div>
              <div className="text-[10px] text-slate-500">SCH-F02 • Maldives</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Profile Card */}
        <div className="p-3.5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
              {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">
                {isRTL ? currentUser?.fullNameDhivehi || currentUser?.fullName : currentUser?.fullName}
              </div>
              <div className="text-[11px] text-teal-300 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{currentUser?.designation || t.teacher}</span>
                {currentUser?.assignedGrade && (
                  <span>• {currentUser.assignedGrade}</span>
                )}
                {(currentUser?.hasRapidRollCallPrivilege || currentUser?.loginViaMobile) && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] shadow-2xs">
                    <Zap className="w-2.5 h-2.5 fill-amber-950" />
                    <span>{isRTL ? 'ހަލުވި ހާޒިރީގެ އިމްތިޔާޒު' : 'Rapid Roll Call'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Switch Staff / Login Button */}
          <button
            id="mobile-drawer-switch-staff"
            type="button"
            onClick={() => {
              onOpenLoginView();
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ބަދަލުކުރޭ' : 'Switch'}</span>
          </button>
        </div>

        {/* Rapid Roll Call Shortcut for Privileged Staff */}
        {(currentUser?.hasRapidRollCallPrivilege || currentUser?.loginViaMobile) && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('attendance');
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs flex items-center justify-between shadow-md cursor-pointer transition active:scale-98"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <div className="text-xs font-black leading-tight">
                  {isRTL ? 'ހަލުވި ހާޒިރީ (Rapid Roll Call)' : 'Launch Rapid Roll Call'}
                </div>
                <div className="text-[10px] text-amber-100 font-normal">
                  {isRTL ? '1-ކްލިކުން ހާޒިރީ ފުރުމުގެ ޚާއްޞަ އިމްތިޔާޒު' : 'Instant 1-tap touch attendance marking'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}

        {/* Quick Utilities Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition cursor-pointer"
          >
            <Globe className="w-4 h-4 text-teal-600" />
            <span>{language === 'en' ? 'ދިވެހި ބަސް' : 'English'}</span>
          </button>

          {onManualSync && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-teal-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isRTL ? 'ސިންކް ކުރޭ' : 'Sync Offline'}</span>
            </button>
          )}
        </div>

        {/* Secondary Modules List */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            {isRTL ? 'އިތުރު މޮޑިއުލްތައް' : 'School Management Modules'}
          </div>

          {/* Super Admin Passwords Item */}
          {isSuperAdmin && onOpenSuperAdminPasswords && (
            <button
              type="button"
              onClick={() => {
                onOpenSuperAdminPasswords();
                onClose();
              }}
              className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <span>{isRTL ? 'ސްޓާފް ޕާސްވޯޑްތައް' : 'Staff Password Center'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-black">
                      SUPER ADMIN
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-800">Reset all passwords to 1234 or edit</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700" />
            </button>
          )}

          {/* Change Password Item */}
          {onOpenChangePassword && (
            <button
              type="button"
              onClick={() => {
                onOpenChangePassword();
                onClose();
              }}
              className="w-full p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-left flex items-center justify-between gap-3 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {isRTL ? 'ޕާސްވޯޑް ބަދަލުކުރުން' : 'Change My Password'}
                  </div>
                  <div className="text-[10px] text-slate-500">Self-service password update</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isTabActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                  isTabActive
                    ? 'bg-teal-50 border-teal-200 text-teal-900 font-semibold'
                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isTabActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>{isRTL ? 'ޕޯޓަލުން ބޭރުވުން (ލޮގްއައުޓް)' : 'Sign Out of Portal'}</span>
            </button>
          </div>
        )}

        {/* PWA Install */}
        <div className="pt-2 border-t border-slate-100 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
