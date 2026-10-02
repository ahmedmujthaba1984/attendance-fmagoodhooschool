import React, { useState, useEffect } from 'react';
import {
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Sunrise,
  Sunset,
  Sparkles,
  Save,
  RotateCcw,
  Calendar,
  Zap,
  Trash2,
  CalendarDays,
  Check,
  Tag,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SchoolSessionTimings, TemporarySessionOverride } from '../types';

interface SessionTimingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimings: SchoolSessionTimings;
  selectedDate?: string;
  onSave: (timings: SchoolSessionTimings) => Promise<void> | void;
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '-';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '-';

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Next day fallback
  }
  const diff = endMinutes - startMinutes;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

function getDaysCount(start: string, end?: string): number {
  if (!start) return 1;
  if (!end || end === start) return 1;
  try {
    const d1 = new Date(start + 'T00:00:00Z').getTime();
    const d2 = new Date(end + 'T00:00:00Z').getTime();
    const diff = Math.round((d2 - d1) / (24 * 60 * 60 * 1000)) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

const TEMPORARY_REASON_PRESETS = [
  { name: 'Special Assembly & Activity', nameDhivehi: 'ޚާއްޞަ އެސެމްބްލީ އަދި ހަރަކާތްތައް', isRange: false, defaultDays: 1 },
  { name: 'Ramadan Special Hours', nameDhivehi: 'ރޯދަމަހުގެ ވަގުތު (30 Days)', isRange: true, defaultDays: 30 },
  { name: 'Examination Timetable', nameDhivehi: 'އިމްތިޙާން ޝެޑިއުލް (Exam Week)', isRange: true, defaultDays: 5 },
  { name: 'Weather / Heavy Rain Advisory', nameDhivehi: 'ވިއްސާރައިގެ ސަބަބުން ކުރުކޮށްލެވުނު ސެޝަން', isRange: false, defaultDays: 1 },
  { name: 'Sports Day / Activity Day', nameDhivehi: 'ކުޅިވަރު ދުވަސް', isRange: false, defaultDays: 1 },
  { name: 'Staff Meeting / Early Dismissal', nameDhivehi: 'މުދައްރިސުންގެ ބައްދަލުވުން / އަވަހަށް ނިންމުން', isRange: false, defaultDays: 1 },
];

export const SessionTimingsModal: React.FC<SessionTimingsModalProps> = ({
  isOpen,
  onClose,
  currentTimings,
  selectedDate,
  onSave,
}) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'normal' | 'temporary'>('normal');

  // Normal / Default routine state
  const normalMorning = currentTimings.normal?.morning || currentTimings.morning || { startTime: '07:45', endTime: '10:15' };
  const normalAfternoon = currentTimings.normal?.afternoon || currentTimings.afternoon || { startTime: '10:45', endTime: '13:15' };

  const [normalMorningStart, setNormalMorningStart] = useState(normalMorning.startTime || '07:45');
  const [normalMorningEnd, setNormalMorningEnd] = useState(normalMorning.endTime || '10:15');
  const [normalAfternoonStart, setNormalAfternoonStart] = useState(normalAfternoon.startTime || '10:45');
  const [normalAfternoonEnd, setNormalAfternoonEnd] = useState(normalAfternoon.endTime || '13:15');

  // Temporary date / date range override state
  const todayStr = selectedDate || new Date().toISOString().slice(0, 10);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(todayStr);
  const [tempEndDate, setTempEndDate] = useState(todayStr);
  const [tempReason, setTempReason] = useState('Special Assembly & Activity');
  const [tempMorningStart, setTempMorningStart] = useState('07:30');
  const [tempMorningEnd, setTempMorningEnd] = useState('10:00');
  const [tempAfternoonStart, setTempAfternoonStart] = useState('10:30');
  const [tempAfternoonEnd, setTempAfternoonEnd] = useState('13:00');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when modal opens or currentTimings changes
  useEffect(() => {
    if (isOpen) {
      const nm = currentTimings.normal?.morning || currentTimings.morning || { startTime: '07:45', endTime: '10:15' };
      const na = currentTimings.normal?.afternoon || currentTimings.afternoon || { startTime: '10:45', endTime: '13:15' };
      setNormalMorningStart(nm.startTime || '07:45');
      setNormalMorningEnd(nm.endTime || '10:15');
      setNormalAfternoonStart(na.startTime || '10:45');
      setNormalAfternoonEnd(na.endTime || '13:15');

      const existingOverride = currentTimings.temporaryOverrides?.find((o) => {
        if (o.endDate) {
          return tempStartDate >= o.date && tempStartDate <= o.endDate;
        }
        return o.date === tempStartDate;
      });

      if (existingOverride) {
        setTempMorningStart(existingOverride.morning.startTime);
        setTempMorningEnd(existingOverride.morning.endTime);
        setTempAfternoonStart(existingOverride.afternoon.startTime);
        setTempAfternoonEnd(existingOverride.afternoon.endTime);
        setTempReason(existingOverride.reason || 'Special Assembly & Activity');
        if (existingOverride.endDate && existingOverride.endDate !== existingOverride.date) {
          setIsRangeMode(true);
          setTempEndDate(existingOverride.endDate);
        } else {
          setIsRangeMode(false);
          setTempEndDate(existingOverride.date);
        }
      } else {
        setTempMorningStart(nm.startTime || '07:45');
        setTempMorningEnd(nm.endTime || '10:15');
        setTempAfternoonStart(na.startTime || '10:45');
        setTempAfternoonEnd(na.endTime || '13:15');
        setIsRangeMode(false);
        setTempEndDate(tempStartDate);
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentTimings, tempStartDate]);

  // When start date is changed, adjust end date if needed
  const handleTempStartDateChange = (newStart: string) => {
    setTempStartDate(newStart);
    if (!isRangeMode || tempEndDate < newStart) {
      setTempEndDate(newStart);
    }
    const existing = currentTimings.temporaryOverrides?.find((o) => {
      if (o.endDate) {
        return newStart >= o.date && newStart <= o.endDate;
      }
      return o.date === newStart;
    });

    if (existing) {
      setTempMorningStart(existing.morning.startTime);
      setTempMorningEnd(existing.morning.endTime);
      setTempAfternoonStart(existing.afternoon.startTime);
      setTempAfternoonEnd(existing.afternoon.endTime);
      setTempReason(existing.reason || 'Special Assembly & Activity');
      if (existing.endDate && existing.endDate !== existing.date) {
        setIsRangeMode(true);
        setTempEndDate(existing.endDate);
      }
    }
  };

  const handleOccasionClick = (preset: typeof TEMPORARY_REASON_PRESETS[0]) => {
    setTempReason(preset.name);
    if (preset.isRange) {
      setIsRangeMode(true);
      setTempEndDate(addDays(tempStartDate, preset.defaultDays - 1));
      if (preset.name === 'Ramadan Special Hours') {
        setTempMorningStart('08:30');
        setTempMorningEnd('10:30');
        setTempAfternoonStart('11:00');
        setTempAfternoonEnd('13:00');
      }
    } else {
      setIsRangeMode(false);
      setTempEndDate(tempStartDate);
    }
  };

  if (!isOpen) return null;

  const normalMorningDuration = calculateDuration(normalMorningStart, normalMorningEnd);
  const normalAfternoonDuration = calculateDuration(normalAfternoonStart, normalAfternoonEnd);

  const tempMorningDuration = calculateDuration(tempMorningStart, tempMorningEnd);
  const tempAfternoonDuration = calculateDuration(tempAfternoonStart, tempAfternoonEnd);

  const daysCount = isRangeMode ? getDaysCount(tempStartDate, tempEndDate) : 1;

  const existingOverrideForSelectedDate = currentTimings.temporaryOverrides?.find((o) => {
    if (o.endDate) {
      return tempStartDate >= o.date && tempStartDate <= o.endDate;
    }
    return o.date === tempStartDate;
  });

  const applyNormalPreset = (preset: 'moe' | 'early' | 'ramadan') => {
    if (preset === 'moe') {
      setNormalMorningStart('07:45');
      setNormalMorningEnd('10:15');
      setNormalAfternoonStart('10:45');
      setNormalAfternoonEnd('13:15');
    } else if (preset === 'early') {
      setNormalMorningStart('07:30');
      setNormalMorningEnd('10:00');
      setNormalAfternoonStart('10:30');
      setNormalAfternoonEnd('13:00');
    } else if (preset === 'ramadan') {
      setNormalMorningStart('08:30');
      setNormalMorningEnd('10:30');
      setNormalAfternoonStart('11:00');
      setNormalAfternoonEnd('13:00');
    }
    setError(null);
  };

  // Save Normal Schedule
  const handleSaveNormal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (normalMorningStart >= normalMorningEnd) {
      setError(
        isRTL
          ? 'ހެނދުނުގެ ސެޝަން ފެށޭ ވަގުތު ނިމޭ ވަގުތަށްވުރެ ކުރިވާން ޖެހޭނެއެވެ'
          : 'Morning session start time must be before end time.'
      );
      return;
    }

    if (normalAfternoonStart >= normalAfternoonEnd) {
      setError(
        isRTL
          ? 'މެންދުރުފަހުގެ ސެޝަން ފެށޭ ވަގުތު ނިމޭ ވަގުތަށްވުރެ ކުރިވާން ޖެހޭނެއެވެ'
          : 'Afternoon session start time must be before end time.'
      );
      return;
    }

    const updated: SchoolSessionTimings = {
      normal: {
        morning: {
          startTime: normalMorningStart,
          endTime: normalMorningEnd,
          label: 'Morning Session',
          labelDhivehi: 'ހެނދުނުގެ ސެޝަން',
        },
        afternoon: {
          startTime: normalAfternoonStart,
          endTime: normalAfternoonEnd,
          label: 'Afternoon Session',
          labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން',
        },
      },
      morning: {
        startTime: normalMorningStart,
        endTime: normalMorningEnd,
        label: 'Morning Session',
        labelDhivehi: 'ހެނދުނުގެ ސެޝަން',
      },
      afternoon: {
        startTime: normalAfternoonStart,
        endTime: normalAfternoonEnd,
        label: 'Afternoon Session',
        labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން',
      },
      temporaryOverrides: currentTimings.temporaryOverrides || [],
    };

    setSaving(true);
    try {
      await onSave(updated);
      setSuccessMessage(isRTL ? 'އާންމު ސެޝަން ވަގުތުތައް ކާމިޔާބުކަމާއެކު ރައްކާކުރެވިއްޖެ' : 'Default normal session timings saved.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to save normal timings.');
    } finally {
      setSaving(false);
    }
  };

  // Save Temporary Date / Date Range Override
  const handleSaveTemporary = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!tempStartDate) {
      setError(isRTL ? 'ފެށޭ ތާރީޚެއް ޚިޔާރުކުރައްވާ' : 'Please select a start date.');
      return;
    }

    const finalEndDate = isRangeMode && tempEndDate ? tempEndDate : tempStartDate;
    if (finalEndDate < tempStartDate) {
      setError(isRTL ? 'ނިމޭ ތާރީޚް ފެށޭ ތާރީޚަށްވުރެ ކުރިވެގެން ނުވާނެއެވެ' : 'End date cannot be earlier than start date.');
      return;
    }

    if (tempMorningStart >= tempMorningEnd) {
      setError(
        isRTL
          ? 'ހެނދުނުގެ ސެޝަން ފެށޭ ވަގުތު ނިމޭ ވަގުތަށްވުރެ ކުރިވާން ޖެހޭނެއެވެ'
          : 'Temporary morning start time must be before end time.'
      );
      return;
    }

    if (tempAfternoonStart >= tempAfternoonEnd) {
      setError(
        isRTL
          ? 'މެންދުރުފަހުގެ ސެޝަން ފެށޭ ވަގުތު ނިމޭ ވަގުތަށްވުރެ ކުރިވާން ޖެހޭނެއެވެ'
          : 'Temporary afternoon start time must be before end time.'
      );
      return;
    }

    const newOverride: TemporarySessionOverride = {
      id: `override-${tempStartDate}${finalEndDate !== tempStartDate ? `_${finalEndDate}` : ''}`,
      date: tempStartDate,
      endDate: finalEndDate !== tempStartDate ? finalEndDate : undefined,
      reason: tempReason,
      morning: {
        startTime: tempMorningStart,
        endTime: tempMorningEnd,
        label: 'Morning Session (Temporary)',
        labelDhivehi: 'ހެނދުނުގެ ސެޝަން (ވަގުތީ)',
      },
      afternoon: {
        startTime: tempAfternoonStart,
        endTime: tempAfternoonEnd,
        label: 'Afternoon Session (Temporary)',
        labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން (ވަގުތީ)',
      },
      createdAt: new Date().toISOString(),
    };

    const existingOverrides = currentTimings.temporaryOverrides || [];
    // Remove any previous override starting on the same start date
    const filtered = existingOverrides.filter((o) => o.date !== tempStartDate);
    const updatedOverrides = [...filtered, newOverride];

    const updated: SchoolSessionTimings = {
      ...currentTimings,
      temporaryOverrides: updatedOverrides,
    };

    setSaving(true);
    try {
      await onSave(updated);
      setSuccessMessage(
        isRTL
          ? `${tempStartDate} ${finalEndDate !== tempStartDate ? `އިން ${finalEndDate} އަށް` : ''} ވަގުތީ ޝެޑިއުލް ކަނޑައެޅިއްޖެ`
          : `Temporary timing for ${tempStartDate}${finalEndDate !== tempStartDate ? ` to ${finalEndDate} (${daysCount} days)` : ''} saved.`
      );
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to save temporary timing.');
    } finally {
      setSaving(false);
    }
  };

  // Remove Temporary Override
  const handleRemoveOverride = async (overrideId: string) => {
    setError(null);
    setSaving(true);
    try {
      const existingOverrides = currentTimings.temporaryOverrides || [];
      const updatedOverrides = existingOverrides.filter((o) => o.id !== overrideId && o.date !== overrideId);
      const updated: SchoolSessionTimings = {
        ...currentTimings,
        temporaryOverrides: updatedOverrides,
      };
      await onSave(updated);
      setSuccessMessage(
        isRTL
          ? `ވަގުތީ ޝެޑިއުލް އުވާލެވި، އާންމު ވަގުތަށް ބަދަލުކުރެވިއްޖެ`
          : `Temporary timing removed. Returned to standard schedule.`
      );
      // Reset form to normal
      setTempMorningStart(normalMorningStart);
      setTempMorningEnd(normalMorningEnd);
      setTempAfternoonStart(normalAfternoonStart);
      setTempAfternoonEnd(normalAfternoonEnd);
      setIsRangeMode(false);
      setTempEndDate(tempStartDate);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove temporary override.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
              <Clock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>{isRTL ? 'ސެޝަން ވަގުތު ކަނޑައެޅުން' : 'Session Timings & Duration'}</span>
              </h3>
              <p className="text-xs text-sky-200 mt-0.5">
                {isRTL
                  ? 'އާންމު ވަގުތުތަކާއި، ޚާއްޞަ ދުވަސްތަކުގެ ވަގުތީ ވަގުތު (Start Date - End Date) ކަނޑައެޅުން'
                  : 'Manage normal school hours & temporary date range timings'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Scope Segmented Selector Tabs */}
        <div className="p-3 sm:px-6 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('normal');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'normal'
                  ? 'bg-sky-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isRTL ? 'އާންމު ވަގުތު (Default Routine)' : 'Normal Timings (Default)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('temporary');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer relative ${
                activeTab === 'temporary'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ވަގުތީ ވަގުތު (Date Range)' : 'Temporary Date / Period'}</span>
              {(currentTimings.temporaryOverrides?.length || 0) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'temporary' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'}`}>
                  {currentTimings.temporaryOverrides?.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: NORMAL ROUTINE TIMINGS */}
          {activeTab === 'normal' && (
            <form onSubmit={handleSaveNormal} className="space-y-5">
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                <p>
                  {isRTL
                    ? 'މި ވަގުތުތަކަކީ ސްކޫލްގެ ހުރިހާ އާންމު ދުވަސްތަކެއްގައި ބޭނުންކުރެވޭނެ އަސްލު ވަގުތުތަކެވެ.'
                    : 'These are the standard school hours applied automatically to all regular school days unless a temporary override is created.'}
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isRTL ? 'އާންމު ޝެޑިއުލްތައް:' : 'Standard Presets:'}</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyNormalPreset('moe')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-800 transition text-center cursor-pointer"
                  >
                    <div className="text-[10px] text-slate-500">MoE Standard</div>
                    <div className="font-mono text-slate-900 mt-0.5">07:45 - 13:15</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyNormalPreset('early')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-800 transition text-center cursor-pointer"
                  >
                    <div className="text-[10px] text-slate-500">Early Schedule</div>
                    <div className="font-mono text-slate-900 mt-0.5">07:30 - 13:00</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyNormalPreset('ramadan')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-xs font-bold text-slate-700 hover:text-amber-800 transition text-center cursor-pointer"
                  >
                    <div className="text-[10px] text-amber-700 font-semibold">Ramadan (ރޯދަމަސް)</div>
                    <div className="font-mono text-slate-900 mt-0.5">08:30 - 13:00</div>
                  </button>
                </div>
              </div>

              {/* Normal Morning Session */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Sunrise className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        {isRTL ? 'ހެނދުނުގެ ސެޝަން (އާންމު)' : 'Morning Session (Standard)'}
                      </h4>
                      <span className="text-[10px] text-amber-700">Gate Check-in to Interval Break</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md">
                    {normalMorningDuration}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ފެށޭ ވަގުތު' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={normalMorningStart}
                      onChange={(e) => setNormalMorningStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ނިމޭ ވަގުތު' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={normalMorningEnd}
                      onChange={(e) => setNormalMorningEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Normal Afternoon Session */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Sunset className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-teal-950 uppercase tracking-wide">
                        {isRTL ? 'މެންދުރުފަހުގެ ސެޝަން (އާންމު)' : 'Afternoon Session (Standard)'}
                      </h4>
                      <span className="text-[10px] text-teal-700">Post-Break / Secondary Period</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-teal-900 bg-teal-100/90 border border-teal-300 px-2 py-0.5 rounded-md">
                    {normalAfternoonDuration}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ފެށޭ ވަގުތު' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={normalAfternoonStart}
                      onChange={(e) => setNormalAfternoonStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ނިމޭ ވަގުތު' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={normalAfternoonEnd}
                      onChange={(e) => setNormalAfternoonEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Normal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  {isRTL ? 'ކެންސަލް' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (isRTL ? 'ރައްކާކުރަނީ...' : 'Saving...') : isRTL ? 'އާންމު ވަގުތުތައް ރައްކާކުރޭ' : 'Save as Default Routine'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEMPORARY DATE / DATE RANGE OVERRIDE TIMINGS */}
          {activeTab === 'temporary' && (
            <form onSubmit={handleSaveTemporary} className="space-y-5">
              {/* Date & Occasion Config */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        {isRTL ? 'ވަގުތީ ބަދަލު ގެންނަންވީ މުއްދަތު' : 'Target Date for Temporary Timing'}
                      </h4>
                      <span className="text-[10px] text-amber-700">
                        {isRangeMode
                          ? `Applies to ${daysCount} days from Start Date to End Date`
                          : 'Applies only to this specific school day'}
                      </span>
                    </div>
                  </div>

                  {existingOverrideForSelectedDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-700" />
                      <span>{isRTL ? 'ވަގުތީ ޝެޑިއުލް އެކްޓިވް' : 'Override Active'}</span>
                    </span>
                  )}
                </div>

                {/* Scope Toggle: Single Day vs Date Range (Start Date - End Date) */}
                <div className="flex items-center justify-between pt-1 pb-2 border-b border-amber-200/70">
                  <span className="text-[11px] font-bold text-amber-950">
                    {isRTL ? 'މުއްދަތު ވައްތަރު:' : 'Duration Type:'}
                  </span>
                  <div className="inline-flex p-0.5 rounded-xl bg-amber-200/70 border border-amber-300 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRangeMode(false);
                        setTempEndDate(tempStartDate);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                        !isRangeMode
                          ? 'bg-white text-amber-950 shadow-xs'
                          : 'text-amber-800 hover:text-amber-950'
                      }`}
                    >
                      {isRTL ? 'އެއް ދުވަސް (Single Day)' : 'Single Day'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRangeMode(true);
                        if (!tempEndDate || tempEndDate === tempStartDate) {
                          setTempEndDate(addDays(tempStartDate, 4));
                        }
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                        isRangeMode
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:text-amber-950'
                      }`}
                    >
                      {isRTL ? 'ތާރީޚް ރޭންޖް (Start Date – End Date)' : 'Date Range (Start – End Date)'}
                    </button>
                  </div>
                </div>

                {/* Date Inputs */}
                {!isRangeMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isRTL ? 'ތާރީޚް:' : 'Select Date:'}
                      </label>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => handleTempStartDateChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isRTL ? 'ސަބަބު / ޚާއްޞަ ހަރަކާތް:' : 'Occasion / Reason:'}
                      </label>
                      <input
                        type="text"
                        value={tempReason}
                        onChange={(e) => setTempReason(e.target.value)}
                        placeholder="e.g. Special Assembly / Exam Day"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {isRTL ? 'ފެށޭ ތާރީޚް (Start Date):' : 'Start Date:'}
                        </label>
                        <input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => handleTempStartDateChange(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            {isRTL ? 'ނިމޭ ތާރީޚް (End Date):' : 'End Date:'}
                          </label>
                          <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                            {daysCount} Days
                          </span>
                        </div>
                        <input
                          type="date"
                          value={tempEndDate}
                          min={tempStartDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isRTL ? 'ސަބަބު / ޚާއްޞަ ހަރަކާތް:' : 'Occasion / Reason:'}
                      </label>
                      <input
                        type="text"
                        value={tempReason}
                        onChange={(e) => setTempReason(e.target.value)}
                        placeholder="e.g. Ramadan Special Hours / Exam Week"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Common Occasion Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    {isRTL ? 'އަވަސް ސަބަބުތައް:' : 'Quick Occasion Reasons:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPORARY_REASON_PRESETS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleOccasionClick(item)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          tempReason === item.name
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                        }`}
                      >
                        {isRTL ? item.nameDhivehi : item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Temporary Morning Session Hours */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      {isRTL ? 'މި މުއްދަތުގެ ހެނދުނުގެ ސެޝަން' : 'Temporary Morning Session Hours'}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    {tempMorningDuration}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ފެށޭ ވަގުތު' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={tempMorningStart}
                      onChange={(e) => setTempMorningStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ނިމޭ ވަގުތު' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={tempMorningEnd}
                      onChange={(e) => setTempMorningEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Temporary Afternoon Session Hours */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-black text-teal-950 uppercase tracking-wide">
                      {isRTL ? 'މި މުއްދަތުގެ މެންދުރުފަހުގެ ސެޝަން' : 'Temporary Afternoon Session Hours'}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-black text-teal-900 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-md">
                    {tempAfternoonDuration}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ފެށޭ ވަގުތު' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={tempAfternoonStart}
                      onChange={(e) => setTempAfternoonStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {isRTL ? 'ނިމޭ ވަގުތު' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={tempAfternoonEnd}
                      onChange={(e) => setTempAfternoonEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions for Temporary */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {existingOverrideForSelectedDate ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveOverride(existingOverrideForSelectedDate.id || tempStartDate)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'އާންމު ވަގުތަށް އަނބުރާ ގެންދޭ (Reset)' : 'Revert to Normal Schedule'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    {isRTL ? 'ކެންސަލް' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving
                        ? (isRTL ? 'ރައްކާކުރަނީ...' : 'Saving...')
                        : isRangeMode && tempEndDate && tempEndDate !== tempStartDate
                        ? (isRTL ? `${tempStartDate} އިން ${tempEndDate} އަށް ކަނޑައަޅާ` : `Apply (${tempStartDate} – ${tempEndDate})`)
                        : (isRTL ? `${tempStartDate} އަށް ވަގުތީ ވަގުތު ކަނޑައަޅާ` : `Apply for ${tempStartDate}`)}
                    </span>
                  </button>
                </div>
              </div>

              {/* List of Active Temporary Overrides */}
              {currentTimings.temporaryOverrides && currentTimings.temporaryOverrides.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    {isRTL ? 'ކަނޑައެޅިފައިވާ ވަގުތީ ޝެޑިއުލްތައް:' : 'All Active Temporary Date Schedules:'}
                  </span>
                  <div className="space-y-2">
                    {currentTimings.temporaryOverrides.map((ov) => {
                      const isMultiDay = ov.endDate && ov.endDate !== ov.date;
                      const spanDays = isMultiDay ? getDaysCount(ov.date, ov.endDate) : 1;
                      return (
                        <div
                          key={ov.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            ov.date === tempStartDate
                              ? 'bg-amber-50/80 border-amber-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                {isMultiDay ? `${ov.date} ➔ ${ov.endDate}` : ov.date}
                              </span>
                              {isMultiDay && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  {spanDays} Days Period
                                </span>
                              )}
                              <span className="font-bold text-amber-900">
                                {ov.reason || 'Special Schedule'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                              <span>Morning: {ov.morning.startTime}–{ov.morning.endTime}</span>
                              <span>•</span>
                              <span>Afternoon: {ov.afternoon.startTime}–{ov.afternoon.endTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTempStartDate(ov.date);
                                if (ov.endDate && ov.endDate !== ov.date) {
                                  setIsRangeMode(true);
                                  setTempEndDate(ov.endDate);
                                } else {
                                  setIsRangeMode(false);
                                  setTempEndDate(ov.date);
                                }
                                setTempReason(ov.reason || '');
                                setTempMorningStart(ov.morning.startTime);
                                setTempMorningEnd(ov.morning.endTime);
                                setTempAfternoonStart(ov.afternoon.startTime);
                                setTempAfternoonEnd(ov.afternoon.endTime);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride(ov.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                              title="Delete Override"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
