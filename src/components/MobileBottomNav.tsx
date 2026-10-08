import React from 'react';
import {
  GraduationCap,
  Mic,
  BarChart3,
  FileSpreadsheet,
  Menu,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoiceModal: () => void;
  onOpenMenuDrawer: () => void;
  hasRapidRollCallPrivilege?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoiceModal,
  onOpenMenuDrawer,
  hasRapidRollCallPrivilege = false,
}) => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* Tab 1: Attendance Matrix / Roll Call */}
        <button
          id="mobile-nav-attendance"
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition select-none relative ${
            activeTab === 'attendance'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition relative ${
              activeTab === 'attendance' ? 'bg-teal-50 shadow-xs' : ''
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            {hasRapidRollCallPrivilege && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs border border-white">
                <Zap className="w-2.5 h-2.5 fill-white" />
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight truncate max-w-[64px] flex items-center gap-0.5">
            {isRTL ? 'ހާޒިރީ' : 'Roll Call'}
            {hasRapidRollCallPrivilege && (
              <span className="text-[8px] font-black text-amber-600">⚡</span>
            )}
          </span>
        </button>

        {/* Tab 2: Instant AI Voice Dictate */}
        <button
          id="mobile-nav-voice"
          type="button"
          onClick={onOpenVoiceModal}
          className="flex flex-col items-center justify-center gap-1 h-full cursor-pointer group transition select-none"
        >
          <div className="w-10 h-10 -mt-3 rounded-full bg-linear-to-tr from-indigo-600 to-teal-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center group-hover:scale-105 active:scale-95 transition">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 leading-tight">
            {isRTL ? 'އަޑުން' : 'Voice'}
          </span>
        </button>

        {/* Tab 3: Analytics */}
        <button
          id="mobile-nav-analytics"
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition select-none ${
            activeTab === 'analytics'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'analytics' ? 'bg-teal-50 shadow-xs' : ''
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {isRTL ? 'ތަފާސްހިސާބު' : 'Stats'}
          </span>
        </button>

        {/* Tab 4: Reports */}
        <button
          id="mobile-nav-reports"
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition select-none ${
            activeTab === 'reports'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'reports' ? 'bg-teal-50 shadow-xs' : ''
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight truncate max-w-[64px]">
            {isRTL ? 'ރިޕޯޓް' : 'Reports'}
          </span>
        </button>

        {/* Tab 5: More Menu / Drawer */}
        <button
          id="mobile-nav-more"
          type="button"
          onClick={onOpenMenuDrawer}
          className="flex flex-col items-center justify-center gap-1 h-full cursor-pointer text-slate-500 hover:text-slate-800 transition select-none"
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight">
            {isRTL ? 'އިތުރު' : 'More'}
          </span>
        </button>
      </div>
    </div>
  );
};
