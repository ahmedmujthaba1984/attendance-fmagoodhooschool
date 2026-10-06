import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mic,
  Search,
  CheckCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronDown,
  Info,
  ShieldAlert,
  Sunrise,
  Sunset,
  ArrowRightLeft,
  Lock,
  AlertTriangle,
  Building,
  Check,
  CloudRain,
  Send,
  RefreshCw,
  Pencil,
  UserCheck,
  Users,
  RotateCcw,
  LockOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  Zap,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  GradeLevel,
  SessionType,
  LeaveReason,
  PendingAttendanceSession,
  DayType,
  User,
  SchoolSessionTimings,
} from '../types';
import { PendingAttendanceWarningModal } from './PendingAttendanceWarningModal';
import { SuperAdminRevertModal } from './SuperAdminRevertModal';
import { RapidRollCallView } from './RapidRollCallView';
import { SessionTimingsModal } from './SessionTimingsModal';
import {
  getEffectiveSessionTimings,
  checkSessionMarkingEligibility,
  getMaldivesNow,
} from '../utils/sessionTimingsHelper';

interface AttendanceMatrixProps {
  students: Student[];
  records: AttendanceRecord[];
  counterpartRecords?: AttendanceRecord[];
  selectedGrade: GradeLevel | 'ALL';
  setSelectedGrade: (g: GradeLevel | 'ALL') => void;
  selectedSession: SessionType;
  setSelectedSession: (s: SessionType) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  sessionTimings?: SchoolSessionTimings;
  onUpdateSessionTimings?: (timings: SchoolSessionTimings) => Promise<void> | void;
  onUpdateRecord: (rec: AttendanceRecord) => void;
  onBulkMarkPresent: (onlyUnmarked?: boolean) => void;
  onOpenVoiceModal: () => void;
  onOpenSmsDraftModal: (student: Student) => void;
  isWeekend: boolean;
  isSchoolClosed?: boolean;
  schoolClosureReason?: string;
  schoolClosureReasonDhivehi?: string;
  closureDetails?: any;
  pendingPreviousSession?: PendingAttendanceSession | null;
  isSessionSubmitted?: boolean;
  onGoToPendingSession?: (date: string, session: SessionType, grade: GradeLevel | 'ALL') => void;
  onSubmitSession?: () => void;
  onRevertSession?: (reason: string) => Promise<void>;
  onRevertRecord?: (params: {
    studentId: string;
    newStatus: AttendanceStatus;
    leaveReason?: LeaveReason;
    arrivalTime?: string;
    reason: string;
  }) => Promise<void>;
  onDeclareSchoolClosed?: (reason: string, reasonDhivehi?: string) => void;
  onReopenSchool?: () => void;
  onReopenSchoolDay?: () => void;
  onEditStudent?: (student: Student) => void;
  currentUser?: User | null;
  staffList?: User[];
  onSwitchStaff?: (staffId: string) => void;
  onOpenLoginView?: () => void;
  onRapidModeChange?: (isRapid: boolean) => void;
}

export const MALDIVIAN_HOLIDAY_PRESETS = [
  { name: 'The Day Maldives Embraced Islam', nameDhivehi: 'ރާއްޖެ އިސްލާމްވި ދުވަސް' },
  { name: 'Mid Term Break', nameDhivehi: 'މިޑް ޓާމް ބްރޭކް' },
  { name: 'National Day (Qaumee Dhuvas)', nameDhivehi: 'ޤައުމީ ދުވަސް' },
  { name: 'Victory Day (Nasru Dhuvas)', nameDhivehi: 'ނަޞްރުގެ ދުވަސް' },
  { name: 'Republic Day (Jumhooree Dhuvas)', nameDhivehi: 'ޖުމްހޫރީ ދުވަސް' },
  { name: 'First Term Break', nameDhivehi: 'ފުރަތަމަ ޓާމް ޗުއްޓީ' },
  { name: 'Second Term Break', nameDhivehi: 'ދެވަނަ ޓާމް ޗުއްޓީ' },
  { name: 'Eid al-Fitr Holiday', nameDhivehi: 'ފިޠުރު ޢީދު ބަންދު' },
  { name: 'Eid al-Adha Holiday', nameDhivehi: 'އަޟްޙާ ޢީދު ބަންދު' },
  { name: 'Independence Day Holiday', nameDhivehi: 'މިނިވަން ދުވަހުގެ ބަންދު' },
];

export const AttendanceMatrix: React.FC<AttendanceMatrixProps> = ({
  students,
  records,
  counterpartRecords = [],
  selectedGrade,
  setSelectedGrade,
  selectedSession,
  setSelectedSession,
  selectedDate,
  setSelectedDate,
  onUpdateRecord,
  onBulkMarkPresent,
  onOpenVoiceModal,
  onOpenSmsDraftModal,
  isWeekend,
  isSchoolClosed = false,
  schoolClosureReason = '',
  schoolClosureReasonDhivehi = '',
  pendingPreviousSession = null,
  isSessionSubmitted = false,
  onGoToPendingSession,
  onSubmitSession,
  onRevertSession,
  onRevertRecord,
  onDeclareSchoolClosed,
  onReopenSchool,
  onReopenSchoolDay,
  onEditStudent,
  currentUser,
  staffList,
  onSwitchStaff,
  onOpenLoginView,
  sessionTimings = {
    morning: { startTime: '07:45', endTime: '10:15', label: 'Morning Session', labelDhivehi: 'ހެނދުނުގެ ސެޝަން' },
    afternoon: { startTime: '10:45', endTime: '13:15', label: 'Afternoon Session', labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން' },
  },
  onUpdateSessionTimings,
  onRapidModeChange,
}) => {
  const { t, isRTL } = useLanguage();

  const isSuperAdmin = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT'>('ALL');
  const [mobileRollCallMode, setMobileRollCallMode] = useState<'cards' | 'rapid'>('cards');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showLockedNoticeModal, setShowLockedNoticeModal] = useState(false);
  const [showTimingsModal, setShowTimingsModal] = useState(false);

  const handleSetRollCallMode = (mode: 'cards' | 'rapid') => {
    setMobileRollCallMode(mode);
    onRapidModeChange?.(mode === 'rapid');
  };

  // Compute effective session timing (normal or temporary override for selected date)
  const effectiveTimings = getEffectiveSessionTimings(sessionTimings, selectedDate);

  // Auto-refresh clock tick every 30 seconds so eligibility updates as Maldives time passes
  const [currentMinuteTick, setCurrentMinuteTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinuteTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const maldivesToday = getMaldivesNow().dateStr;

  // Session marking eligibility: cannot mark future dates or session before start time
  const sessionEligibility = useMemo(() => {
    return checkSessionMarkingEligibility(selectedDate, selectedSession, sessionTimings);
  }, [selectedDate, selectedSession, sessionTimings, currentMinuteTick]);

  const morningEligibility = useMemo(() => {
    return checkSessionMarkingEligibility(selectedDate, 'MORNING_BEFORE_BREAK', sessionTimings);
  }, [selectedDate, sessionTimings, currentMinuteTick]);

  const afternoonEligibility = useMemo(() => {
    return checkSessionMarkingEligibility(selectedDate, 'POST_BREAK', sessionTimings);
  }, [selectedDate, sessionTimings, currentMinuteTick]);

  const isMarkingAllowed = sessionEligibility.allowed && !isSchoolClosed;
  const [showEligibilityNoticeModal, setShowEligibilityNoticeModal] = useState(false);

  const handlePrevDay = () => {
    try {
      const d = new Date(selectedDate + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    } catch {}
  };

  const handleNextDay = () => {
    try {
      const d = new Date(selectedDate + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      const nextDateStr = d.toISOString().slice(0, 10);
      if (nextDateStr > maldivesToday) {
        return;
      }
      setSelectedDate(nextDateStr);
    } catch {}
  };

  const handleToday = () => {
    setSelectedDate(maldivesToday);
  };
  const [revertModalState, setRevertModalState] = useState<{
    isOpen: boolean;
    mode: 'RECORD' | 'SESSION';
    student?: Student;
    currentRecord?: AttendanceRecord;
  }>({
    isOpen: false,
    mode: 'RECORD',
  });
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closurePreset, setClosurePreset] = useState<string>('HOLIDAY');
  const [selectedHolidayPreset, setSelectedHolidayPreset] = useState<string>('The Day Maldives Embraced Islam');
  const [customClosureReason, setCustomClosureReason] = useState<string>('');
  const [customClosureReasonDhivehi, setCustomClosureReasonDhivehi] = useState<string>('');

  const handleReopen = onReopenSchool || onReopenSchoolDay;

  // Format consistent school closed label: "School Closed - [Holiday Name]"
  const formattedClosureLabel = useMemo(() => {
    const raw = schoolClosureReason || '';
    const clean = raw.replace(/^School Closed(?:\s*[:-]\s*)?/i, '').trim();
    if (!clean) return 'School Closed';
    return `School Closed - ${clean}`;
  }, [schoolClosureReason]);

  const formattedClosureLabelDhivehi = useMemo(() => {
    const raw = schoolClosureReasonDhivehi || schoolClosureReason || '';
    const clean = raw
      .replace(/^ސްކޫލް ބަންދު(?:\s*[:-]\s*)?/i, '')
      .replace(/^School Closed(?:\s*[:-]\s*)?/i, '')
      .trim();
    if (!clean) return 'ސްކޫލް ބަންދު';
    return `ސްކޫލް ބަންދު - ${clean}`;
  }, [schoolClosureReasonDhivehi, schoolClosureReason]);

  const holidayNameOnly = useMemo(() => {
    const raw = schoolClosureReason || '';
    return raw.replace(/^School Closed(?:\s*[:-]\s*)?/i, '').trim();
  }, [schoolClosureReason]);

  const holidayNameOnlyDhivehi = useMemo(() => {
    const raw = schoolClosureReasonDhivehi || schoolClosureReason || '';
    return raw
      .replace(/^ސްކޫލް ބަންދު(?:\s*[:-]\s*)?/i, '')
      .replace(/^School Closed(?:\s*[:-]\s*)?/i, '')
      .trim();
  }, [schoolClosureReasonDhivehi, schoolClosureReason]);

  const gradesList: (GradeLevel | 'ALL')[] = [
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

  // Filter base roster students based on grade & search query
  const rosterStudents = useMemo(() => {
    return students.filter((st) => {
      const matchGrade = selectedGrade === 'ALL' || st.gradeLevel === selectedGrade;
      if (!matchGrade) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.fullName.toLowerCase().includes(q) ||
        st.fullNameDhivehi.includes(q) ||
        st.admissionNumber.toLowerCase().includes(q)
      );
    });
  }, [students, selectedGrade, searchQuery]);

  // Map existing records by studentId for O(1) lookup
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => {
      map.set(r.studentId, r);
    });
    return map;
  }, [records]);

  // Map counterpart session records for cross-session identification
  const counterpartMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    counterpartRecords.forEach((r) => {
      map.set(r.studentId, r);
    });
    return map;
  }, [counterpartRecords]);

  // Calculate live counters for current roster
  const currentCounters = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let unmarked = 0;

    rosterStudents.forEach((st) => {
      const rec = recordsMap.get(st.id);
      if (!rec || !rec.status) {
        unmarked++;
      } else {
        const status = rec.status;
        if (status === 'PRESENT') present++;
        else if (status === 'ABSENT') absent++;
        else if (status === 'LATE') late++;
        else if (status === 'LEAVE') leave++;
      }
    });

    return { present, absent, late, leave, unmarked, total: rosterStudents.length };
  }, [rosterStudents, recordsMap]);

  const markedStudentsCount = useMemo(() => {
    return rosterStudents.filter((st) => {
      const rec = recordsMap.get(st.id);
      return rec && rec.status;
    }).length;
  }, [rosterStudents, recordsMap]);

  // Students displayed (supporting instant status filter clicks e.g. "Absent (1)")
  const filteredStudents = useMemo(() => {
    if (statusFilter === 'ALL') return rosterStudents;
    return rosterStudents.filter((st) => {
      const rec = recordsMap.get(st.id);
      if (statusFilter === 'UNMARKED') {
        return !rec || !rec.status;
      }
      return rec?.status === statusFilter;
    });
  }, [rosterStudents, statusFilter, recordsMap]);

  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceRecord['status'],
    defaultLeaveReason?: LeaveReason
  ) => {
    if (isSchoolClosed) {
      return;
    }
    if (!sessionEligibility.allowed) {
      setShowEligibilityNoticeModal(true);
      return;
    }
    if (isSessionSubmitted) {
      if (!isSuperAdmin) {
        setShowLockedNoticeModal(true);
        return;
      }
      const student = students.find((s) => s.id === studentId);
      const existing = recordsMap.get(studentId);
      setRevertModalState({
        isOpen: true,
        mode: 'RECORD',
        student,
        currentRecord: existing,
      });
      return;
    }
    const existing = recordsMap.get(studentId);
    const defaultLateTime = selectedSession === 'MORNING_BEFORE_BREAK' ? '08:15' : '11:00';
    const activeUserId = currentUser?.id || 'staff-1';
    const activeUserName = currentUser?.fullName;
    const updated: AttendanceRecord = {
      id: existing?.id || `att-${studentId}-${selectedDate}-${selectedSession}`,
      studentId,
      date: selectedDate,
      sessionType: selectedSession,
      status: newStatus,
      leaveReason: defaultLeaveReason || (newStatus === 'LEAVE' ? 'SICK_LEAVE' : 'NONE'),
      arrivalTime: newStatus === 'LATE' ? existing?.arrivalTime || defaultLateTime : undefined,
      markedByUserId: activeUserId,
      markedByUserName: activeUserName,
      syncStatus: 'PENDING_OFFLINE',
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord(updated);
  };

  const handleReasonChange = (studentId: string, reason: LeaveReason) => {
    if (isSchoolClosed) return;
    if (!sessionEligibility.allowed) {
      setShowEligibilityNoticeModal(true);
      return;
    }
    if (isSessionSubmitted && !isSuperAdmin) {
      setShowLockedNoticeModal(true);
      return;
    }
    const existing = recordsMap.get(studentId);
    const activeUserId = currentUser?.id || 'staff-1';
    const activeUserName = currentUser?.fullName;
    const updated: AttendanceRecord = {
      id: existing?.id || `att-${studentId}-${selectedDate}-${selectedSession}`,
      studentId,
      date: selectedDate,
      sessionType: selectedSession,
      status: existing?.status || 'LEAVE',
      leaveReason: reason,
      arrivalTime: existing?.arrivalTime,
      markedByUserId: activeUserId,
      markedByUserName: activeUserName,
      syncStatus: 'PENDING_OFFLINE',
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord(updated);
  };

  const handleArrivalTimeChange = (studentId: string, time: string) => {
    if (isSchoolClosed) return;
    if (!sessionEligibility.allowed) {
      setShowEligibilityNoticeModal(true);
      return;
    }
    if (isSessionSubmitted && !isSuperAdmin) {
      setShowLockedNoticeModal(true);
      return;
    }
    const existing = recordsMap.get(studentId);
    const activeUserId = currentUser?.id || 'staff-1';
    const activeUserName = currentUser?.fullName;
    const updated: AttendanceRecord = {
      id: existing?.id || `att-${studentId}-${selectedDate}-${selectedSession}`,
      studentId,
      date: selectedDate,
      sessionType: selectedSession,
      status: existing?.status || 'LATE',
      leaveReason: existing?.leaveReason || 'NONE',
      arrivalTime: time,
      markedByUserId: activeUserId,
      markedByUserName: activeUserName,
      syncStatus: 'PENDING_OFFLINE',
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord(updated);
  };

  const handleBulkMarkPresentClicked = (onlyUnmarked: boolean = false) => {
    if (isSchoolClosed) return;
    if (!sessionEligibility.allowed) {
      setShowEligibilityNoticeModal(true);
      return;
    }
    if (isSessionSubmitted && !isSuperAdmin) {
      setShowLockedNoticeModal(true);
      return;
    }
    onBulkMarkPresent(onlyUnmarked);
  };

  const handleVoiceModalClicked = () => {
    if (isSchoolClosed) return;
    if (!sessionEligibility.allowed) {
      setShowEligibilityNoticeModal(true);
      return;
    }
    if (isSessionSubmitted && !isSuperAdmin) {
      setShowLockedNoticeModal(true);
      return;
    }
    onOpenVoiceModal();
  };

  const handleConfirmClosure = () => {
    let reason = 'The Day Maldives Embraced Islam';
    let reasonDv = 'ރާއްޖެ އިސްލާމްވި ދުވަސް';

    if (closurePreset === 'WEATHER') {
      reason = 'Severe Weather (Yellow Alert / Monsoon Storm / Swell Waves)';
      reasonDv = 'މޫސުން ގޯސްވުމުގެ ސަބަބުން (ޔެލޯ އެލާޓް / ރާޅު އެރުން)';
    } else if (closurePreset === 'ISLAND_EVENT') {
      reason = 'Local Island Council Event / Community Assembly';
      reasonDv = 'ރަށު ކައުންސިލްގެ ޚާއްޞަ އިވެންޓް';
    } else if (closurePreset === 'HOLIDAY') {
      const match = MALDIVIAN_HOLIDAY_PRESETS.find((h) => h.name === selectedHolidayPreset);
      reason = match ? match.name : selectedHolidayPreset;
      reasonDv = match ? match.nameDhivehi : selectedHolidayPreset;
    } else if (closurePreset === 'CUSTOM' && customClosureReason.trim()) {
      reason = customClosureReason.trim();
      reasonDv = customClosureReasonDhivehi.trim() || customClosureReason.trim();
    }

    if (onDeclareSchoolClosed) {
      onDeclareSchoolClosed(reason, reasonDv);
    }
    setShowClosureModal(false);
  };

  return (
    <div className="space-y-5">
      {mobileRollCallMode === 'rapid' ? (
        <RapidRollCallView
          students={rosterStudents}
          allStudents={students}
          recordsMap={recordsMap}
          counterpartMap={counterpartMap}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedGrade={selectedGrade}
          onSelectGrade={setSelectedGrade}
          sessionTimings={sessionTimings}
          isSchoolClosed={isSchoolClosed}
          isSessionSubmitted={isSessionSubmitted}
          isSuperAdmin={isSuperAdmin}
          onStatusChange={handleStatusChange}
          onArrivalTimeChange={handleArrivalTimeChange}
          onReasonChange={handleReasonChange}
          onBulkMarkPresent={handleBulkMarkPresentClicked}
          onOpenSmsDraftModal={onOpenSmsDraftModal}
          onSubmitSession={onSubmitSession}
          onSwitchToCards={() => handleSetRollCallMode('cards')}
        />
      ) : (
        <>
          {/* Universal Staff Attendance Marking Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-linear-to-r from-teal-50 via-emerald-50/60 to-cyan-50 border border-teal-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 uppercase tracking-wide">
                {isRTL ? 'ހާޒިރީ ފުރަނީ:' : 'Staff:'}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                {isRTL ? (currentUser?.fullNameDhivehi || currentUser?.fullName || 'ސްޓާފް') : (currentUser?.fullName || 'Staff Member')}
              </span>
              {currentUser?.staffId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-teal-800 border border-teal-200 shadow-2xs">
                  {currentUser.staffId}
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-teal-900 font-semibold bg-teal-100/70 px-1.5 sm:px-2 py-0.5 rounded-md">
                {currentUser?.designation || currentUser?.role || 'Staff'}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-teal-700 flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
              <span className="line-clamp-1 sm:line-clamp-none">
                {isRTL
                  ? 'ކޮންމެ ކްލާހެއްގެ ހާޒިރީ ފުރުމުގެ ހުއްދަ ލިބިފައިވޭ'
                  : 'Universal Access: Mark attendance for any class'}
              </span>
            </div>
          </div>
        </div>

        {/* Staff Switcher & Authenticated Login Action */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {currentUser?.email && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-teal-200 text-teal-800 text-[11px] font-mono shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{currentUser.email}</span>
            </div>
          )}
          {onOpenLoginView && (
            <button
              type="button"
              onClick={onOpenLoginView}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[38px] sm:min-h-0"
              title="Switch to another staff member with password authentication"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ސްޓާފް ބަދަލުކުރޭ' : 'Switch Staff'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Header: Filters, Dates, Sessions, and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          {/* Left Controls: Date & Session Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Date Picker with Quick Prev/Today/Next Navigation */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition active:scale-95 touch-manipulation"
                title={isRTL ? 'ކުރީ ދުވަސް' : 'Previous day'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 min-h-[44px] sm:min-h-0 flex-1">
                <CalendarIcon className="w-4 h-4 text-sky-700 shrink-0" />
                <input
                  id="attendance-date-picker"
                  type="date"
                  value={selectedDate}
                  max={maldivesToday}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer w-full"
                />
                {selectedDate > maldivesToday && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>{isRTL ? 'ކުރި' : 'Future'}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={selectedDate >= maldivesToday}
                className={`p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition touch-manipulation ${
                  selectedDate >= maldivesToday
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-slate-100 active:bg-slate-200 cursor-pointer active:scale-95'
                }`}
                title={
                  selectedDate >= maldivesToday
                    ? (isRTL ? 'ކުރިއަށް އޮތް ދުވަސްތަކަށް ނުދެވޭނެ' : 'Cannot advance to future dates')
                    : (isRTL ? 'އަނެއް ދުވަސް' : 'Next day')
                }
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {selectedDate !== maldivesToday && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-900 border border-teal-200 text-xs font-bold transition cursor-pointer min-h-[44px] sm:min-h-0 shrink-0"
                >
                  {t.today}
                </button>
              )}
            </div>

            {/* High-Visibility Session Type Selector */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-semibold">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 hidden lg:inline">
                {t.sessionLabel}:
              </span>
              <button
                id="session-morning-btn"
                type="button"
                onClick={() => setSelectedSession('MORNING_BEFORE_BREAK')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg transition cursor-pointer font-bold min-h-[44px] sm:min-h-0 ${
                  selectedSession === 'MORNING_BEFORE_BREAK'
                    ? 'bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50/70 border border-slate-200'
                }`}
                title={!morningEligibility.allowed ? morningEligibility.message : undefined}
              >
                <Sunrise
                  className={`w-4 h-4 shrink-0 ${
                    selectedSession === 'MORNING_BEFORE_BREAK' ? 'text-amber-100' : 'text-amber-600'
                  }`}
                />
                <span>{t.morningSessionShort}</span>
                {!morningEligibility.allowed && (
                  <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold ${
                    selectedSession === 'MORNING_BEFORE_BREAK' ? 'bg-amber-900/30 text-amber-100' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold hidden sm:inline ${
                    selectedSession === 'MORNING_BEFORE_BREAK'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {effectiveTimings.morning.startTime}-{effectiveTimings.morning.endTime}
                </span>
              </button>
              <button
                id="session-afternoon-btn"
                type="button"
                onClick={() => setSelectedSession('POST_BREAK')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg transition cursor-pointer font-bold min-h-[44px] sm:min-h-0 ${
                  selectedSession === 'POST_BREAK'
                    ? 'bg-linear-to-r from-teal-600 to-emerald-600 text-white shadow-sm ring-2 ring-teal-400/40'
                    : 'bg-white text-slate-700 hover:text-teal-800 hover:bg-teal-50/70 border border-slate-200'
                }`}
                title={!afternoonEligibility.allowed ? afternoonEligibility.message : undefined}
              >
                <Sunset
                  className={`w-4 h-4 shrink-0 ${
                    selectedSession === 'POST_BREAK' ? 'text-teal-100' : 'text-teal-600'
                  }`}
                />
                <span>{t.postBreakSessionShort}</span>
                {!afternoonEligibility.allowed && (
                  <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold ${
                    selectedSession === 'POST_BREAK' ? 'bg-teal-900/30 text-teal-100' : 'bg-teal-100 text-teal-800'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold hidden sm:inline ${
                    selectedSession === 'POST_BREAK'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {effectiveTimings.afternoon.startTime}-{effectiveTimings.afternoon.endTime}
                </span>
              </button>

              {/* Configure Session Timings Button */}
              <button
                id="configure-session-timings-btn"
                type="button"
                onClick={() => setShowTimingsModal(true)}
                className={`flex items-center justify-center gap-1.5 p-1.5 px-2.5 rounded-lg transition cursor-pointer shadow-2xs font-bold text-xs ${
                  effectiveTimings.isTemporary
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-900 border border-slate-200'
                }`}
                title={
                  effectiveTimings.isTemporary
                    ? `Temporary schedule active: ${effectiveTimings.override?.reason || 'Special hours'}`
                    : (isRTL ? 'ސެޝަން ވަގުތުތައް ބަދަލުކުރުން' : 'Configure Session Timings & Duration')
                }
              >
                <Settings className={`w-3.5 h-3.5 ${effectiveTimings.isTemporary ? 'text-white' : 'text-slate-500 hover:text-sky-700'}`} />
                <span className="hidden sm:inline">
                  {effectiveTimings.isTemporary
                    ? (isRTL ? 'ވަގުތީ ވަގުތު' : 'Temporary')
                    : (isRTL ? 'ވަގުތު' : 'Timings')}
                </span>
                {effectiveTimings.isTemporary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </button>
            </div>
          </div>

          {/* Right Action Buttons: Voice Input, Mark All Present, Closure Trigger, Submit */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-2.5">
            {/* Quick School Closure Button */}
            {!isSchoolClosed && onDeclareSchoolClosed && (
              <button
                id="declare-closure-btn"
                type="button"
                onClick={() => setShowClosureModal(true)}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer min-h-[44px] sm:min-h-0"
                title={t.declareSchoolClosed}
              >
                <CloudRain className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t.schoolClosed}</span>
              </button>
            )}

            {/* AI Voice Dictation */}
            <button
              id="voice-dictate-btn"
              type="button"
              onClick={handleVoiceModalClicked}
              disabled={isSchoolClosed || !sessionEligibility.allowed}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs min-h-[44px] sm:min-h-0 ${
                isSchoolClosed || !sessionEligibility.allowed
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-50 cursor-not-allowed'
                  : 'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 cursor-pointer'
              }`}
              title={!sessionEligibility.allowed ? sessionEligibility.message : undefined}
            >
              <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{t.voiceInputButton}</span>
              <Sparkles className="w-3 h-3 text-indigo-500 hidden sm:inline" />
            </button>

            {/* Bulk Mark All Present */}
            <button
              id="bulk-mark-present-btn"
              type="button"
              onClick={handleBulkMarkPresentClicked}
              disabled={isSchoolClosed || !sessionEligibility.allowed}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs min-h-[44px] sm:min-h-0 ${
                isSchoolClosed || !sessionEligibility.allowed
                  ? 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer'
              }`}
              title={!sessionEligibility.allowed ? sessionEligibility.message : undefined}
            >
              <CheckCheck className="w-4 h-4 shrink-0" />
              <span>{t.markAllPresent}</span>
            </button>

            {/* Submit & Finalize Session */}
            {onSubmitSession && !isSchoolClosed && (
              <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                <button
                  id="submit-session-btn"
                  type="button"
                  onClick={
                    !sessionEligibility.allowed
                      ? () => setShowEligibilityNoticeModal(true)
                      : isSessionSubmitted
                      ? undefined
                      : onSubmitSession
                  }
                  disabled={isSessionSubmitted || !sessionEligibility.allowed}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs min-h-[44px] sm:min-h-0 ${
                    !sessionEligibility.allowed
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                      : isSessionSubmitted
                      ? 'bg-sky-50 text-sky-800 border border-sky-300 cursor-default'
                      : 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white cursor-pointer'
                  }`}
                  title={!sessionEligibility.allowed ? sessionEligibility.message : undefined}
                >
                  {isSessionSubmitted ? (
                    <>
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{t.sessionFinalized}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.submitSession}</span>
                    </>
                  )}
                </button>

                {isSessionSubmitted && isSuperAdmin && onRevertSession && (
                  <button
                    id="revert-session-header-btn"
                    type="button"
                    onClick={() =>
                      setRevertModalState({
                        isOpen: true,
                        mode: 'SESSION',
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition shadow-xs cursor-pointer min-h-[44px] sm:min-h-0 shrink-0"
                    title={t.revertSessionDesc}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{t.revertSession}</span>
                    <span className="sm:hidden">{isRTL ? 'ހުޅުވާ' : 'Unlock'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 1. School Closed Auto-Marked Notice & Manual Mark Disabled Banner */}
        {isSchoolClosed && (
          <div
            id="school-closed-banner"
            className="mt-4 p-4 sm:p-5 rounded-2xl bg-linear-to-r from-rose-50 via-red-50/70 to-amber-50 border-2 border-rose-300 text-rose-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-rose-200/90 text-rose-900 px-2.5 py-0.5 rounded-full border border-rose-300">
                    {t.schoolClosed} • {t.manualMarkDisabled}
                  </span>
                  <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-rose-200">
                    {records.length} / {students.length} {isRTL ? 'އޮޓޮމެޓިކުން ފުރިހަމަކުރެވިފައި' : 'Students Auto-Marked'}
                  </span>
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                    {isRTL ? '1 ދުވަސް އުނިކުރެވިފައި (ޣައިރުޙާޟިރެއް ނޫން)' : '1 Day Deducted from Total Days Need to Present (Not Absent)'}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-rose-900 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{isRTL ? formattedClosureLabelDhivehi : formattedClosureLabel}</span>
                  {(isRTL ? holidayNameOnly : holidayNameOnlyDhivehi) && (
                    <span className="text-xs font-semibold text-rose-700/80 bg-rose-100/60 px-2 py-0.5 rounded-md border border-rose-200">
                      {isRTL ? formattedClosureLabel : formattedClosureLabelDhivehi}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed max-w-2xl">
                  {isRTL
                    ? `މި ދުވަހަކީ ސްކޫލް ބަންދު ދުވަހެކެވެ (${holidayNameOnlyDhivehi || 'ރަސްމީ ބަންދު'}). ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ ރެކޯޑްކުރެވިފައިވަނީ "${formattedClosureLabelDhivehi}" (School Closed - Excused) ގޮތުގައެވެ (ޣައިރުޙާޟިރެއް ނޫން). އަދި މި ދުވަސް ވަނީ ދަރިވަރުން ހާޒިރުވާންޖެހޭ ޖުމްލަ ދުވަސްތަކުން އުނިކުރެވިފައެވެ.`
                    : `School is closed for this day (${holidayNameOnly || 'Official Holiday'}). Attendance for all students is automatically marked as "${formattedClosureLabel}" (EXCUSED, not Absent). This day is officially deducted from the total days students need to present.`}
                </p>
              </div>
            </div>

            {handleReopen && (
              <button
                id="reopen-school-btn"
                type="button"
                onClick={handleReopen}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border-2 border-rose-300 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span>{t.reopenSchool}</span>
              </button>
            )}
          </div>
        )}

        {/* 2. Timing / Future Date Lock Banner */}
        {!isSchoolClosed && !sessionEligibility.allowed && (
          <div
            id="session-time-lock-banner"
            className={`mt-4 p-4 sm:p-5 rounded-2xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              sessionEligibility.reason === 'FUTURE_DATE'
                ? 'bg-linear-to-r from-amber-50 via-orange-50/80 to-amber-100/50 border-amber-300 text-amber-950'
                : 'bg-linear-to-r from-sky-50 via-indigo-50/70 to-blue-50 border-sky-300 text-sky-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  sessionEligibility.reason === 'FUTURE_DATE'
                    ? 'bg-amber-600 text-white'
                    : 'bg-sky-600 text-white'
                }`}
              >
                {sessionEligibility.reason === 'FUTURE_DATE' ? (
                  <CalendarIcon className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
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
                    {selectedDate} ({selectedSession === 'MORNING_BEFORE_BREAK' ? (isRTL ? 'ހެނދުނުގެ ސެޝަން' : 'Morning Session') : (isRTL ? 'މެންދުރުފަހުގެ ސެޝަން' : 'Afternoon Session')})
                  </span>
                  <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    {isRTL ? `މިހާރުގެ ވަގުތު: ${sessionEligibility.currentTime}` : `Maldives Time: ${sessionEligibility.currentTime}`}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold mt-1">
                  {sessionEligibility.reason === 'FUTURE_DATE'
                    ? (isRTL
                        ? `ކުރިއަށް އޮތް ތާރީޚަކަށް (${selectedDate}) ހާޒިރީއެއް ނުޖެހޭނެއެވެ`
                        : `Cannot mark attendance before date arrives (${selectedDate})`)
                    : (isRTL
                        ? `${selectedSession === 'MORNING_BEFORE_BREAK' ? 'ހެނދުނުގެ ސެޝަން' : 'މެންދުރުފަހުގެ ސެޝަން'} އަދި ނުފެށެއެވެ (${sessionEligibility.startTime})`
                        : `${selectedSession === 'MORNING_BEFORE_BREAK' ? 'Morning' : 'Afternoon'} session roll call only opens after start time (${sessionEligibility.startTime})`)}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed max-w-2xl opacity-90">
                  {isRTL ? sessionEligibility.messageDhivehi : sessionEligibility.message}
                </p>
              </div>
            </div>

            {sessionEligibility.reason === 'FUTURE_DATE' && selectedDate !== sessionEligibility.currentDate && (
              <button
                type="button"
                onClick={handleToday}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <CalendarIcon className="w-4 h-4 text-amber-700" />
                <span>{isRTL ? `މިއަދަށް ދިއުމަށް (${sessionEligibility.currentDate})` : `Go to Today (${sessionEligibility.currentDate})`}</span>
              </button>
            )}
          </div>
        )}



        {/* Session Finalized & Revert Notice Banner */}
        {!isSchoolClosed && isSessionSubmitted && (
          <div
            id="session-locked-revert-banner"
            className={`mt-4 p-4 sm:p-5 rounded-2xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isSuperAdmin
                ? 'bg-linear-to-r from-amber-50 via-amber-50/80 to-orange-50 border-amber-300 text-amber-950'
                : 'bg-linear-to-r from-sky-50 via-slate-50 to-blue-50 border-sky-200 text-slate-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isSuperAdmin ? 'bg-amber-600 text-white' : 'bg-sky-600 text-white'
                }`}
              >
                {isSuperAdmin ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? 'bg-amber-200 text-amber-900 border-amber-300'
                        : 'bg-sky-100 text-sky-900 border-sky-200'
                    }`}
                  >
                    {t.sessionFinalized} • {isSuperAdmin ? t.revertFeatureSuperAdminOnly : t.attendanceLocked}
                  </span>
                  <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedDate} ({selectedSession === 'MORNING_BEFORE_BREAK' ? (isRTL ? 'ހެނދުނު ދަންފަޅި' : 'Morning Session') : (isRTL ? 'މެންދުރުފަސް ދަންފަޅި' : 'Afternoon Session')})
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold mt-1">
                  {isSuperAdmin
                    ? (isRTL ? 'ސުޕަރ އެޑްމިން އިޞްލާޙުކުރުމުގެ ބާރު: ހާޒިރީ ރަނގަޅުކުރުން ނުވަތަ ދަންފަޅި ހުޅުވާލުން' : 'Super Admin Correction Mode: Correct Records or Reopen Session')
                    : (isRTL ? 'މި ދަންފަޅީގެ ހާޒިރީ ވަނީ ފައިނަލައިޒްކޮށް ތަޅުލެވިފައެވެ' : 'This Attendance Session is Finalized and Locked')}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed max-w-2xl opacity-90">
                  {isSuperAdmin
                    ? (isRTL
                        ? 'މުދައްރިސަކަށް އޮޅިގެން ހާޒިރީ މާކްކުރެވިފައިވާނަމަ (މިސާލަކަށް: ޙާޟިރުވި ކުއްޖެއް ޣައިރުޙާޟިރުކޮށް)، ކޮންމެ ދަރިވަރެއްގެ ކާޑުގައިވާ "އިޞްލާޙުކުރޭ" އަށް ފިއްތާލައިގެން ބަދަލުކުރެވޭނެއެވެ. ނުވަތަ މުޅި ދަންފަޅި އެއްކޮށް ހުޅުވާލެވޭނެއެވެ.'
                        : 'If a teacher marked attendance incorrectly (e.g. marked a present student as absent), you can correct individual students directly or unlock the entire session for re-entry.')
                    : (isRTL
                        ? 'މުދައްރިސަކަށް އޮޅިގެން ހާޒިރީ މާކްކުރެވިފައިވާނަމަ، އިޞްލާޙުކުރުމަށް އެދި ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަށް ދަންނަވާށެވެ.'
                        : 'If attendance was marked incorrectly by a teacher, only the Super Admin (Ahmed Mujthaba) has authorization to revert and correct attendance records.')}
                </p>
              </div>
            </div>

            {isSuperAdmin && onRevertSession && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setRevertModalState({
                      isOpen: true,
                      mode: 'SESSION',
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <LockOpen className="w-4 h-4 text-amber-100" />
                  <span>{t.revertSession}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Warning if Maldives Weekend (Friday/Saturday) */}
        {isWeekend && (
          <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {isRTL
                ? 'ހުކުރު އަދި ހޮނިހިރު ދުވަހަކީ ރަސްމީ ބަންދު ދުވަހެކެވެ. އިތުރު ޙަރަކާތެއް ނުވަތަ ޚާއްޞަ ކްލާހެއް ނެތްނަމަ ހާޒިރީ ފުރުން ބޭނުމެއް ނުވާނެއެވެ.'
                : 'Selected date is a Maldivian Weekend (Friday / Saturday). Regular school classes are not scheduled unless special activity classes are ongoing.'}
            </span>
          </div>
        )}

        {/* Grade Filter Pill Tabs & Search Filter */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col gap-3">
          {/* Section Header & Student Quick Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                <span>{isRTL ? 'ގްރޭޑް / ކްލާސް ޚިޔާރުކުރައްވާ:' : 'Select Grade Class:'}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {selectedGrade === 'ALL'
                  ? (isRTL ? `ހުރިހާ ގްރޭޑެއް (${students.length} ދަރިވަރުން)` : `All 12 Classes (${students.length} Students)`)
                  : `${selectedGrade} (${rosterStudents.length} ${isRTL ? 'ދަރިވަރުން' : 'Students'})`}
              </span>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="student-search-input"
                type="text"
                placeholder={isRTL ? 'ނަން ނުވަތަ އެޑްމިޝަން ނަންބަރު...' : 'Search student or FMS-xxx...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition min-h-[38px] sm:min-h-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Grade Pills - horizontal scroll on mobile so it stays on 1 clean row */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
            {gradesList.map((g) => {
              const isAssigned = currentUser?.assignedGrade === g;
              const countForGrade = g === 'ALL' ? students.length : students.filter((s) => s.gradeLevel === g).length;
              return (
                <button
                  key={g}
                  type="button"
                  id={`grade-pill-${g.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[38px] sm:min-h-0 flex items-center gap-1.5 shadow-2xs shrink-0 ${
                    selectedGrade === g
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/30'
                      : 'bg-white text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 hover:border-slate-300'
                  } ${isAssigned ? 'ring-2 ring-teal-500/80' : ''}`}
                >
                  <span>{g === 'ALL' ? (isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Grades') : g}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      selectedGrade === g ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {countForGrade}
                  </span>
                  {isAssigned && (
                    <span className="text-[10px] text-teal-400 font-extrabold" title={isRTL ? 'އަޅުގަނޑުގެ ކްލާސް' : 'My Class'}>★</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Roll Call Mode Switcher: Roster List vs Rapid One-by-One Roll Call */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                id="mode-roster-list-btn"
                onClick={() => handleSetRollCallMode('cards')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[38px] sm:min-h-0 ${
                  mobileRollCallMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-teal-700" />
                <span>{t.rosterView}</span>
              </button>

              <button
                type="button"
                id="mode-rapid-rollcall-btn"
                onClick={() => handleSetRollCallMode('rapid')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer min-h-[38px] sm:min-h-0 ${
                  mobileRollCallMode === 'rapid'
                    ? 'bg-linear-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{t.rapidRollCall}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black">
                  FAST
                </span>
              </button>
            </div>

            {/* Quick Action: Mark Remaining as Present */}
            {mobileRollCallMode === 'cards' && !isSchoolClosed && (
              <button
                type="button"
                onClick={() => handleBulkMarkPresentClicked(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold transition cursor-pointer ml-auto"
                title={t.markRemainingPresentDesc}
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.markRemainingPresent}</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Live Counter Badges & Status Filter Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer min-h-[30px] flex items-center ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isRTL ? `ހުރިހާ: ${currentCounters.total}` : `All: ${currentCounters.total}`}
          </button>

          <span className="text-slate-300 hidden sm:inline">•</span>

          {isSchoolClosed ? (
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-extrabold border border-rose-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>
                {isRTL
                  ? `${formattedClosureLabelDhivehi}: ${currentCounters.total}/${currentCounters.total} ދަރިވަރުން އޮޓޮމެޓިކުން ފުރިހަމަކުރެވިފައި (100% ހާޒިރީ)`
                  : `${formattedClosureLabel}: ${currentCounters.total}/${currentCounters.total} Auto-Marked (100% Rate)`}
              </span>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'PRESENT' ? 'ALL' : 'PRESENT')}
                className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer border min-h-[30px] flex items-center ${
                  statusFilter === 'PRESENT'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {t.present}: {currentCounters.present}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'LATE' ? 'ALL' : 'LATE')}
                className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer border min-h-[30px] flex items-center ${
                  statusFilter === 'LATE'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {t.late}: {currentCounters.late}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'LEAVE' ? 'ALL' : 'LEAVE')}
                className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer border min-h-[30px] flex items-center ${
                  statusFilter === 'LEAVE'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {t.leave}: {currentCounters.leave}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'ABSENT' ? 'ALL' : 'ABSENT')}
                className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer border min-h-[30px] flex items-center ${
                  statusFilter === 'ABSENT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {t.absent}: {currentCounters.absent}
              </button>
              {currentCounters.unmarked > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'UNMARKED' ? 'ALL' : 'UNMARKED')}
                  className={`px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-bold transition cursor-pointer border min-h-[30px] flex items-center ${
                    statusFilter === 'UNMARKED'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isRTL ? 'ފުރިހަމަނުކުރާ' : 'Unmarked'}: {currentCounters.unmarked}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Student List Matrix Cards */}
      <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-medium text-sm">
                {isRTL ? 'އެއްވެސް ދަރިވަރަކު ނުފެނުނު' : 'No students match your criteria.'}
              </p>
            </div>
          ) : (
          filteredStudents.map((student, index) => {
            const rec = recordsMap.get(student.id);
            const counterpartRec = counterpartMap.get(student.id);
            const isClosed = isSchoolClosed || rec?.status === 'SCHOOL_CLOSED';
            const isMarked = Boolean(rec && rec.status);
            const status = isClosed ? 'SCHOOL_CLOSED' : rec?.status;
            const leaveReason = isClosed ? 'OFFICIAL_DUTY' : (rec?.leaveReason || 'NONE');
            const isLate = !isClosed && status === 'LATE';
            const isLeave = !isClosed && status === 'LEAVE';
            const isAbsent = !isClosed && status === 'ABSENT';
            const isPresent = !isClosed && status === 'PRESENT';

            const isMorning = selectedSession === 'MORNING_BEFORE_BREAK';
            const counterpartStatus = isClosed ? 'SCHOOL_CLOSED' : counterpartRec?.status;

            // In Afternoon view: Did student leave at morning break? (only if morning was explicitly marked)
            const isLeftAtBreak =
              !isClosed &&
              !isMorning &&
              Boolean(counterpartRec) &&
              counterpartStatus === 'PRESENT' &&
              (status === 'ABSENT' || status === 'LEAVE');

            // In Afternoon view: Did student arrive after morning break? (only if morning was explicitly marked)
            const isArrivedAfterBreak =
              !isClosed &&
              !isMorning &&
              Boolean(counterpartRec) &&
              (counterpartStatus === 'ABSENT' || counterpartStatus === 'LEAVE') &&
              (status === 'PRESENT' || status === 'LATE');

            return (
              <div
                key={student.id}
                id={`student-row-${student.id}`}
                className={`p-4 rounded-xl border bg-white shadow-xs transition-all hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isAbsent
                    ? 'border-rose-200 bg-rose-50/20'
                    : isLeave
                    ? 'border-indigo-200 bg-indigo-50/20'
                    : isLate
                    ? 'border-amber-200 bg-amber-50/20'
                    : isPresent
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isMorning
                    ? 'border-slate-200 hover:border-amber-200'
                    : 'border-slate-200 hover:border-teal-200'
                }`}
              >
                {/* Student Info: Avatar, Name, Admission No, Grade */}
                <div className="flex items-start sm:items-center gap-3 min-w-[280px]">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                      student.gender === 'MALE'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {student.admissionNumber.slice(4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-slate-900 text-sm ${isRTL ? 'font-thaana text-right' : ''}`}>
                        {isRTL ? (student.fullNameDhivehi || student.fullName) : student.fullName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {student.admissionNumber}
                      </span>
                      {onEditStudent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditStudent(student);
                          }}
                          className="text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-slate-100 transition-colors"
                          title={isRTL ? 'ދަރިވަރުގެ ނަން އިޞްލާޙު ކުރޭ' : 'Edit student details'}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2 mt-0.5">
                      <bdi
                        dir={isRTL ? 'ltr' : 'rtl'}
                        className={isRTL ? 'text-slate-600 font-medium' : 'font-thaana text-slate-700 font-medium'}
                      >
                        {isRTL ? student.fullName : (student.fullNameDhivehi || student.fullName)}
                      </bdi>
                      <span>•</span>
                      <span className="font-semibold text-teal-800">{student.gradeLevel}</span>
                    </div>

                    {/* Dual-Session Identification Pill */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {/* Active Session Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          isMorning
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-teal-50 text-teal-900 border-teal-200'
                        }`}
                      >
                        {isMorning ? (
                          <Sunrise className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Sunset className="w-3 h-3 text-teal-600" />
                        )}
                        <span>{isMorning ? t.morningSessionShort : t.postBreakSessionShort}</span>
                        <span className="opacity-75 font-normal">
                          ({isMorning ? `${effectiveTimings.morning.startTime}-${effectiveTimings.morning.endTime}` : `${effectiveTimings.afternoon.startTime}-${effectiveTimings.afternoon.endTime}`})
                        </span>
                      </span>

                      {/* Unmarked Badge if not yet marked */}
                      {!isMarked && !isClosed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{isRTL ? 'ފުރިހަމަނުކުރާ' : 'Unmarked'}</span>
                        </span>
                      )}

                      {/* Counterpart Session Status Peek */}
                      {counterpartRec && counterpartRec.status && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${
                            counterpartStatus === 'SCHOOL_CLOSED' || isClosed
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                          title={
                            counterpartStatus === 'SCHOOL_CLOSED' || isClosed
                              ? 'School Closed - Excused (Not Absent)'
                              : isMorning
                              ? 'Afternoon Roll Call Status'
                              : 'Morning Roll Call Status'
                          }
                        >
                          <span className="text-slate-500 font-medium">
                            {isMorning ? `${t.postBreakSessionShort}:` : `${t.morningSessionShort}:`}
                          </span>
                          <span
                            className={`font-extrabold ${
                              counterpartStatus === 'SCHOOL_CLOSED' || isClosed
                                ? 'text-rose-700'
                                : counterpartStatus === 'PRESENT'
                                ? 'text-emerald-700'
                                : counterpartStatus === 'LATE'
                                ? 'text-amber-700'
                                : counterpartStatus === 'LEAVE'
                                ? 'text-indigo-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {counterpartStatus === 'SCHOOL_CLOSED' || isClosed
                              ? (isRTL ? 'ސްކޫލް ބަންދު' : 'School Closed')
                              : counterpartStatus === 'PRESENT'
                              ? t.present
                              : counterpartStatus === 'LATE'
                              ? t.late
                              : counterpartStatus === 'LEAVE'
                              ? t.leave
                              : t.absent}
                          </span>
                          {(counterpartStatus === 'SCHOOL_CLOSED' || isClosed) && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-200/90 text-rose-800 font-black">
                              EXCUSED
                            </span>
                          )}
                        </span>
                      )}

                      {/* Island School Real-world Alerts */}
                      {isLeftAtBreak && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <span>⚠️</span>
                          <span>{t.postBreakDropAlert}</span>
                        </span>
                      )}
                      {isArrivedAfterBreak && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                          <span>ℹ️</span>
                          <span>{t.postBreakJoinAlert}</span>
                        </span>
                      )}

                      {/* Marked by Staff Attribution Badge */}
                      {rec && rec.markedByUserId && rec.markedByUserId !== 'SYSTEM_AUTO' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                          title={`Marked by ${
                            staffList?.find((s) => s.id === rec.markedByUserId || s.staffId === rec.markedByUserId)?.fullName ||
                            rec.markedByUserName ||
                            rec.markedByUserId
                          }`}
                        >
                          <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>
                            {isRTL ? 'ފުރީ:' : 'By:'}{' '}
                            {(() => {
                              const m = staffList?.find((s) => s.id === rec.markedByUserId || s.staffId === rec.markedByUserId);
                              if (m) {
                                return isRTL ? (m.fullNameDhivehi || m.fullName) : m.fullName;
                              }
                              return rec.markedByUserName || rec.markedByUserId;
                            })()}
                          </span>
                        </span>
                      )}

                      {/* Reverted by Super Admin Badge */}
                      {rec && (rec.revertedByUserId || rec.previousStatus) && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                          title={rec.revertReason ? `${rec.revertReason} (by ${rec.revertedByUserName || rec.revertedByUserId})` : 'Reverted by Super Admin'}
                        >
                          <RotateCcw className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>
                            {isRTL ? 'ސުޕަރ އެޑްމިން އިޞްލާޙުކުރި' : 'Reverted by Super Admin'}
                            {rec.previousStatus ? ` (${isRTL ? 'ކުރިން:' : 'was'} ${rec.previousStatus})` : ''}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons or School Closed Auto-Marked Pill */}
                {isClosed ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-linear-to-r from-rose-50 to-red-50/70 border border-rose-200 text-rose-950 text-xs font-bold shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-extrabold tracking-tight">
                        {isRTL ? formattedClosureLabelDhivehi : (rec?.remarks || formattedClosureLabel)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-800 font-black font-mono tracking-wider shrink-0">
                        EXCUSED
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-700/90 font-medium sm:border-l sm:border-rose-200 sm:pl-2 sm:ml-1">
                      {isRTL ? '1 ދުވަސް އުނިކުރެވިފައި • ޣައިރުޙާޟިރެއް ނޫން' : '1 Day Deducted • Not Absent'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
                      {/* Present */}
                      <button
                        type="button"
                        disabled={isSchoolClosed || !isMarkingAllowed}
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        className={`flex items-center justify-center gap-1 px-2 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] md:min-h-[38px] active:scale-95 touch-manipulation ${
                          isSchoolClosed || !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed && !sessionEligibility.allowed ? sessionEligibility.message : undefined}
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{t.present}</span>
                      </button>

                      {/* Late */}
                      <button
                        type="button"
                        disabled={isSchoolClosed || !isMarkingAllowed}
                        onClick={() => handleStatusChange(student.id, 'LATE')}
                        className={`flex items-center justify-center gap-1 px-2 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] md:min-h-[38px] active:scale-95 touch-manipulation ${
                          isSchoolClosed || !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          status === 'LATE'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed && !sessionEligibility.allowed ? sessionEligibility.message : undefined}
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{t.late}</span>
                      </button>

                      {/* Leave */}
                      <button
                        type="button"
                        disabled={isSchoolClosed || !isMarkingAllowed}
                        onClick={() => handleStatusChange(student.id, 'LEAVE')}
                        className={`flex items-center justify-center gap-1 px-2 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] md:min-h-[38px] active:scale-95 touch-manipulation ${
                          isSchoolClosed || !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          status === 'LEAVE'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed && !sessionEligibility.allowed ? sessionEligibility.message : undefined}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{t.leave}</span>
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        disabled={isSchoolClosed || !isMarkingAllowed}
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        className={`flex items-center justify-center gap-1 px-2 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] md:min-h-[38px] active:scale-95 touch-manipulation ${
                          isSchoolClosed || !isMarkingAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-slate-200'
                        }`}
                        title={!isMarkingAllowed && !sessionEligibility.allowed ? sessionEligibility.message : undefined}
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>{t.absent}</span>
                      </button>
                    </div>

                    {/* Sub-Context Controls for Late, Leave, and Absent */}
                    {(isLate || isLeave || isAbsent) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        {isLate && (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg w-full sm:w-auto">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[11px] font-bold text-amber-900 shrink-0">
                              {isRTL ? 'އައި ގަޑި:' : 'Arrived:'}
                            </span>
                            <input
                              type="time"
                              value={rec?.arrivalTime || (isMorning ? '08:15' : '11:00')}
                              onChange={(e) => handleArrivalTimeChange(student.id, e.target.value)}
                              className="bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs text-amber-900 font-bold focus:outline-none min-h-[32px]"
                            />
                            <div className="flex items-center gap-1 ml-auto">
                              {(isMorning ? ['08:00', '08:15', '08:30'] : ['11:00', '11:15', '11:30']).map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => handleArrivalTimeChange(student.id, time)}
                                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-800 border border-amber-200"
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {isLeave && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={leaveReason}
                              onChange={(e) => handleReasonChange(student.id, e.target.value as LeaveReason)}
                              className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto min-h-[36px]"
                            >
                              <option value="SICK_LEAVE">{t.sickLeave}</option>
                              <option value="SICK_LEAVE_MC">{t.sickLeaveMc}</option>
                              <option value="NOT_IN_ISLAND">{t.notInIsland}</option>
                              <option value="OFFICIAL_DUTY">{t.officialDuty}</option>
                              <option value="OTHER">{t.otherReason}</option>
                            </select>
                          </div>
                        )}

                        {/* Direct Parent Notification Action for Absent or Late */}
                        {(isAbsent || isLate) && (
                          <button
                            type="button"
                            onClick={() => onOpenSmsDraftModal(student)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                              isAbsent
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 w-full sm:w-auto'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                            title={isRTL ? 'ބެލެނިވެރިޔާއަށް އެސްއެމްއެސް ފޮނުވުން' : 'Notify Parent via SMS / Call'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                            <span>{isRTL ? 'ބެލެނިވެރިޔާއަށް އެންގުން (SMS)' : 'Notify Parent (SMS)'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Super Admin Individual Revert Action (when session is locked) */}
                    {isSessionSubmitted && isSuperAdmin && onRevertRecord && (
                      <div className="flex items-center justify-end pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() =>
                            setRevertModalState({
                              isOpen: true,
                              mode: 'RECORD',
                              student,
                              currentRecord: rec,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer min-h-[36px] shadow-2xs"
                          title={t.revertAttendanceDesc}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{t.revertAttendance}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 2. Floating Mobile Action Dock (Quick Submit / Roster Summary) */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg flex items-center justify-between md:hidden">
        <div>
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <span>{selectedGrade === 'ALL' ? (isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Grades') : selectedGrade}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-semibold">{currentCounters.total} {isRTL ? 'ދަރިވަރުން' : 'Students'}</span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="text-emerald-700">{currentCounters.present} {t.present}</span>
            <span>•</span>
            <span className="text-amber-700">{currentCounters.late} {t.late}</span>
            <span>•</span>
            <span className="text-rose-700">{currentCounters.absent} {t.absent}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Mode Toggle in Floating Dock */}
          <button
            type="button"
            onClick={() => handleSetRollCallMode(mobileRollCallMode === 'rapid' ? 'cards' : 'rapid')}
            className={`px-2.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 min-h-[40px] shadow-2xs ${
              mobileRollCallMode === 'rapid'
                ? 'bg-slate-900 text-white'
                : 'bg-linear-to-r from-teal-600 to-emerald-600 text-white'
            }`}
          >
            {mobileRollCallMode === 'rapid' ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t.rosterView}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{t.rapidRollCall}</span>
              </>
            )}
          </button>

          {onSubmitSession && !isSchoolClosed && (
            <button
              type="button"
              onClick={
                !sessionEligibility.allowed
                  ? () => setShowEligibilityNoticeModal(true)
                  : isSessionSubmitted
                  ? undefined
                  : onSubmitSession
              }
              disabled={isSessionSubmitted || !sessionEligibility.allowed}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs min-h-[40px] ${
                !sessionEligibility.allowed
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                  : isSessionSubmitted
                  ? 'bg-sky-50 text-sky-800 border border-sky-300 cursor-default'
                  : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
              }`}
              title={!sessionEligibility.allowed ? sessionEligibility.message : undefined}
            >
              {isSessionSubmitted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t.sessionFinalized}</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>{t.submitSession}</span>
                </>
              )}
            </button>
          )}

          {isSessionSubmitted && isSuperAdmin && onRevertSession && !isSchoolClosed && (
            <button
              type="button"
              onClick={() =>
                setRevertModalState({
                  isOpen: true,
                  mode: 'SESSION',
                })
              }
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs cursor-pointer min-h-[40px]"
              title={t.revertSessionDesc}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.revertSession}</span>
            </button>
          )}
        </div>
      </div>
      </>
    )}

      {/* 3. Pending Attendance Warning Modal */}
      <PendingAttendanceWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        pendingSession={pendingPreviousSession}
        currentDate={selectedDate}
        currentSession={selectedSession}
        currentGrade={selectedGrade}
        onGoToPendingSession={(date, session, grade) => {
          if (onGoToPendingSession) {
            onGoToPendingSession(date, session, grade);
          } else {
            setSelectedDate(date);
            setSelectedSession(session);
            if (grade && grade !== 'ALL') setSelectedGrade(grade);
          }
          setShowWarningModal(false);
        }}
      />

      {/* 4. Declare School Closure Modal */}
      {showClosureModal && (
        <div
          id="school-closure-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <CloudRain className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {t.declareSchoolClosed}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRTL
                    ? `ތާރީޚް: ${selectedDate} • ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ އޮޓޮމެޓިކުން ފުރޭނެއެވެ.`
                    : `Date: ${selectedDate} • Attendance for all 215 students will be automatically marked as closed.`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {isRTL ? 'ބަންދުކުރި ސަބަބު ޚިޔާރުކުރައްވާ:' : 'Select Closure Reason:'}
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="closurePreset"
                    checked={closurePreset === 'WEATHER'}
                    onChange={() => setClosurePreset('WEATHER')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isRTL
                        ? 'މޫސުން ގޯސްވުން (ޔެލޯ އެލާޓް / ކަނޑުގަދަވުން / ވިއްސާރަ)'
                        : 'Severe Weather (Yellow Alert / Monsoon Storm / Swell Waves)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard island contingency closure
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="closurePreset"
                    checked={closurePreset === 'ISLAND_EVENT'}
                    onChange={() => setClosurePreset('ISLAND_EVENT')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isRTL
                        ? 'ރަށު ކައުންސިލް / ކޮމިއުނިޓީ ޚާއްޞަ އިވެންޓް'
                        : 'Local Island Council Event / Community Assembly'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="closurePreset"
                    checked={closurePreset === 'HOLIDAY'}
                    onChange={() => setClosurePreset('HOLIDAY')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isRTL
                        ? 'ސަރުކާރު ބަންދު / އެޑިޔުކޭޝަން މިނިސްޓްރީގެ އެންގުން (ރަސްމީ ޗުއްޓީ)'
                        : 'Official Public Holiday / Term Break (MoE)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      e.g. The Day Maldives Embraced Islam, Mid Term Break
                    </span>
                  </div>
                </label>

                {closurePreset === 'HOLIDAY' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 my-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {isRTL ? 'ރަސްމީ ބަންދު ނަން ޚިޔާރުކުރައްވާ:' : 'Select Maldivian Holiday / Break:'}
                    </label>
                    <select
                      value={selectedHolidayPreset}
                      onChange={(e) => setSelectedHolidayPreset(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                    >
                      {MALDIVIAN_HOLIDAY_PRESETS.map((h) => (
                        <option key={h.name} value={h.name}>
                          {h.name} ({h.nameDhivehi})
                        </option>
                      ))}
                    </select>
                    <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 text-xs">
                      <span className="text-slate-600 font-medium">Auto attendance remark will be:</span>
                      <div className="font-extrabold text-rose-900 text-xs mt-0.5 font-mono">
                        School Closed - {selectedHolidayPreset}
                      </div>
                      <div className="font-medium text-rose-800 text-[11px] mt-0.5" dir="rtl">
                        ސްކޫލް ބަންދު - {MALDIVIAN_HOLIDAY_PRESETS.find((h) => h.name === selectedHolidayPreset)?.nameDhivehi || selectedHolidayPreset}
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="closurePreset"
                    checked={closurePreset === 'CUSTOM'}
                    onChange={() => setClosurePreset('CUSTOM')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isRTL ? 'އެހެން ސަބަބެއް (އަމިއްލައަށް ލިޔާ)' : 'Other Reason (Custom Text)'}
                    </span>
                  </div>
                </label>
              </div>

              {closurePreset === 'CUSTOM' && (
                <div className="space-y-2 pt-2">
                  <input
                    type="text"
                    placeholder="Closure reason in English (e.g. Electrical Maintenance)..."
                    value={customClosureReason}
                    onChange={(e) => setCustomClosureReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="ސަބަބު ދިވެހިން..."
                    value={customClosureReasonDhivehi}
                    onChange={(e) => setCustomClosureReasonDhivehi(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isRTL
                  ? 'މި ދުވަހަށް ސްކޫލް ބަންދުކުރުމުން ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ އޮޓޮމެޓިކުން 100% ހާޒިރީ ރޭޓުގައި ރެކޯޑްކުރެވޭނެއެވެ. އަދި އަމިއްލައަށް ހާޒިރީ ބަދަލުކުރުން ބަންދުވާނެއެވެ.'
                  : 'Declaring closure will auto-mark attendance for all students as EXCUSED (100% rate) and disable manual attendance entry for this date.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClosureModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmClosure}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                {isRTL ? 'ސްކޫލް ބަންދުކުރޭ (ހާޒިރީ އޮޓޮމެޓިކުން ފުރާ)' : 'Declare Closed & Auto-Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Locked Session Notice Modal */}
      {showLockedNoticeModal && (
        <div
          id="teacher-locked-notice-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLockedNoticeModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {t.attendanceLocked}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDate} • {selectedSession === 'MORNING_BEFORE_BREAK' ? (isRTL ? 'ހެނދުނު ދަންފަޅި' : 'Morning Session') : (isRTL ? 'މެންދުރުފަސް ދަންފަޅި' : 'Afternoon Session')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-2">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{t.sessionFinalizedDesc}</span>
              </p>
              <p>
                {isRTL
                  ? 'މުދައްރިސަކަށް އޮޅިގެން ހާޒިރީ މާކްކުރެވިފައިވާނަމަ (މިސާލަކަށް: ޙާޟިރުވި ކުއްޖެއް ޣައިރުޙާޟިރުކޮށް)، އިޞްލާޙުކުރުމުގެ ބާރު ލިބިގެންވަނީ ހަމައެކަނި ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަށެވެ.'
                  : 'If attendance was marked incorrectly (such as marking a present student as absent), only the Super Admin (Ahmed Mujthaba) can revert or unlock finalized records.'}
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-[11px] font-mono font-bold">
                Super Admin: Ahmed Mujthaba<br />
                Email: ahmed.mujthaba@fmagoodhooschool.edu.mv
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowLockedNoticeModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition cursor-pointer"
              >
                {isRTL ? 'ރަނގަޅު' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Timing / Future Date Eligibility Modal */}
      {showEligibilityNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`p-5 text-white ${
              sessionEligibility.reason === 'FUTURE_DATE'
                ? 'bg-linear-to-r from-amber-600 to-orange-600'
                : 'bg-linear-to-r from-sky-600 to-indigo-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">
                      {sessionEligibility.reason === 'FUTURE_DATE'
                        ? (isRTL ? 'ކުރިއަށް އޮތް ތާރީޚަކަށް ހާޒިރީ ނުޖެހޭނެ' : 'Future Date Locked')
                        : (isRTL ? 'ސެޝަން ފެށުމުގެ ކުރިން ހާޒިރީ ނުޖެހޭނެ' : 'Session Not Started')}
                    </h3>
                    <p className="text-xs text-white/80 mt-0.5">
                      {isRTL ? 'ފ. މަގޫދޫ ސްކޫލް ހާޒިރީ ނިޒާމު' : 'F. Magoodhoo School Attendance System'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEligibilityNoticeModal(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>{isRTL ? 'ތާރީޚް:' : 'Target Date:'}</span>
                  <span className="font-bold text-slate-900">{selectedDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>{isRTL ? 'މިއަދުގެ ތާރީޚް:' : 'Current Date:'}</span>
                  <span className="font-bold text-slate-900">{sessionEligibility.currentDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>{isRTL ? 'މިހާރުގެ ވަގުތު:' : 'Current Time:'}</span>
                  <span className="font-bold text-slate-900 font-mono">{sessionEligibility.currentTime}</span>
                </div>
                {sessionEligibility.startTime && (
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>{isRTL ? 'ސެޝަން ފެށޭ ގަޑި:' : 'Session Starts At:'}</span>
                    <span className="font-bold text-sky-700 font-mono">{sessionEligibility.startTime}</span>
                  </div>
                )}
              </div>

              <p className="font-medium text-slate-800">
                {sessionEligibility.message}
              </p>
              <p className="font-medium text-slate-600 text-right dir-rtl leading-normal">
                {sessionEligibility.messageDhivehi}
              </p>

              <div className="pt-2 flex gap-2">
                {sessionEligibility.reason === 'FUTURE_DATE' && selectedDate !== sessionEligibility.currentDate && (
                  <button
                    type="button"
                    onClick={() => {
                      handleToday();
                      setShowEligibilityNoticeModal(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-center cursor-pointer transition shadow-xs"
                  >
                    {isRTL ? `މިއަދަށް ބަދަލުކުރޭ (${sessionEligibility.currentDate})` : `Switch to Today (${sessionEligibility.currentDate})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEligibilityNoticeModal(false)}
                  className={`py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer ${
                    sessionEligibility.reason === 'FUTURE_DATE' && selectedDate !== sessionEligibility.currentDate ? '' : 'w-full bg-sky-600 text-white hover:bg-sky-700 border-transparent'
                  }`}
                >
                  {isRTL ? 'ރަނގަޅު' : 'Understood'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Revert Modal */}
      <SuperAdminRevertModal
        isOpen={revertModalState.isOpen}
        onClose={() =>
          setRevertModalState({
            isOpen: false,
            mode: 'RECORD',
          })
        }
        mode={revertModalState.mode}
        student={revertModalState.student}
        currentRecord={revertModalState.currentRecord}
        date={selectedDate}
        sessionType={selectedSession}
        currentUser={currentUser}
        onConfirmRecordRevert={onRevertRecord}
        onConfirmSessionRevert={onRevertSession}
      />

      {/* Session Timings & Duration Settings Modal */}
      <SessionTimingsModal
        isOpen={showTimingsModal}
        onClose={() => setShowTimingsModal(false)}
        currentTimings={sessionTimings}
        selectedDate={selectedDate}
        onSave={onUpdateSessionTimings || (() => {})}
      />
    </div>
  );
};
