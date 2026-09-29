import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  Search,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
  Table,
  CloudRain,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { AcademicCalendarDay, AcademicDayType } from '../types';

interface AcademicCalendarModalProps {
  calendar: AcademicCalendarDay[];
  onToggleDayType: (
    date: string,
    dayType: AcademicDayType,
    description?: string,
    descriptionDhivehi?: string
  ) => void;
  onSaveHoliday?: (holiday: {
    id?: string;
    date: string;
    endDate?: string;
    dayType: AcademicDayType;
    description: string;
    descriptionDhivehi?: string;
  }) => Promise<void> | void;
  onDeleteHoliday?: (id: string) => Promise<void> | void;
  onRefreshCalendar?: () => Promise<void> | void;
  onResetCalendar?: () => Promise<void> | void;
  onSelectDate?: (date: string) => void;
}

// Preset Maldives official holidays for fast 1-click admin population
const MALDIVES_HOLIDAY_PRESETS = [
  { en: 'Day Maldives Embraced Islam', dv: 'ރާއްޖެ އިސްލާމްވި ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'National Day (Qaumee Dhuvas)', dv: 'ޤައުމީ ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Eid al-Fitr (Fith\'r Eid)', dv: 'ފިޠުރު ޢީދު ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Eid al-Adha (Bodu Eid)', dv: 'އަޟްޙާ ޢީދު ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Independence Day (Minivan Dhuvas)', dv: 'މިނިވަން ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Republic Day (Jumhooree Dhuvas)', dv: 'ޖުމްހޫރީ ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Victory Day (Nasru Dhuvas)', dv: 'ނަޞްރުގެ ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Labour Day', dv: 'މަސައްކަތްތެރިންގެ ދުވަސް', type: 'PUBLIC_HOLIDAY' as AcademicDayType },
  { en: 'Monsoon Weather Alert Closure', dv: 'މޫސުމީ ސަބަބަކާހުރެ ސްކޫލް ބަންދު', type: 'SCHOOL_CLOSED_WEATHER' as AcademicDayType },
  { en: 'Mid Term Break', dv: 'މިޑް ޓާމް ބްރޭކް', type: 'TERM_BREAK' as AcademicDayType },
];

export const AcademicCalendarModal: React.FC<AcademicCalendarModalProps> = ({
  calendar,
  onToggleDayType,
  onSaveHoliday,
  onDeleteHoliday,
  onRefreshCalendar,
  onResetCalendar,
  onSelectDate,
}) => {
  const { t, isRTL } = useLanguage();

  // Active view: 'grid' matches user's screenshot, 'list' shows the table list
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dynamic calculation for today's date (e.g. 2026-09-11 Friday)
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayDateStr();

  // Month navigation: default to current month / year (September 2026)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Holiday Edit / Create Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [formDate, setFormDate] = useState(todayDateStr);
  const [formEndDate, setFormEndDate] = useState(todayDateStr);
  const [isDateRange, setIsDateRange] = useState(false);
  const [formDayType, setFormDayType] = useState<AcademicDayType>('PUBLIC_HOLIDAY');
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionDhivehi, setFormDescriptionDhivehi] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<AcademicCalendarDay | null>(null);

  // Search filter for holiday list / search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AcademicDayType>('ALL');

  // Weather quick override state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState(todayDateStr);
  const [overrideType, setOverrideType] = useState<AcademicDayType>('SCHOOL_CLOSED_WEATHER');
  const [overrideDesc, setOverrideDesc] = useState('Yellow Alert - Monsoon Swell Warning');
  const [overrideDescDv, setOverrideDescDv] = useState('މޫސުމީ ޔެލޯ އެލާޓް - ވިއްސާރަވުމުގެ ސަބަބުން ސްކޫލް ބަންދު');

  // Month Name formatting
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesDhivehi = [
    'ޖެނުއަރީ', 'ފެބްރުއަރީ', 'މާރިޗު', 'އޭޕްރީލް', 'މެއި', 'ޖޫން',
    'ޖުލައި', 'އޯގަސްޓް', 'ސެޕްޓެމްބަރ', 'އޮކްޓޯބަރ', 'ނޮވެމްބަރ', 'ޑިސެމްބަރ',
  ];

  const currentMonthName = isRTL ? monthNamesDhivehi[currentMonth] : monthNames[currentMonth];

  // Calendar Day Type styling definitions
  const dayTypeBadges: Partial<Record<AcademicDayType, { label: string; bg: string; text: string; border: string }>> = {
    PUBLIC_HOLIDAY: {
      label: isRTL ? 'ޤައުމީ ބަންދު' : 'Public Holiday',
      bg: 'bg-emerald-50 text-emerald-800',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    TERM_BREAK: {
      label: isRTL ? 'ޓާމް ޗުއްޓީ' : 'Term Break',
      bg: 'bg-indigo-50 text-indigo-800',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    SCHOOL_CLOSED: {
      label: isRTL ? 'ސްކޫލް ބަންދު' : 'School Closed',
      bg: 'bg-rose-50 text-rose-800',
      text: 'text-rose-800',
      border: 'border-rose-200',
    },
    SCHOOL_CLOSED_WEATHER: {
      label: isRTL ? 'މޫސުމީ ބަންދު' : 'Weather Closure',
      bg: 'bg-cyan-50 text-cyan-800',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
    },
    EXAMINATION_DAY: {
      label: isRTL ? 'އިމްތިޙާނު ދުވަސް' : 'Exam Day',
      bg: 'bg-amber-50 text-amber-800',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    SPECIAL_ACTIVITY_DAY: {
      label: isRTL ? 'ޚާއްޞަ ޙަރަކާތް' : 'Special Activity',
      bg: 'bg-teal-50 text-teal-800',
      text: 'text-teal-800',
      border: 'border-teal-200',
    },
    NON_TEACHING_DAY: {
      label: isRTL ? 'ކިޔަވައިނުދޭ ދުވަސް' : 'Non-Teaching',
      bg: 'bg-slate-100 text-slate-700',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    REGULAR_TEACHING_DAY: {
      label: isRTL ? 'ކިޔަވައިދޭ ދުވަސް' : 'Teaching Day',
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
  };

  // Count total official public holidays
  const publicHolidaysCount = useMemo(() => {
    return calendar.filter((c) => c.dayType === 'PUBLIC_HOLIDAY').length;
  }, [calendar]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToCurrent = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Open Create Modal prefilled with optional date
  const handleOpenCreate = (targetDate?: string) => {
    setModalMode('create');
    setEditingId(undefined);
    const dateToUse =
      targetDate ||
      (currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()
        ? todayDateStr
        : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);
    setFormDate(dateToUse);
    setFormEndDate(dateToUse);
    setIsDateRange(false);
    setFormDayType('PUBLIC_HOLIDAY');
    setFormDescription('');
    setFormDescriptionDhivehi('');
    setIsEditModalOpen(true);
  };

  // Open Edit Modal for an existing calendar entry
  const handleOpenEdit = (day: AcademicCalendarDay) => {
    setModalMode('edit');
    setEditingId(day.id);
    setFormDate(day.date);
    setFormEndDate(day.date);
    setIsDateRange(false);
    setFormDayType(day.dayType);
    setFormDescription(day.description);
    setFormDescriptionDhivehi(day.descriptionDhivehi || '');
    setIsEditModalOpen(true);
  };

  // Apply a Maldives holiday preset into form
  const handleApplyPreset = (preset: typeof MALDIVES_HOLIDAY_PRESETS[0]) => {
    setFormDescription(preset.en);
    setFormDescriptionDhivehi(preset.dv);
    setFormDayType(preset.type);
  };

  // Save holiday submit
  const handleSaveHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formDescription.trim()) return;

    setIsSaving(true);
    try {
      if (onSaveHoliday) {
        await onSaveHoliday({
          id: editingId,
          date: formDate,
          endDate: isDateRange ? formEndDate : undefined,
          dayType: formDayType,
          description: formDescription.trim(),
          descriptionDhivehi: formDescriptionDhivehi.trim() || formDescription.trim(),
        });
      } else {
        onToggleDayType(formDate, formDayType, formDescription, formDescriptionDhivehi);
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save holiday:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm and execute holiday delete
  const handleExecuteDelete = async () => {
    if (!deleteTarget || !onDeleteHoliday) return;
    setIsSaving(true);
    try {
      await onDeleteHoliday(deleteTarget.id);
      setDeleteTarget(null);
      if (isEditModalOpen && editingId === deleteTarget.id) {
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete holiday:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh calendar data from backend
  const handleExecuteRefresh = async () => {
    if (onRefreshCalendar) {
      setIsRefreshing(true);
      try {
        await onRefreshCalendar();
      } catch (err) {
        console.error('Failed to refresh calendar:', err);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Reset to default Maldives holidays
  const handleResetToOfficialHolidays = async () => {
    if (onResetCalendar) {
      setIsResetting(true);
      try {
        await onResetCalendar();
      } catch (err) {
        console.error('Failed to reset calendar:', err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Quick Weather / School Closure Override Form
  const handleApplyQuickOverride = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleDayType(overrideDate, overrideType, overrideDesc, overrideDescDv);
    setIsOverrideOpen(false);
  };

  // Generate Month Grid Matrix
  // Maldivian standard: 7 columns starting Sunday (0) to Saturday (6)
  // Friday (5) and Saturday (6) are Weekend
  const monthMatrix = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // Create days array
    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      weekendType?: 'FRI' | 'SAT';
      isToday: boolean;
      events: AcademicCalendarDay[];
    }> = [];

    // Empty cells before 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({
        dayNumber: 0,
        dateStr: '',
        isCurrentMonth: false,
        isWeekend: i === 5 || i === 6,
        weekendType: i === 5 ? 'FRI' : i === 6 ? 'SAT' : undefined,
        isToday: false,
        events: [],
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const weekendType = dayOfWeek === 5 ? 'FRI' : dayOfWeek === 6 ? 'SAT' : undefined;
      const isToday = dateStr === todayDateStr;

      // Find all events/holidays on this date
      const events = calendar.filter((c) => c.date === dateStr);

      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isWeekend,
        weekendType,
        isToday,
        events,
      });
    }

    return cells;
  }, [currentYear, currentMonth, calendar]);

  // Filter for Holiday List view
  const filteredHolidays = useMemo(() => {
    return calendar
      .filter((item) => {
        if (categoryFilter !== 'ALL' && item.dayType !== categoryFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.date.includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.descriptionDhivehi && item.descriptionDhivehi.toLowerCase().includes(q)) ||
          item.dayType.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [calendar, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Deep Emerald Green Banner (Matches Screenshot) */}
      <div className="bg-[#03624c] rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white leading-tight">
                {isRTL
                  ? 'ދިވެހިރާއްޖޭގެ ރަސްމީ ބަންދުތަކާއި މަސައްކަތު ދުވަސްތަކުގެ ކަލަންޑަރު'
                  : 'Maldives Public Holidays & Working Days Calendar'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed pl-10.5">
              {isRTL
                ? 'ދިވެހިރާއްޖޭގައި، މުވައްޒަފުންގެ ޗުއްޓީ ގުނަނީ މަސައްކަތު ދުވަސްތަކަށް އެކަންޏެވެ. ހުކުރު، ހޮނިހިރު އަދި ސަރުކާރު ބަންދު ދުވަސްތައް އޮޓަމެޓިކުން އުނިކުރެވޭނެއެވެ.'
                : 'In the Maldives, staff leaves are calculated strictly on working days. Fridays, Saturdays (weekends), and official Public Holidays are excluded automatically.'}
            </p>
          </div>

          {/* Action Buttons in Banner */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center pl-10.5 md:pl-0">
            <button
              type="button"
              id="banner-add-holiday-btn"
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#03624c] font-extrabold text-xs transition shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isRTL ? 'އައު ބަންދެއް އިތުރުކުރޭ' : '+ Add Public Holiday'}</span>
            </button>

            {/* Refresh / Re-fetch calendar data */}
            <button
              type="button"
              id="banner-refresh-calendar-btn"
              onClick={handleExecuteRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-emerald-700/50 hover:bg-emerald-700 text-white border border-emerald-500/40 transition cursor-pointer disabled:opacity-50"
              title={isRTL ? 'ކަލަންޑަރު އައުކޮށްލާ (ޑޭޓާ ރިފްރެޝް)' : 'Refresh Calendar Data'}
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Reset to official Maldives holidays with safe confirmation dialog */}
            {onResetCalendar && (
              <button
                type="button"
                id="banner-reset-calendar-btn"
                onClick={() => setIsConfirmResetOpen(true)}
                disabled={isResetting}
                className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/40 transition cursor-pointer disabled:opacity-50"
                title={isRTL ? 'ރަސްމީ ކަލަންޑަރަށް އަލުން ބަދަލުކުރޭ' : 'Restore Official Maldives Schedule'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Weather / Closure Quick Override Toggle */}
            <button
              type="button"
              onClick={() => setIsOverrideOpen(!isOverrideOpen)}
              className="px-3 py-2.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Monsoon Weather / Emergency Closure"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Weather Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Weather / Unscheduled Closure Quick Override Bar */}
      {isOverrideOpen && (
        <form
          onSubmit={handleApplyQuickOverride}
          className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 shadow-xs space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sky-950">
              <CloudRain className="w-4 h-4 text-sky-700" />
              <span>
                {isRTL
                  ? 'މޫސުމީ ނުވަތަ ޚާއްޞަ ސަބަބަކާހުރެ ސްކޫލް ބަންދުކުރުން'
                  : 'Quick Weather Warning / Emergency School Closure'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOverrideOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.dayType}</label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as AcademicDayType)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium cursor-pointer"
              >
                <option value="SCHOOL_CLOSED_WEATHER">Monsoon Weather Closure (Yellow Alert)</option>
                <option value="SCHOOL_CLOSED">Emergency Administrative Closure</option>
                <option value="PUBLIC_HOLIDAY">Ad-hoc Public Holiday</option>
                <option value="REGULAR_TEACHING_DAY">Revert to Regular Teaching Day</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason (English)</label>
              <input
                type="text"
                value={overrideDesc}
                onChange={(e) => setOverrideDesc(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason (Dhivehi)</label>
              <input
                type="text"
                dir="rtl"
                value={overrideDescDv}
                onChange={(e) => setOverrideDescDv(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-dhivehi"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOverrideOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Apply Closure
            </button>
          </div>
        </form>
      )}

      {/* 2. Subheader Bar: Month Navigation & View Switcher (Matches Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Navigation Controls (< Month Year > Current) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="cal-prev-month-btn"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition cursor-pointer shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-2 font-extrabold text-slate-900 text-base sm:text-lg min-w-36 text-center tracking-tight select-none">
            {currentMonthName} {currentYear}
          </div>

          <button
            type="button"
            id="cal-next-month-btn"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition cursor-pointer shadow-2xs"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="cal-current-month-btn"
            onClick={handleGoToCurrent}
            className={`px-3 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
              currentMonth === 8 && currentYear === 2026
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {isRTL ? 'މިހާރު' : 'Current'}
          </button>
        </div>

        {/* Right: View Switcher (Calendar Grid | Holiday List (18)) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              id="toggle-calendar-grid-view"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white shadow-xs text-emerald-950 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isRTL ? 'ކަލަންޑަރު ގްރިޑް' : 'Calendar Grid'}</span>
            </button>

            <button
              type="button"
              id="toggle-holiday-list-view"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white shadow-xs text-emerald-950 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-slate-600" />
              <span>
                {isRTL ? `ބަންދުތަކުގެ ލިސްޓް (${publicHolidaysCount})` : `Holiday List (${publicHolidaysCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Body: Calendar Grid View or Holiday List View */}
      {viewMode === 'grid' ? (
        /* CALENDAR GRID (Exact styling from screenshot) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <div className="min-w-[660px] sm:min-w-full">
            {/* 7 Columns Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 text-center select-none">
            {/* Sun - Thu: Normal Weekdays */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map((day) => (
              <div
                key={day}
                className="py-3 px-2 border-r border-slate-100 last:border-r-0 font-bold text-xs sm:text-sm text-slate-700 bg-slate-50/70"
              >
                {day}
              </div>
            ))}

            {/* Fri: Weekend (Light Pink/Red) */}
            <div className="py-2 px-2 border-r border-slate-100 bg-rose-50/70 text-center">
              <div className="font-extrabold text-xs sm:text-sm text-rose-700">Fri</div>
              <div className="text-[10px] font-semibold text-rose-400">Weekend</div>
            </div>

            {/* Sat: Weekend (Light Pink/Red) */}
            <div className="py-2 px-2 bg-rose-50/70 text-center">
              <div className="font-extrabold text-xs sm:text-sm text-rose-700">Sat</div>
              <div className="text-[10px] font-semibold text-rose-400">Weekend</div>
            </div>
          </div>

          {/* Grid Cells (7 columns) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/40">
            {monthMatrix.map((cell, idx) => {
              // Empty leading cell before month start
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className={`min-h-24 sm:min-h-32 p-2 ${
                      cell.isWeekend ? 'bg-rose-50/20' : 'bg-slate-50/40'
                    }`}
                  />
                );
              }

              // Active day in month
              return (
                <div
                  key={cell.dateStr}
                  id={`calendar-cell-${cell.dateStr}`}
                  className={`min-h-24 sm:min-h-32 p-2 relative flex flex-col justify-between transition group ${
                    cell.isToday
                      ? cell.isWeekend
                        ? 'border-2 border-amber-400 bg-amber-50/35 rounded-xl m-0.5 shadow-2xs ring-1 ring-amber-300/40'
                        : 'border-2 border-amber-400 bg-amber-50/20 rounded-xl m-0.5 shadow-2xs'
                      : cell.isWeekend
                      ? 'bg-rose-50/25 hover:bg-rose-50/45'
                      : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  {/* Top Row in Cell: Day Number & Weekend tag */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    {/* Day Number */}
                    {cell.isToday ? (
                      <div className="inline-flex items-center gap-1">
                        <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                          {cell.dayNumber}
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          Today
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-xs sm:text-sm font-extrabold ${
                          cell.isWeekend ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    )}

                    {/* Weekend Day Indicator (e.g. FRI, SAT matching screenshot) */}
                    {cell.weekendType && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/90 select-none">
                        {cell.weekendType}
                      </span>
                    )}

                    {/* Hover "+ Add" quick button on empty day */}
                    {cell.events.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(cell.dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                        title={`Add holiday/event on ${cell.dateStr}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Holiday / Event Cards inside Cell */}
                  <div className="space-y-1.5 flex-1">
                    {cell.events.map((ev) => {
                      const isPublic = ev.dayType === 'PUBLIC_HOLIDAY';
                      const isWeather = ev.dayType === 'SCHOOL_CLOSED_WEATHER';
                      const isTermBreak = ev.dayType === 'TERM_BREAK';

                      return (
                        <div
                          key={ev.id}
                          id={`holiday-card-${ev.id}`}
                          className={`rounded-xl p-2 sm:p-2.5 border transition shadow-2xs flex flex-col justify-between ${
                            isPublic
                              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                              : isWeather
                              ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                              : isTermBreak
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                              : 'bg-amber-50 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div>
                            {/* Pill with day number (as shown on 13th in screenshot) */}
                            <div className="mb-1">
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                  isPublic
                                    ? 'bg-emerald-200/80 text-emerald-900'
                                    : isWeather
                                    ? 'bg-cyan-200 text-cyan-900'
                                    : 'bg-indigo-200 text-indigo-900'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                            </div>

                            {/* English Name */}
                            <div className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 text-slate-900">
                              {ev.description}
                            </div>

                            {/* Dhivehi Name */}
                            {ev.descriptionDhivehi && (
                              <div
                                dir="rtl"
                                className="text-[11px] text-slate-600 font-dhivehi leading-snug mt-0.5 line-clamp-1"
                              >
                                {ev.descriptionDhivehi}
                              </div>
                            )}
                          </div>

                          {/* Action icons at bottom-right (Pencil edit & Trash delete) */}
                          <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-black/5">
                            {onSelectDate ? (
                              <button
                                type="button"
                                onClick={() => onSelectDate(ev.date)}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                                title="View attendance register"
                              >
                                Roster →
                              </button>
                            ) : (
                              <div />
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Edit Icon */}
                              <button
                                type="button"
                                id={`edit-holiday-btn-${ev.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(ev);
                                }}
                                className="p-1 rounded-md text-slate-500 hover:text-emerald-800 hover:bg-white/80 transition cursor-pointer shadow-2xs"
                                title={isRTL ? 'ބަދަލުކުރޭ' : 'Edit Holiday'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Icon */}
                              {onDeleteHoliday && (
                                <button
                                  type="button"
                                  id={`delete-holiday-btn-${ev.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(ev);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white/80 transition cursor-pointer shadow-2xs"
                                  title={isRTL ? 'އުނިކުރޭ' : 'Delete Holiday'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty cell quick trigger */}
                  {cell.events.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(cell.dateStr)}
                      className="w-full text-left mt-auto pt-2 text-[10px] font-semibold text-slate-300 group-hover:text-slate-500 transition cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      ) : (
        /* HOLIDAY LIST VIEW (Tabular searchable view of all holidays) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* List Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRTL ? 'ބަންދު ހޯދާ...' : 'Search holidays, dates, or dhivehi titles...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="PUBLIC_HOLIDAY">Public Holidays (ޤައުމީ ބަންދު)</option>
                <option value="TERM_BREAK">Term Breaks (ޓާމް ޗުއްޓީ)</option>
                <option value="SCHOOL_CLOSED_WEATHER">Weather Closures (މޫސުމީ ބަންދު)</option>
                <option value="SCHOOL_CLOSED">School Closed (ސްކޫލް ބަންދު)</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#03624c] hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRTL ? 'އައު ބަންދެއް' : 'Add Holiday'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day of Week</th>
                  <th className="py-3 px-4">Holiday Name (English)</th>
                  <th className="py-3 px-4 text-right">Dhivehi Name</th>
                  <th className="py-3 px-4 text-center">Category</th>
                  <th className="py-3 px-4 text-center">Attendance Impact</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.map((item) => {
                  const badge = dayTypeBadges[item.dayType] || dayTypeBadges.REGULAR_TEACHING_DAY!;
                  const dObj = new Date(item.date + 'T00:00:00Z');
                  const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const isWeekendDay = dayName === 'Friday' || dayName === 'Saturday';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isWeekendDay ? 'text-rose-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {dayName}
                        </span>
                        {isWeekendDay && (
                          <span className="ml-1.5 text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                            Weekend
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.description}
                      </td>
                      <td dir="rtl" className="py-3 px-4 font-dhivehi font-medium text-slate-700 text-right">
                        {item.descriptionDhivehi || item.description}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${badge.bg} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Excused • No Attendance Required</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                            title="Edit Holiday"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteHoliday && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredHolidays.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No holidays found matching your filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Edit / Create Holiday Modal */}
      {isEditModalOpen && (
        <div
          id="holiday-crud-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {modalMode === 'edit'
                      ? isRTL
                        ? 'ބަންދު ބަދަލުކުރުން'
                        : 'Edit Holiday & Academic Date'
                      : isRTL
                      ? 'އައު ބަންދެއް ނުވަތަ ޗުއްޓީއެއް އިތުރުކުރުން'
                      : 'Add New Public Holiday / School Break'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isRTL
                      ? 'މި ބަދަލުތައް ސިސްޓަމްގައި ރައްކާކުރެވި ހާޒިރީއަށް އޮޓަމެޓިކުން އަސަރުކުރާނެއެވެ'
                      : 'Updates automatically update the attendance register and deduct required teaching days.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHolidaySubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick Presets for Maldives Holidays */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Presets (Maldives Official Holidays)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MALDIVES_HOLIDAY_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.en}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                    >
                      {preset.en.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Date vs Date Range Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                  {isDateRange ? 'Date Range (Multi-day Break)' : 'Date'}
                </span>

                <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setIsDateRange(false)}
                    className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                      !isDateRange ? 'bg-white shadow-2xs text-emerald-950 font-extrabold' : 'text-slate-500'
                    }`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDateRange(true);
                      if (!formEndDate || formEndDate < formDate) {
                        setFormEndDate(formDate);
                      }
                    }}
                    className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                      isDateRange ? 'bg-white shadow-2xs text-emerald-950 font-extrabold' : 'text-slate-500'
                    }`}
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              {isDateRange ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setFormDate(s);
                        if (formEndDate && formEndDate < s) setFormEndDate(s);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formDate}
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setFormEndDate(e.target.value);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              {/* Category / Day Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category / Day Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formDayType}
                  onChange={(e) => setFormDayType(e.target.value as AcademicDayType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="PUBLIC_HOLIDAY">Public Holiday (ޤައުމީ ބަންދު)</option>
                  <option value="TERM_BREAK">Term Break (ޓާމް ޗުއްޓީ)</option>
                  <option value="SCHOOL_CLOSED">School Closed (ސްކޫލް ބަންދު)</option>
                  <option value="SCHOOL_CLOSED_WEATHER">Monsoon Weather Closure (މޫސުމީ ބަންދު)</option>
                  <option value="EXAMINATION_DAY">Examination Day (އިމްތިޙާނު ދުވަސް)</option>
                  <option value="SPECIAL_ACTIVITY_DAY">Special Activity Day (ޚާއްޞަ ޙަރަކާތް)</option>
                  <option value="REGULAR_TEACHING_DAY">Regular Teaching Day (ކިޔަވައިދޭ ދުވަސް)</option>
                </select>
              </div>

              {/* English Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Holiday Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Day Maldives Embraced Islam, Eid al-Fitr, National Day"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* Dhivehi Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Holiday Name (Dhivehi)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="މިސާލަކަށް: ރާއްޖެ އިސްލާމްވި ދުވަސް، ޤައުމީ ދުވަސް، ފިޠުރު ޢީދު"
                  value={formDescriptionDhivehi}
                  onChange={(e) => setFormDescriptionDhivehi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-dhivehi font-medium"
                />
              </div>

              {/* Automatic Attendance Impact Note */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Setting this date as a Public Holiday automatically marks all student attendance as{' '}
                  <span className="font-bold">"School Closed"</span> with status{' '}
                  <span className="font-bold text-emerald-800">EXCUSED</span> and deducts the day from the
                  required Ministry of Education instructional day count.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  {modalMode === 'edit' && editingId && onDeleteHoliday && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetItem = calendar.find((c) => c.id === editingId);
                        if (targetItem) setDeleteTarget(targetItem);
                      }}
                      className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition cursor-pointer"
                    >
                      Delete Date
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#03624c] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.save}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Delete Holiday / Calendar Date?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget.description}"</span> on <span className="font-mono font-bold text-slate-900">{deleteTarget.date}</span>?
              </p>
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                This date will revert to a <span className="font-bold">Regular Teaching Day</span> and homeroom attendance marking will be re-enabled.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-delete-holiday-btn"
                onClick={handleExecuteDelete}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Reset to Official Maldives Schedule Confirmation Modal */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isRTL ? 'ރަސްމީ ކަލަންޑަރަށް އަލުން ބަދަލުކުރައްވަންތަ؟' : 'Restore Official MoE Calendar?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {isRTL
                  ? 'މިކަމުގެ ސަބަބުން މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަންގެ ރަސްމީ ބަންދުތައް އަލުން އަނބުރާ ރުޖޫޢަވާނެއެވެ. އަމިއްލައަށް އުނިކޮށްފައިވާ ނުވަތަ އިތުރުކޮށްފައިވާ ބަދަލުތައް އަލުން ރަސްމީ ގޮތަށް ބަދަލުވާނެއެވެ.'
                  : 'This will restore all default Maldives Ministry of Education public holidays and term breaks. Any manually deleted holidays or custom overrides will be reset to defaults.'}
              </p>
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                {isRTL
                  ? 'މި އަމަލަކީ އުނިކޮށްފައިވާ ބަންދުތައް އަލުން ގެނައުމަށް ބޭނުންކުރާ ވަސީލަތެކެވެ.'
                  : 'Use this only if you want to restore all official national holidays back to factory defaults.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmResetOpen(false)}
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-reset-calendar-btn"
                onClick={async () => {
                  await handleResetToOfficialHolidays();
                  setIsConfirmResetOpen(false);
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isResetting ? 'Restoring...' : (isRTL ? 'އާނ، އަލުން ބަދަލުކުރޭ' : 'Yes, Restore Defaults')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
