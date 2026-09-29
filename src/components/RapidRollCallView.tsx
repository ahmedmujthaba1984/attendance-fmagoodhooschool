import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCheck,
  MessageSquare,
  Send,
  Check,
  LayoutGrid,
  Zap,
  Users,
  Sunrise,
  Sunset,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  SessionType,
  LeaveReason,
} from '../types';

interface RapidRollCallViewProps {
  students: Student[];
  recordsMap: Map<string, AttendanceRecord>;
  counterpartMap: Map<string, AttendanceRecord>;
  selectedSession: SessionType;
  selectedDate: string;
  selectedGrade: string;
  isSchoolClosed?: boolean;
  isSessionSubmitted?: boolean;
  isSuperAdmin?: boolean;
  onStatusChange: (
    studentId: string,
    newStatus: AttendanceStatus,
    defaultLeaveReason?: LeaveReason
  ) => void;
  onArrivalTimeChange: (studentId: string, time: string) => void;
  onReasonChange: (studentId: string, reason: LeaveReason) => void;
  onBulkMarkPresent: (onlyUnmarked?: boolean) => void;
  onOpenSmsDraftModal: (student: Student) => void;
  onSubmitSession?: () => void;
  onSwitchToCards: () => void;
}

export const RapidRollCallView: React.FC<RapidRollCallViewProps> = ({
  students,
  recordsMap,
  counterpartMap,
  selectedSession,
  selectedDate,
  selectedGrade,
  isSchoolClosed,
  isSessionSubmitted,
  isSuperAdmin,
  onStatusChange,
  onArrivalTimeChange,
  onReasonChange,
  onBulkMarkPresent,
  onOpenSmsDraftModal,
  onSubmitSession,
  onSwitchToCards,
}) => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLateOptions, setShowLateOptions] = useState(false);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);

  // Trigger tactile vibration on mobile
  const triggerHaptic = (ms = 25) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Clamp index if student list changes
  useEffect(() => {
    if (currentIndex >= students.length && students.length > 0) {
      setCurrentIndex(students.length - 1);
    }
  }, [students.length, currentIndex]);

  const currentStudent = students[currentIndex];
  const isMorning = selectedSession === 'MORNING_BEFORE_BREAK';

  // Current student record & counterpart record
  const currentRecord = currentStudent ? recordsMap.get(currentStudent.id) : undefined;
  const counterpartRecord = currentStudent ? counterpartMap.get(currentStudent.id) : undefined;

  const currentStatus = isSchoolClosed
    ? 'SCHOOL_CLOSED'
    : currentRecord?.status || 'UNMARKED';

  const counterpartStatus = counterpartRecord?.status;

  // Counts across the active roster
  const counts = useMemo(() => {
    let present = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    let unmarked = 0;

    students.forEach((st) => {
      const rec = recordsMap.get(st.id);
      if (!rec || !rec.status) {
        unmarked++;
      } else if (rec.status === 'PRESENT') {
        present++;
      } else if (rec.status === 'LATE') {
        late++;
      } else if (rec.status === 'LEAVE') {
        leave++;
      } else if (rec.status === 'ABSENT') {
        absent++;
      }
    });

    return {
      total: students.length,
      present,
      late,
      leave,
      absent,
      unmarked,
      marked: students.length - unmarked,
    };
  }, [students, recordsMap]);

  const progressPercent = students.length > 0
    ? Math.round(((currentIndex + 1) / students.length) * 100)
    : 0;

  const markedPercent = students.length > 0
    ? Math.round((counts.marked / students.length) * 100)
    : 0;

  // Handle Mark Present & Auto Advance
  const handleMarkPresentAndNext = () => {
    if (!currentStudent) return;
    triggerHaptic(20);
    onStatusChange(currentStudent.id, 'PRESENT');
    setShowLateOptions(false);
    setShowLeaveOptions(false);

    if (currentIndex < students.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Mark Absent & Auto Advance
  const handleMarkAbsentAndNext = () => {
    if (!currentStudent) return;
    triggerHaptic(35);
    onStatusChange(currentStudent.id, 'ABSENT');
    setShowLateOptions(false);
    setShowLeaveOptions(false);

    if (currentIndex < students.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Late with preset time & Auto Advance
  const handleMarkLateWithTime = (time: string) => {
    if (!currentStudent) return;
    triggerHaptic(25);
    onStatusChange(currentStudent.id, 'LATE');
    onArrivalTimeChange(currentStudent.id, time);
    setShowLateOptions(false);

    if (currentIndex < students.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Leave with preset reason & Auto Advance
  const handleMarkLeaveWithReason = (reason: LeaveReason) => {
    if (!currentStudent) return;
    triggerHaptic(25);
    onStatusChange(currentStudent.id, 'LEAVE', reason);
    onReasonChange(currentStudent.id, reason);
    setShowLeaveOptions(false);

    if (currentIndex < students.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!currentStudent || students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <h3 className="font-bold text-base text-slate-800">
          {isRTL ? 'އެއްވެސް ދަރިވަރަކު ނުފެނުނު' : 'No Students Available in this Class'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isRTL ? 'ގްރޭޑް ބަދަލުކުރައްވާ ނުވަތަ ފިލްޓަރު ރިސެޓްކުރައްވާ.' : 'Change the grade or clear search filters to view students.'}
        </p>
        <button
          type="button"
          onClick={onSwitchToCards}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
        >
          {isRTL ? 'ލިސްޓު ބަލާލަން' : 'Return to Roster List'}
        </button>
      </div>
    );
  }

  const latePresets = isMorning
    ? ['08:00', '08:15', '08:30']
    : ['11:00', '11:15', '11:30'];

  const leavePresets: Array<{ id: LeaveReason; labelEn: string; labelDv: string; icon: string }> = [
    { id: 'SICK_LEAVE', labelEn: 'Sick', labelDv: 'ބަލިވެ', icon: '🩺' },
    { id: 'SICK_LEAVE_MC', labelEn: 'Doctor MC', labelDv: 'ޑޮކްޓަރު ލިޔުން', icon: '📋' },
    { id: 'NOT_IN_ISLAND', labelEn: 'Travel / Island', labelDv: 'ރަށުގައި ނެތް', icon: '✈️' },
    { id: 'OFFICIAL_DUTY', labelEn: 'Official Duty', labelDv: 'ރަސްމީ ކަންކަމުގައި', icon: '🏛️' },
  ];

  const isCurrentAbsent = currentRecord?.status === 'ABSENT';
  const isCurrentLate = currentRecord?.status === 'LATE';
  const isCurrentLeave = currentRecord?.status === 'LEAVE';
  const isCurrentPresent = currentRecord?.status === 'PRESENT';

  return (
    <div className="space-y-3.5">
      {/* Rapid Roll Call Mode Header & Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Mode Title & Stepper */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-900 truncate">
                  {isRTL ? 'ހަލުވި ހާޒިރީ' : 'Rapid Roll Call'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-teal-100 text-teal-800">
                  {selectedGrade}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                <span>{isRTL ? 'ދަރިވަރު' : 'Student'}</span>
                <span className="font-mono text-slate-900 font-extrabold">{currentIndex + 1}</span>
                <span>/</span>
                <span className="font-mono">{students.length}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700">{counts.marked}/{counts.total} {isRTL ? 'ފުރިފައި' : 'marked'}</span>
              </div>
            </div>
          </div>

          {/* Right: Prev / Next Buttons & Switch to Roster List */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setShowLateOptions(false);
                setShowLeaveOptions(false);
              }}
              disabled={currentIndex === 0}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
              }`}
              title={isRTL ? 'ކުރީގެ ދަރިވަރު' : 'Previous Student'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setCurrentIndex((prev) => Math.min(students.length - 1, prev + 1));
                setShowLateOptions(false);
                setShowLeaveOptions(false);
              }}
              disabled={currentIndex === students.length - 1}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer ${
                currentIndex === students.length - 1
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
              }`}
              title={isRTL ? 'ދެން އޮތް ދަރިވަރު' : 'Next Student'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onSwitchToCards}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 min-h-[40px] cursor-pointer"
              title={isRTL ? 'ލިސްޓަށް ބަދަލުކުރޭ' : 'Switch to Roster List'}
            >
              <LayoutGrid className="w-4 h-4 text-slate-600" />
              <span className="hidden xs:inline">{t.rosterView}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Class Roll-Call Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-linear-to-r from-teal-500 via-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Student Focus Card */}
      <div
        className={`bg-white rounded-3xl border-2 p-4 sm:p-6 shadow-md transition-all ${
          isCurrentAbsent
            ? 'border-rose-400 bg-rose-50/20'
            : isCurrentLate
            ? 'border-amber-400 bg-amber-50/20'
            : isCurrentLeave
            ? 'border-indigo-400 bg-indigo-50/20'
            : isCurrentPresent
            ? 'border-emerald-400 bg-emerald-50/20'
            : 'border-slate-200 hover:border-teal-300'
        }`}
      >
        {/* Student Avatar & Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            {/* Student Avatar */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-extrabold text-sm border-2 shrink-0 shadow-xs ${
                currentStudent.gender === 'MALE'
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <span className="text-base font-black font-mono">
                {currentStudent.admissionNumber.slice(4)}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">
                {currentStudent.gender === 'MALE' ? (isRTL ? 'ފިރިހެން' : 'Boy') : (isRTL ? 'އަންހެން' : 'Girl')}
              </span>
            </div>

            {/* Student Name */}
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug font-thaana">
                {currentStudent.fullNameDhivehi || currentStudent.fullName}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 font-sans mt-0.5">
                {currentStudent.fullName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                  {currentStudent.admissionNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                  {currentStudent.gradeLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Current Status Badge & Session Context */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Current Status Pill */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">
                {isRTL ? 'މިހާރުގެ ޙާލަތު:' : 'Status:'}
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border shadow-2xs ${
                  isCurrentPresent
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isCurrentLate
                    ? 'bg-amber-500 text-white border-amber-500'
                    : isCurrentLeave
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isCurrentAbsent
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isCurrentPresent && <CheckCircle className="w-3.5 h-3.5" />}
                {isCurrentLate && <Clock className="w-3.5 h-3.5" />}
                {isCurrentLeave && <AlertCircle className="w-3.5 h-3.5" />}
                {isCurrentAbsent && <XCircle className="w-3.5 h-3.5" />}
                <span>
                  {isCurrentPresent
                    ? t.present
                    : isCurrentLate
                    ? `${t.late} (${currentRecord?.arrivalTime || (isMorning ? '08:15' : '11:00')})`
                    : isCurrentLeave
                    ? t.leave
                    : isCurrentAbsent
                    ? t.absent
                    : (isRTL ? 'ނުފުރާ' : 'Unmarked')}
                </span>
              </span>
            </div>

            {/* Counterpart Session Context */}
            {counterpartRecord && (
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span>{isMorning ? t.postBreakSessionShort : t.morningSessionShort}:</span>
                <span
                  className={`font-black ${
                    counterpartStatus === 'PRESENT'
                      ? 'text-emerald-700'
                      : counterpartStatus === 'LATE'
                      ? 'text-amber-700'
                      : counterpartStatus === 'LEAVE'
                      ? 'text-indigo-700'
                      : 'text-rose-700'
                  }`}
                >
                  {counterpartStatus === 'PRESENT'
                    ? t.present
                    : counterpartStatus === 'LATE'
                    ? t.late
                    : counterpartStatus === 'LEAVE'
                    ? t.leave
                    : t.absent}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Big 4-Button Attendance Touchpad (Thumb-Zone Optimized) */}
        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* PRESENT BUTTON */}
            <button
              id="rapid-btn-present"
              type="button"
              onClick={handleMarkPresentAndNext}
              className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer active:scale-95 touch-manipulation shadow-sm ${
                isCurrentPresent
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{t.present}</span>
            </button>

            {/* LATE BUTTON */}
            <button
              id="rapid-btn-late"
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setShowLateOptions(!showLateOptions);
                setShowLeaveOptions(false);
              }}
              className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer active:scale-95 touch-manipulation shadow-sm ${
                isCurrentLate
                  ? 'bg-amber-500 text-white ring-4 ring-amber-400/30'
                  : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950'
              }`}
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{t.late}</span>
            </button>

            {/* LEAVE BUTTON */}
            <button
              id="rapid-btn-leave"
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setShowLeaveOptions(!showLeaveOptions);
                setShowLateOptions(false);
              }}
              className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer active:scale-95 touch-manipulation shadow-sm ${
                isCurrentLeave
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30'
                  : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white'
              }`}
            >
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{t.leave}</span>
            </button>

            {/* ABSENT BUTTON */}
            <button
              id="rapid-btn-absent"
              type="button"
              onClick={handleMarkAbsentAndNext}
              className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition cursor-pointer active:scale-95 touch-manipulation shadow-sm ${
                isCurrentAbsent
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/30'
                  : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white'
              }`}
            >
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>{t.absent}</span>
            </button>
          </div>

          {/* Sub-Panel: Quick Late Arrival Presets */}
          {showLateOptions && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isRTL ? 'އައި ގަޑި ޚިޔާރުކުރައްވާ (ފިއްތާލުމުން އޮޓޯއިން އަނެއް ކުއްޖާއަށް ދާނެ):' : 'Select Late Arrival Time (auto-advances to next student):'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {latePresets.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleMarkLateWithTime(time)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-amber-100 active:bg-amber-200 border border-amber-300 text-amber-950 font-mono font-black text-xs transition cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Panel: Quick Leave Reason Presets */}
          {showLeaveOptions && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{isRTL ? 'ސަލާމުގެ ސަބަބު ޚިޔާރުކުރައްވާ:' : 'Select Leave Reason (auto-advances):'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {leavePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleMarkLeaveWithReason(preset.id)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 text-indigo-950 text-xs font-bold transition cursor-pointer shadow-2xs min-h-[44px] flex items-center justify-center gap-1.5 text-center"
                  >
                    <span>{preset.icon}</span>
                    <span>{isRTL ? preset.labelDv : preset.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {/* Notify Parent SMS Button if Absent or Late */}
            {(isCurrentAbsent || isCurrentLate) && (
              <button
                type="button"
                onClick={() => onOpenSmsDraftModal(currentStudent)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition cursor-pointer min-h-[40px]"
              >
                <MessageSquare className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{isRTL ? 'ބެލެނިވެރިޔާއަށް SMS ފޮނުވާ' : 'Notify Parent via SMS'}</span>
              </button>
            )}

            {/* Smart "Mark Remaining Students as Present" */}
            {counts.unmarked > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onBulkMarkPresent(true);
                }}
                className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold transition cursor-pointer min-h-[40px] shadow-2xs"
                title="Mark all uncalled students as Present without altering previously marked absentees"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isRTL
                    ? `ބާކީ ތިބި ${counts.unmarked} ކުދިން ޙާޟިރުކުރޭ`
                    : `Mark ${counts.unmarked} Remaining as Present`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Jump Carousel (Tap any student to jump directly) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-700" />
            <span>{isRTL ? 'ކްލާހުގެ ދަރިވަރުންގެ ލިސްޓު (ފިއްތާލުމުން އެ ދަރިވަރަކަށް ދެވޭނެ):' : 'Roster Quick Jump (tap to inspect):'}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 font-mono">
            {counts.marked}/{counts.total} {isRTL ? 'ފުރިފައި' : 'marked'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-1 px-1">
          {students.map((st, idx) => {
            const rec = recordsMap.get(st.id);
            const stStatus = rec?.status;
            const isSelected = idx === currentIndex;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setCurrentIndex(idx);
                  setShowLateOptions(false);
                  setShowLeaveOptions(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 min-h-[38px] ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="font-mono text-[11px] opacity-75">#{idx + 1}</span>
                <span className="truncate max-w-[80px]">
                  {isRTL ? (st.fullNameDhivehi || st.fullName).split(' ')[0] : st.fullName.split(' ')[0]}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    stStatus === 'PRESENT'
                      ? 'bg-emerald-500'
                      : stStatus === 'LATE'
                      ? 'bg-amber-500'
                      : stStatus === 'LEAVE'
                      ? 'bg-indigo-500'
                      : stStatus === 'ABSENT'
                      ? 'bg-rose-500'
                      : 'bg-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion Banner (When all students are accounted for) */}
      {counts.unmarked === 0 && (
        <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
              <h4 className="font-black text-sm sm:text-base">
                {isRTL ? 'މި ކްލާހުގެ ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ ރެކޯޑުކުރެވިއްޖެ!' : 'Roll Call Complete for this Class!'}
              </h4>
            </div>
            <div className="text-xs text-emerald-100 font-medium mt-1 flex items-center gap-2 flex-wrap">
              <span>{counts.present} {t.present}</span>
              <span>•</span>
              <span>{counts.late} {t.late}</span>
              <span>•</span>
              <span>{counts.leave} {t.leave}</span>
              <span>•</span>
              <span>{counts.absent} {t.absent}</span>
            </div>
          </div>

          {onSubmitSession && !isSchoolClosed && (
            <button
              type="button"
              onClick={isSessionSubmitted ? undefined : onSubmitSession}
              disabled={isSessionSubmitted}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                isSessionSubmitted
                  ? 'bg-white/20 text-white cursor-default'
                  : 'bg-white hover:bg-emerald-50 text-emerald-950 active:scale-95'
              }`}
            >
              {isSessionSubmitted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>{t.sessionFinalized}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-700" />
                  <span>{t.submitSession}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
