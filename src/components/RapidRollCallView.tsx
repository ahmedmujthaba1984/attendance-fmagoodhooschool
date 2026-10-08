import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  LayoutGrid,
  Zap,
  Users,
  Sunrise,
  Sunset,
  Calendar,
  MessageSquare,
  Send,
  TableProperties,
  CreditCard,
  Grid3X3,
  Search,
  CheckCheck,
  ChevronDown,
  Info,
  Lock,
  Star,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  GradeLevel,
  SessionType,
  LeaveReason,
  SchoolSessionTimings,
  User,
} from '../types';
import {
  getEffectiveSessionTimings,
  checkSessionMarkingEligibility,
  getMaldivesNow,
} from '../utils/sessionTimingsHelper';

const ALL_GRADES_LIST: (GradeLevel | 'ALL')[] = [
  'ALL',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

export type RapidTemplateMode = 'card' | 'sheet' | 'grid';

interface RapidRollCallViewProps {
  students: Student[];
  allStudents?: Student[];
  recordsMap: Map<string, AttendanceRecord>;
  counterpartMap: Map<string, AttendanceRecord>;
  selectedSession: SessionType;
  onSelectSession?: (s: SessionType) => void;
  selectedDate: string;
  onSelectDate?: (d: string) => void;
  selectedGrade: string;
  onSelectGrade?: (g: GradeLevel | 'ALL') => void;
  sessionTimings?: SchoolSessionTimings;
  isSchoolClosed?: boolean;
  isSessionSubmitted?: boolean;
  isSuperAdmin?: boolean;
  currentUser?: User | null;
  hasMobilePrivilege?: boolean;
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
  allStudents = [],
  recordsMap,
  counterpartMap,
  selectedSession,
  onSelectSession,
  selectedDate,
  onSelectDate,
  selectedGrade,
  onSelectGrade,
  sessionTimings,
  isSchoolClosed = false,
  isSessionSubmitted = false,
  isSuperAdmin = false,
  currentUser,
  hasMobilePrivilege = false,
  onStatusChange,
  onArrivalTimeChange,
  onReasonChange,
  onBulkMarkPresent,
  onOpenSmsDraftModal,
  onSubmitSession,
  onSwitchToCards,
}) => {
  const { t, isRTL } = useLanguage();

  // 3 Easy Templates: Card (One-by-one focus), Sheet (Full class roster table), Grid (Compact cards grid)
  const [templateMode, setTemplateMode] = useState<RapidTemplateMode>('sheet');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSearch, setLocalSearch] = useState('');
  const [showLateOptions, setShowLateOptions] = useState(false);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [activeLateStudentId, setActiveLateStudentId] = useState<string | null>(null);
  const [activeLeaveStudentId, setActiveLeaveStudentId] = useState<string | null>(null);

  // Compute effective timings (morning/afternoon with any temporary override)
  const effectiveTimings = getEffectiveSessionTimings(sessionTimings, selectedDate);
  const isMorning = selectedSession === 'MORNING_BEFORE_BREAK';
  const activeSessionTiming = isMorning ? effectiveTimings.morning : effectiveTimings.afternoon;

  // Auto-refresh clock tick every 30 seconds so eligibility updates as Maldives time passes
  const [currentMinuteTick, setCurrentMinuteTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinuteTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Session marking eligibility: cannot mark future dates or session before start time
  const sessionEligibility = useMemo(() => {
    return checkSessionMarkingEligibility(selectedDate, selectedSession, sessionTimings);
  }, [selectedDate, selectedSession, sessionTimings, currentMinuteTick]);

  const isPrivilegedUser = Boolean(
    hasMobilePrivilege ||
    isSuperAdmin ||
    currentUser?.hasRapidRollCallPrivilege ||
    currentUser?.loginViaMobile
  );

  const [earlyMarkingOverride, setEarlyMarkingOverride] = useState(false);
  const isTimingBeforeStart =
    !sessionEligibility.allowed && sessionEligibility.reason === 'START_TIME_NOT_REACHED';

  const isMarkingAllowed =
    (sessionEligibility.allowed || (isPrivilegedUser && (earlyMarkingOverride || isTimingBeforeStart))) &&
    !isSchoolClosed &&
    (!isSessionSubmitted || isPrivilegedUser);
  const maldivesToday = getMaldivesNow().dateStr;

  // Filter students based on local search if present
  const displayStudents = useMemo(() => {
    if (!localSearch.trim()) return students;
    const q = localSearch.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.fullNameDhivehi.includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
  }, [students, localSearch]);

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
    if (currentIndex >= displayStudents.length && displayStudents.length > 0) {
      setCurrentIndex(displayStudents.length - 1);
    }
  }, [displayStudents.length, currentIndex]);

  const currentStudent = displayStudents[currentIndex];

  // Current student record & counterpart record
  const currentRecord = currentStudent ? recordsMap.get(currentStudent.id) : undefined;
  const counterpartRecord = currentStudent ? counterpartMap.get(currentStudent.id) : undefined;

  const isCurrentAbsent = currentRecord?.status === 'ABSENT';
  const isCurrentLate = currentRecord?.status === 'LATE';
  const isCurrentLeave = currentRecord?.status === 'LEAVE';
  const isCurrentPresent = currentRecord?.status === 'PRESENT';

  // Counts across the active roster
  const counts = useMemo(() => {
    let present = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    let unmarked = 0;

    displayStudents.forEach((st) => {
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
      total: displayStudents.length,
      present,
      late,
      leave,
      absent,
      unmarked,
      marked: displayStudents.length - unmarked,
    };
  }, [displayStudents, recordsMap]);

  // Counts per grade for the grade selector pills
  const gradeCounts = useMemo(() => {
    const map = new Map<string, number>();
    const pool = allStudents.length > 0 ? allStudents : students;
    pool.forEach((s) => {
      map.set(s.gradeLevel, (map.get(s.gradeLevel) || 0) + 1);
    });
    return map;
  }, [allStudents, students]);

  const progressPercent = displayStudents.length > 0
    ? Math.round(((currentIndex + 1) / displayStudents.length) * 100)
    : 0;

  // Handle Mark Present & Auto Advance (in card mode)
  const handleMarkPresent = (studentId?: string, autoNext = true) => {
    if (!isMarkingAllowed || isSchoolClosed) return;
    const targetId = studentId || currentStudent?.id;
    if (!targetId) return;
    triggerHaptic(20);
    onStatusChange(targetId, 'PRESENT');
    setShowLateOptions(false);
    setShowLeaveOptions(false);
    setActiveLateStudentId(null);
    setActiveLeaveStudentId(null);

    if (autoNext && templateMode === 'card' && !studentId && currentIndex < displayStudents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Mark Absent & Auto Advance (in card mode)
  const handleMarkAbsent = (studentId?: string, autoNext = true) => {
    if (!isMarkingAllowed || isSchoolClosed) return;
    const targetId = studentId || currentStudent?.id;
    if (!targetId) return;
    triggerHaptic(35);
    onStatusChange(targetId, 'ABSENT');
    setShowLateOptions(false);
    setShowLeaveOptions(false);
    setActiveLateStudentId(null);
    setActiveLeaveStudentId(null);

    if (autoNext && templateMode === 'card' && !studentId && currentIndex < displayStudents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Late with preset time & Auto Advance
  const handleMarkLateWithTime = (time: string, studentId?: string, autoNext = true) => {
    if (!isMarkingAllowed || isSchoolClosed) return;
    const targetId = studentId || currentStudent?.id;
    if (!targetId) return;
    triggerHaptic(25);
    onStatusChange(targetId, 'LATE');
    onArrivalTimeChange(targetId, time);
    setShowLateOptions(false);
    setActiveLateStudentId(null);

    if (autoNext && templateMode === 'card' && !studentId && currentIndex < displayStudents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle Leave with preset reason & Auto Advance
  const handleMarkLeaveWithReason = (reason: LeaveReason, studentId?: string, autoNext = true) => {
    if (!isMarkingAllowed || isSchoolClosed) return;
    const targetId = studentId || currentStudent?.id;
    if (!targetId) return;
    triggerHaptic(25);
    onStatusChange(targetId, 'LEAVE', reason);
    onReasonChange(targetId, reason);
    setShowLeaveOptions(false);
    setActiveLeaveStudentId(null);

    if (autoNext && templateMode === 'card' && !studentId && currentIndex < displayStudents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Keyboard navigation for power-users (1: Present, 2: Late, 3: Leave, 4: Absent, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (templateMode !== 'card') return;
      if (!isMarkingAllowed || isSchoolClosed) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') {
        handleMarkPresent();
      } else if (e.key === '2') {
        setShowLateOptions((prev) => !prev);
        setShowLeaveOptions(false);
      } else if (e.key === '3') {
        setShowLeaveOptions((prev) => !prev);
        setShowLateOptions(false);
      } else if (e.key === '4') {
        handleMarkAbsent();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(displayStudents.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [templateMode, currentStudent, currentIndex, displayStudents.length]);

  const latePresets = isMorning
    ? ['08:00', '08:15', '08:30', '08:45']
    : ['11:00', '11:15', '11:30', '11:45'];

  const leavePresets: Array<{ id: LeaveReason; labelEn: string; labelDv: string; icon: string }> = [
    { id: 'SICK_LEAVE', labelEn: 'Sick', labelDv: 'ބަލިވެ', icon: '🩺' },
    { id: 'SICK_LEAVE_MC', labelEn: 'Doctor MC', labelDv: 'ޑޮކްޓަރު ލިޔުން', icon: '📋' },
    { id: 'NOT_IN_ISLAND', labelEn: 'Travel / Island', labelDv: 'ރަށުގައި ނެތް', icon: '✈️' },
    { id: 'OFFICIAL_DUTY', labelEn: 'Official Duty', labelDv: 'ރަސްމީ ކަންކަމުގައި', icon: '🏛️' },
    { id: 'OTHER', labelEn: 'Other / Family', labelDv: 'އެހެނިހެން / ޢާއިލީ', icon: '👨‍👩‍👧' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 0. Mobile Attendance Rapid Roll Call Privilege Banner */}
      {isPrivilegedUser && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-amber-400/70 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  {isRTL ? 'އަތްމަތީ ފޯނުން ހާޒިރީ ފުރުމުގެ ޚާއްޞަ އިމްތިޔާޒު' : 'Mobile Attendance Privilege Active'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-2xs">
                  RAPID ROLL CALL
                </span>
                {currentUser && (
                  <span className="text-[11px] font-bold text-teal-900 bg-white/90 px-2 py-0.5 rounded-lg border border-teal-200 shadow-2xs">
                    {isRTL && currentUser.fullNameDhivehi ? currentUser.fullNameDhivehi : currentUser.fullName}
                    {currentUser.assignedGrade && ` • ${currentUser.assignedGrade}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-900/90 mt-0.5 leading-snug">
                {isRTL
                  ? 'މޯބައިލުން ހާޒިރީ ފުރުމަށް ހަލުވި އިމްތިޔާޒު ދެވިފައި: 1-ކްލިކުން ކުދިން ޙާޟިރުކުރުމާއި، ގްރޭޑްތައް ބަދަލުކުރުން'
                  : 'Fast 1-tap touch roll call, instant class roster switching, and unhindered attendance recording.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {counts.unmarked > 0 && !isSchoolClosed && isMarkingAllowed && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onBulkMarkPresent(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                title={isRTL ? 'ބާކީ ތިބި ކުދިން ޙާޟިރުކުރޭ' : 'Mark Remaining Present'}
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isRTL ? `ބާކީ ${counts.unmarked} ކުދިން ޙާޟިރު` : `Mark ${counts.unmarked} Present`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. TOP CONTROL BAR: Header, Template Selector, and Back Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isRTL ? 'ހަލުވި ހާޒިރީ (Rapid Roll Call)' : 'Rapid Roll Call'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  FAST
                </span>
                {effectiveTimings.isTemporary && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                    {isRTL ? 'ވަގުތީ ގަޑި' : 'Temporary Timings'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL
                  ? 'ކްލާސް ޚިޔާރުކުރައްވާ، ދަރިވަރުންގެ ނަމާއި ހާޒިރީ (ޙާޟިރު، ލަސް، ސަލާމް، ޣައިރު) ފަސޭހަ ޓެމްޕްލޭޓްތަކުން ފުރުން'
                  : 'Clean easy templates to select grade class, view student names, and mark attendance (Present, Late, On Leave, Absent)'}
              </p>
            </div>
          </div>

          {/* Right Controls: 3 Easy Templates Selector & Return to Roster List */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Template Switcher: 3 Easy Templates */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              {/* Template 1: Focus Card */}
              <button
                type="button"
                onClick={() => setTemplateMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  templateMode === 'card'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isRTL ? 'ކާޑު ޓެމްޕްލޭޓް: އެއް ކުއްޖަކަށްފަހު އަނެއް ކުއްޖާ' : 'Card Template: One-by-one focus card'}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xs:inline">{isRTL ? 'ކާޑު ޓެމްޕްލޭޓް' : 'Focus Card'}</span>
                <span className="xs:hidden">{isRTL ? 'ކާޑު' : 'Card'}</span>
              </button>

              {/* Template 2: Clean Sheet Table */}
              <button
                type="button"
                onClick={() => setTemplateMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  templateMode === 'sheet'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isRTL ? 'ޝީޓް ޓެމްޕްލޭޓް: ކްލާހުގެ ހުރިހާ ދަރިވަރުންގެ ލިސްޓް' : 'Class Sheet: Full class attendance table'}
              >
                <TableProperties className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden xs:inline">{isRTL ? 'ޝީޓް ޓެމްޕްލޭޓް' : 'Class Sheet'}</span>
                <span className="xs:hidden">{isRTL ? 'ޝީޓް' : 'Sheet'}</span>
              </button>

              {/* Template 3: Quick Grid Cards */}
              <button
                type="button"
                onClick={() => setTemplateMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  templateMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isRTL ? 'ގްރިޑް ޓެމްޕްލޭޓް: ކުދިންގެ ކާޑުތައް އެއްފަހަރާ' : 'Quick Grid: Visual card grid for the whole class'}
              >
                <Grid3X3 className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden xs:inline">{isRTL ? 'ގްރިޑް ޓެމްޕްލޭޓް' : 'Quick Grid'}</span>
                <span className="xs:hidden">{isRTL ? 'ގްރިޑް' : 'Grid'}</span>
              </button>
            </div>

            {/* Return to Full Roster List Button */}
            <button
              type="button"
              onClick={onSwitchToCards}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ރޮސްޓަރ ލިސްޓް' : 'Roster List'}</span>
            </button>
          </div>
        </div>

        {/* 2. SELECT GRADE CLASS: Clean Prominent Selector with Pills & Quick Dropdown */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>{isRTL ? 'ކްލާސް ޚިޔާރުކުރައްވާ (Select Grade Class):' : 'Select Grade Class:'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 text-xs font-mono font-bold border border-sky-200">
                {selectedGrade === 'ALL' ? (isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Classes') : selectedGrade}
              </span>
            </div>

            {/* Quick Mobile/Tablet Grade Dropdown */}
            <div className="flex items-center gap-2">
              {onSelectGrade && (
                <div className="relative inline-block sm:hidden">
                  <select
                    value={selectedGrade}
                    onChange={(e) => onSelectGrade(e.target.value as GradeLevel | 'ALL')}
                    aria-label={isRTL ? 'ކްލާސް ޚިޔާރުކުރައްވާ' : 'Select Grade Class'}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="ALL">{isRTL ? 'ހުރިހާ ގްރޭޑެއް (All Grades)' : 'All Grades (215)'}</option>
                    {ALL_GRADES_LIST.filter((g) => g !== 'ALL').map((grade) => (
                      <option key={grade} value={grade}>
                        {grade} ({gradeCounts.get(grade) || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Search within Class */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={isRTL ? 'ދަރިވަރު ހޯއްދަވާ...' : 'Filter student...'}
                  className="pl-8 pr-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-36 sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* Grade Class Pills Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none touch-pan-x -mx-1 px-1">
            {ALL_GRADES_LIST.map((grade) => {
              const isAll = grade === 'ALL';
              const isSelected = isAll
                ? selectedGrade === 'ALL' || selectedGrade === 'All Grades' || selectedGrade === 'ހުރިހާ ގްރޭޑެއް'
                : selectedGrade === grade;
              const isAssigned = currentUser?.assignedGrade === grade;
              const count = isAll ? (allStudents.length || 215) : (gradeCounts.get(grade) || 0);

              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => onSelectGrade && onSelectGrade(grade)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-400/30 font-black'
                      : isAssigned
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs'
                      : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isAssigned && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                  <span>{isAll ? (isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Grades') : grade}</span>
                  {isAssigned && !isSelected && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-black">
                      {isRTL ? 'އަޅުގަނޑުގެ ކްލާސް' : 'My Class'}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timing / Future Date Lock Banner */}
        {!isSchoolClosed && !sessionEligibility.allowed && (
          <div
            className={`p-3.5 rounded-2xl border-2 shadow-xs flex items-center justify-between gap-3 text-xs ${
              sessionEligibility.reason === 'FUTURE_DATE'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  sessionEligibility.reason === 'FUTURE_DATE' ? 'bg-amber-600' : 'bg-sky-600'
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 font-extrabold">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sessionEligibility.reason === 'FUTURE_DATE' ? 'bg-amber-200 text-amber-900' : 'bg-sky-200 text-sky-900'
                    }`}
                  >
                    {sessionEligibility.reason === 'FUTURE_DATE'
                      ? (isRTL ? 'ކުރިއަށް އޮތް ތާރީޚެއް • ހާޒިރީ ބަންދު' : 'Future Date • Roll Call Locked')
                      : (isRTL ? 'ސެޝަން އަދި ނުފެށޭ • ހާޒިރީ ބަންދު' : 'Session Not Started • Roll Call Locked')}
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    {sessionEligibility.reason === 'FUTURE_DATE' ? selectedDate : `Starts ${sessionEligibility.startTime}`}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isRTL ? sessionEligibility.messageDhivehi : sessionEligibility.message}
                </p>
                {isPrivilegedUser && sessionEligibility.reason === 'START_TIME_NOT_REACHED' && (
                  <p className="text-[11px] font-bold text-amber-900 mt-1 flex items-center gap-1 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/60">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />
                    <span>
                      {isRTL
                        ? 'އަތްމަތީ ފޯނުން ހާޒިރީ ފުރުމުގެ އިމްތިޔާޒު ލިބިފައިވާތީ މިހާރުވެސް ހާޒިރީ ފުރޭނެއެވެ.'
                        : 'Mobile Rapid Roll Call privilege active: early roll call attendance marking unlocked.'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {sessionEligibility.reason === 'FUTURE_DATE' && onSelectDate && (
              <button
                type="button"
                onClick={() => onSelectDate(getMaldivesNow().dateStr)}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 transition shrink-0 cursor-pointer shadow-2xs"
              >
                {isRTL ? 'މިއަދަށް ދިއުމަށް' : 'Go to Today'}
              </button>
            )}
          </div>
        )}

        {/* 3. SESSION, DATE & SUMMARY COUNTERS */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Active Session & Date */}
          <div className="flex flex-wrap items-center gap-2">
            {onSelectSession && (
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onSelectSession('MORNING_BEFORE_BREAK')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    isMorning
                      ? 'bg-amber-500 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunrise className="w-3.5 h-3.5" />
                  <span>{t.morningSessionShort}</span>
                  <span className="text-[10px] font-mono opacity-85 hidden sm:inline">
                    ({effectiveTimings.morning.startTime}-{effectiveTimings.morning.endTime})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSession('POST_BREAK')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    !isMorning
                      ? 'bg-teal-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>{t.postBreakSessionShort}</span>
                  <span className="text-[10px] font-mono opacity-85 hidden sm:inline">
                    ({effectiveTimings.afternoon.startTime}-{effectiveTimings.afternoon.endTime})
                  </span>
                </button>
              </div>
            )}

            {onSelectDate && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-sky-700" />
                <input
                  type="date"
                  value={selectedDate}
                  max={maldivesToday}
                  onChange={(e) => onSelectDate(e.target.value)}
                  aria-label={isRTL ? 'ތާރީޚް ޚިޔާރުކުރައްވާ' : 'Select Date'}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Attendance Counters & Bulk Action */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ {counts.present} {t.present}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ⏰ {counts.late} {t.late}
              </span>
              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                🏖️ {counts.leave} {t.leave}
              </span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                ✕ {counts.absent} {t.absent}
              </span>
            </div>

            {counts.unmarked > 0 && !isSchoolClosed && isMarkingAllowed && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onBulkMarkPresent(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                title="Mark all remaining uncalled students as Present"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRTL ? `ބާކީ ${counts.unmarked} ކުދިން ޙާޟިރުކުރޭ` : `Mark ${counts.unmarked} Present`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Template Guide Banner */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              {templateMode === 'card' &&
                (isRTL
                  ? 'ކާޑު ޓެމްޕްލޭޓް: ކޮންމެ ދަރިވަރަކަށް ވަކިން ބޮޑެތި ބަޓަންތަކުން ހާޒިރީ ފުރުން (އޮޓޯއިން އަނެއް ދަރިވަރަށް ދާނެ).'
                  : 'Focus Card Template: Large tactile buttons for one student at a time with automatic advance to next student.')}
              {templateMode === 'sheet' &&
                (isRTL
                  ? 'ޝީޓް ޓެމްޕްލޭޓް: ކްލާހުގެ ހުރިހާ ދަރިވަރުންގެ ނަމާއި ހާޒިރީ (ޙާޟިރު، ލަސް، ސަލާމް، ޣައިރު) 1-ޓެޕުން ފުރޭ ތާވަލު.'
                  : 'Class Sheet Template: Clean row-by-row table showing student names and 4 instant attendance buttons (Present, Late, On Leave, Absent).')}
              {templateMode === 'grid' &&
                (isRTL
                  ? 'ގްރިޑް ޓެމްޕްލޭޓް: ކްލާހުގެ ހުރިހާ ދަރިވަރުންގެ ކާޑުތައް އެއްފަހަރާ ފެންނަ ގޮތަށް 1-ޓެޕުން ހާޒިރީ ފުރުން.'
                  : 'Quick Grid Template: Visual card tiles for every student with direct 1-tap attendance marking.')}
            </span>
          </div>
          <span className="font-mono font-bold text-slate-500 shrink-0">
            {counts.marked}/{counts.total} {isRTL ? 'ފުރިފައި' : 'Marked'}
          </span>
        </div>

        {/* Timing / Future Date Lock Banner */}
        {!isSchoolClosed && !sessionEligibility.allowed && (
          <div
            id="rapid-session-time-lock-banner"
            className={`p-4 rounded-2xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              sessionEligibility.reason === 'FUTURE_DATE'
                ? 'bg-linear-to-r from-amber-50 via-orange-50/80 to-amber-100/50 border-amber-300 text-amber-950'
                : 'bg-linear-to-r from-sky-50 via-indigo-50/70 to-blue-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  sessionEligibility.reason === 'FUTURE_DATE'
                    ? 'bg-amber-600 text-white'
                    : 'bg-sky-600 text-white'
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      sessionEligibility.reason === 'FUTURE_DATE'
                        ? 'bg-amber-200 text-amber-900 border-amber-300'
                        : 'bg-sky-200 text-sky-900 border-sky-300'
                    }`}
                  >
                    {sessionEligibility.reason === 'FUTURE_DATE'
                      ? (isRTL ? 'ކުރިއަށް އޮތް ތާރީޚެއް • ހާޒިރީ ބަންދު' : 'Future Date • Attendance Locked')
                      : (isRTL ? 'ސެޝަން އަދި ނުފެށޭ • ހާޒިރީ ބަންދު' : 'Session Not Started • Attendance Locked')}
                  </span>
                  <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedDate}
                  </span>
                  <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    {sessionEligibility.currentTime}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold mt-1">
                  {sessionEligibility.reason === 'FUTURE_DATE'
                    ? (isRTL
                        ? `ކުރިއަށް އޮތް ތާރީޚަކަށް (${selectedDate}) ހާޒިރީއެއް ނުޖެހޭނެއެވެ`
                        : `Cannot mark attendance before date arrives (${selectedDate})`)
                    : (isRTL
                        ? `ސެޝަން އަދި ނުފެށެއެވެ (${sessionEligibility.startTime})`
                        : `Session roll call only opens after start time (${sessionEligibility.startTime})`)}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                  {isRTL ? sessionEligibility.messageDhivehi : sessionEligibility.message}
                </p>
                {isPrivilegedUser && sessionEligibility.reason === 'START_TIME_NOT_REACHED' && (
                  <p className="text-xs font-bold text-amber-900 mt-1.5 flex items-center gap-1.5 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0" />
                    <span>
                      {isRTL
                        ? 'އަތްމަތީ ފޯނުން ހާޒިރީ ފުރުމުގެ އިމްތިޔާޒު ލިބިފައިވާތީ މިހާރުވެސް ހާޒިރީ ފުރޭނެއެވެ.'
                        : 'Mobile Rapid Roll Call privilege active: early roll call attendance marking unlocked.'}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {sessionEligibility.reason === 'FUTURE_DATE' && onSelectDate && selectedDate !== maldivesToday && (
              <button
                type="button"
                onClick={() => onSelectDate(maldivesToday)}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>{isRTL ? `މިއަދަށް ދިއުމަށް (${maldivesToday})` : `Go to Today (${maldivesToday})`}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. TEMPLATE A: SINGLE STUDENT FOCUS CARD                       */}
      {/* ============================================================== */}
      {templateMode === 'card' && (
        <div className="space-y-4">
          {!currentStudent || displayStudents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-black text-lg text-slate-800">
                {isRTL ? 'މި ކްލާހުގައި ދަރިވަރަކު ނެތް' : 'No Students Found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isRTL
                  ? 'މަތީގައިވާ ގްރޭޑްތަކުން އެހެން ކްލާހެއް ޚިޔާރުކުރައްވާ ނުވަތަ ސާޗް ފިލްޓަރު ބަދަލުކުރައްވާ.'
                  : 'Select another grade class from the pills above or adjust your search filter.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-md space-y-5">
              {/* Stepper & Progress */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-900 font-extrabold text-xs">
                    {currentStudent.gradeLevel}
                  </span>
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1 font-mono">
                    <span>{isRTL ? 'ދަރިވަރު' : 'Student'}</span>
                    <span className="text-slate-900 font-black text-sm">{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{displayStudents.length}</span>
                  </div>
                </div>

                {/* Prev / Next buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setCurrentIndex((prev) => Math.max(0, prev - 1));
                      setShowLateOptions(false);
                      setShowLeaveOptions(false);
                    }}
                    disabled={currentIndex === 0}
                    aria-label={isRTL ? 'ކުރީގެ ދަރިވަރު' : 'Previous Student'}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center min-h-[38px] min-w-[38px] ${
                      currentIndex === 0
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setCurrentIndex((prev) => Math.min(displayStudents.length - 1, prev + 1));
                      setShowLateOptions(false);
                      setShowLeaveOptions(false);
                    }}
                    disabled={currentIndex === displayStudents.length - 1}
                    aria-label={isRTL ? 'ދެން އޮތް ދަރިވަރު' : 'Next Student'}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center min-h-[38px] min-w-[38px] ${
                      currentIndex === displayStudents.length - 1
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer active:scale-95'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Student Identity Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center gap-4">
                  {/* Photo / Gender Avatar */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black text-sm border-2 shrink-0 shadow-sm ${
                      currentStudent.gender === 'MALE'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <span className="text-lg font-black font-mono">
                      {currentStudent.admissionNumber.replace('FMS-', '')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">
                      {currentStudent.gender === 'MALE' ? (isRTL ? 'ފިރިހެން' : 'Boy') : (isRTL ? 'އަންހެން' : 'Girl')}
                    </span>
                  </div>

                  {/* Student Name */}
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight font-thaana">
                      {currentStudent.fullNameDhivehi || currentStudent.fullName}
                    </h3>
                    <p className="text-sm font-bold text-slate-600 mt-1">
                      {currentStudent.fullName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold">
                        {currentStudent.admissionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 text-xs font-black">
                        {currentStudent.gradeLevel}
                      </span>
                      {counterpartRecord?.status && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isMorning ? 'P.Break:' : 'Morning:'} {counterpartRecord.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Status Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-bold">
                    {isRTL ? 'މިހާރުގެ ޙާލަތު:' : 'Current Status:'}
                  </span>
                  <span
                    className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs ${
                      isCurrentPresent
                        ? 'bg-emerald-600 text-white'
                        : isCurrentLate
                        ? 'bg-amber-500 text-white'
                        : isCurrentLeave
                        ? 'bg-indigo-600 text-white'
                        : isCurrentAbsent
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrentPresent && <CheckCircle className="w-4 h-4" />}
                    {isCurrentLate && <Clock className="w-4 h-4" />}
                    {isCurrentLeave && <AlertCircle className="w-4 h-4" />}
                    {isCurrentAbsent && <XCircle className="w-4 h-4" />}
                    <span>
                      {isCurrentPresent
                        ? t.present
                        : isCurrentLate
                        ? `${t.late} (${currentRecord?.arrivalTime || (isMorning ? '08:15' : '11:00')})`
                        : isCurrentLeave
                        ? t.leave
                        : isCurrentAbsent
                        ? t.absent
                        : (isRTL ? 'ނުފުރާ (Unmarked)' : 'Unmarked')}
                    </span>
                  </span>
                </div>
              </div>

              {/* 4 BIG ATTENDANCE ACTION BUTTONS: Present, Late, On Leave, Absent */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* PRESENT */}
                  <button
                    type="button"
                    disabled={!isMarkingAllowed}
                    onClick={() => handleMarkPresent()}
                    className={`h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm sm:text-base transition touch-manipulation shadow-md ${
                      !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    } ${
                      isCurrentPresent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/40'
                        : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
                    }`}
                    title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                  >
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <span>{isRTL ? 'ޙާޟިރު (Present)' : 'Present'}</span>
                    <span className="text-[10px] font-mono opacity-80 hidden sm:inline">[Key: 1]</span>
                  </button>

                  {/* LATE */}
                  <button
                    type="button"
                    disabled={!isMarkingAllowed}
                    onClick={() => {
                      if (!isMarkingAllowed) return;
                      triggerHaptic(20);
                      setShowLateOptions(!showLateOptions);
                      setShowLeaveOptions(false);
                    }}
                    className={`h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm sm:text-base transition touch-manipulation shadow-md ${
                      !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    } ${
                      isCurrentLate
                        ? 'bg-amber-500 text-white ring-4 ring-amber-400/40'
                        : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950'
                    }`}
                    title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                  >
                    <Clock className="w-6 h-6 shrink-0" />
                    <span>{isRTL ? 'ލަސް (Late)' : 'Late'}</span>
                    <span className="text-[10px] font-mono opacity-80 hidden sm:inline">[Key: 2]</span>
                  </button>

                  {/* ON LEAVE */}
                  <button
                    type="button"
                    disabled={!isMarkingAllowed}
                    onClick={() => {
                      if (!isMarkingAllowed) return;
                      triggerHaptic(20);
                      setShowLeaveOptions(!showLeaveOptions);
                      setShowLateOptions(false);
                    }}
                    className={`h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm sm:text-base transition touch-manipulation shadow-md ${
                      !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    } ${
                      isCurrentLeave
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/40'
                        : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white'
                    }`}
                    title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                  >
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <span>{isRTL ? 'ސަލާމް / ޗުއްޓީ (On Leave)' : 'On Leave'}</span>
                    <span className="text-[10px] font-mono opacity-80 hidden sm:inline">[Key: 3]</span>
                  </button>

                  {/* ABSENT */}
                  <button
                    type="button"
                    disabled={!isMarkingAllowed}
                    onClick={() => handleMarkAbsent()}
                    className={`h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm sm:text-base transition touch-manipulation shadow-md ${
                      !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    } ${
                      isCurrentAbsent
                        ? 'bg-rose-600 text-white ring-4 ring-rose-500/40'
                        : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white'
                    }`}
                    title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                  >
                    <XCircle className="w-6 h-6 shrink-0" />
                    <span>{isRTL ? 'ޣައިރުޙާޟިރު (Absent)' : 'Absent'}</span>
                    <span className="text-[10px] font-mono opacity-80 hidden sm:inline">[Key: 4]</span>
                  </button>
                </div>

                {/* Late Arrival Time Options Dropdown */}
                {showLateOptions && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-1 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{isRTL ? 'އައި ގަޑި ޚިޔާރުކުރައްވާ (އޮޓޯއިން އަނެއް ކުއްޖާއަށް ދާނެ):' : 'Select Arrival Time (Auto-advances to next student):'}</span>
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

                {/* Leave Reason Options Dropdown */}
                {showLeaveOptions && (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl animate-in fade-in slide-in-from-top-1 space-y-2">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{isRTL ? 'ސަލާމުގެ ސަބަބު ޚިޔާރުކުރައްވާ:' : 'Select Leave Reason (Auto-advances):'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                {/* Notify Parent SMS button if absent or late */}
                {(isCurrentAbsent || isCurrentLate) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenSmsDraftModal(currentStudent)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 text-rose-600" />
                      <span>{isRTL ? 'ބެލެނިވެރިޔާއަށް SMS ފޮނުވާ' : 'Draft Absence SMS to Parent'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Jump Carousel */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'ކްލާހުގެ ދަރިވަރުން (ފިއްތާލުމުން އެ ދަރިވަރަކަށް ދެވޭނެ):' : 'Class Roster Carousel (Tap to jump):'}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700">
                    {counts.marked}/{counts.total} {isRTL ? 'ފުރިފައި' : 'marked'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-1 px-1">
                  {displayStudents.map((st, idx) => {
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
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
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
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TEMPLATE B: CLEAN CLASS SHEET TEMPLATE (ROW-BY-ROW TABLE)   */}
      {/* ============================================================== */}
      {templateMode === 'sheet' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-teal-700" />
                <span>
                  {selectedGrade === 'ALL'
                    ? (isRTL ? 'ހުރިހާ ކްލާހެއްގެ ހާޒިރީ ޝީޓް' : 'All Classes Attendance Sheet')
                    : `${selectedGrade} ${isRTL ? 'ކްލާސް ހާޒިރީ ޝީޓް' : 'Class Attendance Sheet'}`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL
                  ? 'ކޮންމެ ދަރިވަރެއްގެ ކުރިމަތީގައިވާ ހާޒިރީ ބަޓަންތަކުން 1-ޓެޕުން ފުރުން (ޙާޟިރު، ލަސް، ސަލާމް، ޣައިރު)'
                  : 'Fast 1-tap attendance marking for every student: Present, Late, On Leave, Absent'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
                {counts.marked} / {displayStudents.length} Marked
              </span>
            </div>
          </div>

          {/* Table Header Row */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">{isRTL ? 'ދަރިވަރުގެ ނަން (Student Name)' : 'Student Name'}</div>
            <div className="col-span-2 text-center">{isRTL ? 'ކްލާސް (Class)' : 'Class / ID'}</div>
            <div className="col-span-5 text-center">{isRTL ? 'ހާޒިރީ (Attendance Action)' : 'Attendance (Present / Late / Leave / Absent)'}</div>
          </div>

          <div className="divide-y divide-slate-100">
            {displayStudents.map((student, idx) => {
              const rec = recordsMap.get(student.id);
              const status = rec?.status || 'UNMARKED';
              const isPresent = status === 'PRESENT';
              const isLate = status === 'LATE';
              const isLeave = status === 'LEAVE';
              const isAbsent = status === 'ABSENT';

              const isShowingLatePills = activeLateStudentId === student.id;
              const isShowingLeavePills = activeLeaveStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={`p-3.5 sm:p-4 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 ${
                    isPresent
                      ? 'bg-emerald-50/25 hover:bg-emerald-50/40'
                      : isAbsent
                      ? 'bg-rose-50/30 hover:bg-rose-50/45'
                      : isLate
                      ? 'bg-amber-50/30 hover:bg-amber-50/45'
                      : isLeave
                      ? 'bg-indigo-50/30 hover:bg-indigo-50/45'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* # Index Column */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Student Name Column */}
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="md:hidden w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-thaana font-black text-slate-900 text-base">
                            {student.fullNameDhivehi || student.fullName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {student.admissionNumber}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                          {student.fullName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Class Column */}
                  <div className="md:col-span-2 flex items-center md:justify-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 text-xs font-black">
                      {student.gradeLevel}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {student.gender === 'MALE' ? (isRTL ? 'ފިރިހެން' : 'Boy') : (isRTL ? 'އަންހެން' : 'Girl')}
                    </span>
                  </div>

                  {/* 4 Attendance Action Buttons: Present, Late, On Leave, Absent */}
                  <div className="md:col-span-5 flex flex-col items-start md:items-end gap-1.5">
                    <div className="grid grid-cols-4 w-full sm:w-auto sm:flex sm:items-center gap-1.5">
                      {/* PRESENT */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => handleMarkPresent(student.id, false)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 min-h-[38px] ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.present}</span>
                      </button>

                      {/* LATE */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => {
                          if (!isMarkingAllowed) return;
                          triggerHaptic(20);
                          setActiveLateStudentId(isShowingLatePills ? null : student.id);
                          setActiveLeaveStudentId(null);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 min-h-[38px] ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/40'
                            : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.late}</span>
                      </button>

                      {/* LEAVE */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => {
                          if (!isMarkingAllowed) return;
                          triggerHaptic(20);
                          setActiveLeaveStudentId(isShowingLeavePills ? null : student.id);
                          setActiveLateStudentId(null);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 min-h-[38px] ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isLeave
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/40'
                            : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 hover:border-indigo-300'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{t.leave}</span>
                      </button>

                      {/* ABSENT */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => handleMarkAbsent(student.id, false)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 min-h-[38px] ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/40'
                            : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-300'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t.absent}</span>
                      </button>

                      {/* SMS button for absent/late students */}
                      {(isAbsent || isLate) && (
                        <button
                          type="button"
                          onClick={() => onOpenSmsDraftModal(student)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Draft SMS to Parent"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Inline Late Time Selector */}
                    {isShowingLatePills && (
                      <div className="flex flex-wrap items-center gap-1 bg-amber-50 p-1.5 rounded-xl border border-amber-300 animate-in fade-in">
                        <span className="text-[10px] font-bold text-amber-900 mr-1">Time:</span>
                        {latePresets.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleMarkLateWithTime(time, student.id, false)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100 font-mono font-bold text-[11px] text-amber-900 border border-amber-200 shadow-2xs cursor-pointer"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inline Leave Reason Selector */}
                    {isShowingLeavePills && (
                      <div className="flex flex-wrap items-center gap-1 bg-indigo-50 p-1.5 rounded-xl border border-indigo-300 animate-in fade-in">
                        <span className="text-[10px] font-bold text-indigo-900 mr-1">Reason:</span>
                        {leavePresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleMarkLeaveWithReason(preset.id, student.id, false)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-indigo-100 text-[11px] font-bold text-indigo-900 border border-indigo-200 shadow-2xs cursor-pointer"
                          >
                            {isRTL ? preset.labelDv : preset.labelEn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TEMPLATE C: QUICK GRID TEMPLATE (VISUAL STUDENT TILES)     */}
      {/* ============================================================== */}
      {templateMode === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {displayStudents.map((student, idx) => {
              const rec = recordsMap.get(student.id);
              const status = rec?.status || 'UNMARKED';
              const isPresent = status === 'PRESENT';
              const isLate = status === 'LATE';
              const isLeave = status === 'LEAVE';
              const isAbsent = status === 'ABSENT';

              const isShowingLatePills = activeLateStudentId === student.id;
              const isShowingLeavePills = activeLeaveStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-2xl border-2 p-3.5 transition-all shadow-xs flex flex-col justify-between gap-3 ${
                    isPresent
                      ? 'border-emerald-400 bg-emerald-50/15'
                      : isAbsent
                      ? 'border-rose-400 bg-rose-50/20'
                      : isLate
                      ? 'border-amber-400 bg-amber-50/20'
                      : isLeave
                      ? 'border-indigo-400 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top: Student Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 border ${
                          student.gender === 'MALE'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {student.admissionNumber.replace('FMS-', '')}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-thaana font-black text-slate-900 text-sm truncate">
                          {student.fullNameDhivehi || student.fullName}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">
                          {student.fullName}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Middle: Grade & Status Indicator */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 text-[11px] font-black">
                      {student.gradeLevel}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-800'
                          : isLate
                          ? 'bg-amber-100 text-amber-900'
                          : isLeave
                          ? 'bg-indigo-100 text-indigo-900'
                          : isAbsent
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPresent && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {isLate && <Clock className="w-3 h-3 text-amber-600" />}
                      {isLeave && <AlertCircle className="w-3 h-3 text-indigo-600" />}
                      {isAbsent && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>
                        {isPresent
                          ? t.present
                          : isLate
                          ? `${t.late} (${rec?.arrivalTime || (isMorning ? '08:15' : '11:00')})`
                          : isLeave
                          ? t.leave
                          : isAbsent
                          ? t.absent
                          : (isRTL ? 'ނުފުރާ' : 'Unmarked')}
                      </span>
                    </span>
                  </div>

                  {/* Bottom: 4 Attendance Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-4 gap-1">
                      {/* PRESENT */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => handleMarkPresent(student.id, false)}
                        className={`py-2 rounded-xl text-[11px] font-black transition flex flex-col items-center justify-center gap-0.5 ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.present}</span>
                      </button>

                      {/* LATE */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => {
                          if (!isMarkingAllowed) return;
                          triggerHaptic(20);
                          setActiveLateStudentId(isShowingLatePills ? null : student.id);
                          setActiveLeaveStudentId(null);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-black transition flex flex-col items-center justify-center gap-0.5 ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.late}</span>
                      </button>

                      {/* LEAVE */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => {
                          if (!isMarkingAllowed) return;
                          triggerHaptic(20);
                          setActiveLeaveStudentId(isShowingLeavePills ? null : student.id);
                          setActiveLateStudentId(null);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-black transition flex flex-col items-center justify-center gap-0.5 ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isLeave
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{t.leave}</span>
                      </button>

                      {/* ABSENT */}
                      <button
                        type="button"
                        disabled={!isMarkingAllowed}
                        onClick={() => handleMarkAbsent(student.id, false)}
                        className={`py-2 rounded-xl text-[11px] font-black transition flex flex-col items-center justify-center gap-0.5 ${
                          !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                            : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed ? sessionEligibility.message : undefined}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t.absent}</span>
                      </button>
                    </div>

                    {/* Inline Late Time selector */}
                    {isShowingLatePills && (
                      <div className="flex flex-wrap items-center gap-1 bg-amber-50 p-1.5 rounded-xl border border-amber-300 animate-in fade-in">
                        {latePresets.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleMarkLateWithTime(time, student.id, false)}
                            className="flex-1 py-1 rounded-lg bg-white hover:bg-amber-100 font-mono font-bold text-[10px] text-amber-900 border border-amber-200 cursor-pointer"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inline Leave Reason selector */}
                    {isShowingLeavePills && (
                      <div className="grid grid-cols-2 gap-1 bg-indigo-50 p-1.5 rounded-xl border border-indigo-300 animate-in fade-in">
                        {leavePresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleMarkLeaveWithReason(preset.id, student.id, false)}
                            className="py-1 px-1 rounded-lg bg-white hover:bg-indigo-100 text-[10px] font-bold text-indigo-900 border border-indigo-200 cursor-pointer truncate"
                          >
                            {isRTL ? preset.labelDv : preset.labelEn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. COMPLETION / SESSION SUBMIT BANNER                          */}
      {/* ============================================================== */}
      {counts.unmarked === 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-black text-base sm:text-lg">
                {isRTL ? 'މި ކްލާހުގެ ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ ފުރިހަމަވެއްޖެ!' : 'Roll Call Complete for this Class!'}
              </h4>
            </div>
            <div className="text-xs text-emerald-100 font-bold mt-1.5 flex items-center gap-2.5 flex-wrap">
              <span>✓ {counts.present} {t.present}</span>
              <span>•</span>
              <span>⏰ {counts.late} {t.late}</span>
              <span>•</span>
              <span>🏖️ {counts.leave} {t.leave}</span>
              <span>•</span>
              <span>✕ {counts.absent} {t.absent}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSubmitSession && !isSchoolClosed && (
              <button
                type="button"
                onClick={isSessionSubmitted ? undefined : onSubmitSession}
                disabled={isSessionSubmitted}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 ${
                  isSessionSubmitted
                    ? 'bg-white/20 text-white cursor-default'
                    : 'bg-white hover:bg-emerald-50 text-emerald-950 active:scale-95 cursor-pointer'
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
        </div>
      )}
    </div>
  );
};
