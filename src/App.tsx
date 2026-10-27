import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, RefreshCw, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { AttendanceMatrix } from './components/AttendanceMatrix';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ReportsModule } from './components/ReportsModule';
import { SubstitutionModal } from './components/SubstitutionModal';
import { AcademicCalendarModal } from './components/AcademicCalendarModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { AuditLogViewer } from './components/AuditLogViewer';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { VoiceDictationModal } from './components/VoiceDictationModal';
import { ParentSmsModal } from './components/ParentSmsModal';
import { MagoodhooSyncModal } from './components/MagoodhooSyncModal';
import { EditStudentModal } from './components/EditStudentModal';
import { MobileLoginView } from './components/MobileLoginView';
import { SuperAdminPasswordModal } from './components/SuperAdminPasswordModal';
import { StaffChangePasswordModal } from './components/StaffChangePasswordModal';
import { SessionTimingsModal } from './components/SessionTimingsModal';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { ExtraClassesModule } from './components/ExtraClassesModule';
import { syncEngine } from './lib/syncEngine';
import { offlineDb } from './lib/db';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { checkSessionMarkingEligibility, getMaldivesNow } from './utils/sessionTimingsHelper';
import { safeLocalStorage, safeJsonParse } from './utils/browserUtils';
import {
  DEFAULT_STAFF,
  DEFAULT_STUDENTS,
  DEFAULT_CALENDAR,
  hasStaffLocalCustomPassword,
  isUserSuperAdmin,
} from './data/fallbackData';
import {
  User,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  LeaveReason,
  AcademicCalendarDay,
  ClassDelegation,
  AuditLog,
  AttendanceStatsSummary,
  GradeLevel,
  SessionType,
  AcademicDayType,
  SchoolSessionTimings,
} from './types';

/**
 * Merges server and local attendance records without dropping local entries.
 * Even if serverRecords is empty (due to serverless cold start or network latency),
 * local offline or newly marked records are never wiped.
 */
/**
 * Persistent Master Attendance Registry helpers to ensure locally marked attendance
 * is NEVER lost across session switches, browser reloads, PWA launches, or serverless cold starts.
 */
const MASTER_ATTENDANCE_STORAGE_KEY = 'moe_attendance_master_records';

function getLocalMasterRecords(date: string, session: SessionType): AttendanceRecord[] {
  try {
    const raw = safeLocalStorage.getItem(MASTER_ATTENDANCE_STORAGE_KEY);
    if (!raw) return [];
    const master: Record<string, AttendanceRecord> = JSON.parse(raw);
    const result: AttendanceRecord[] = [];
    for (const key of Object.keys(master)) {
      const rec = master[key];
      if (rec && rec.date === date && rec.sessionType === session) {
        result.push(rec);
      }
    }
    return result;
  } catch {
    return [];
  }
}

function saveLocalMasterRecord(record: AttendanceRecord) {
  try {
    const raw = safeLocalStorage.getItem(MASTER_ATTENDANCE_STORAGE_KEY);
    const master: Record<string, AttendanceRecord> = raw ? JSON.parse(raw) : {};
    const key = `${record.studentId}_${record.date}_${record.sessionType}`;
    master[key] = record;
    safeLocalStorage.setItem(MASTER_ATTENDANCE_STORAGE_KEY, JSON.stringify(master));
  } catch {}
}

function saveLocalMasterRecordsBulk(records: AttendanceRecord[]) {
  try {
    const raw = safeLocalStorage.getItem(MASTER_ATTENDANCE_STORAGE_KEY);
    const master: Record<string, AttendanceRecord> = raw ? JSON.parse(raw) : {};
    for (const record of records) {
      const key = `${record.studentId}_${record.date}_${record.sessionType}`;
      master[key] = record;
    }
    safeLocalStorage.setItem(MASTER_ATTENDANCE_STORAGE_KEY, JSON.stringify(master));
  } catch {}
}

export function clearAllLocalAttendanceStores() {
  try {
    safeLocalStorage.removeItem(MASTER_ATTENDANCE_STORAGE_KEY);
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('moe_att_') || k === MASTER_ATTENDANCE_STORAGE_KEY)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        safeLocalStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.warn('Error clearing local attendance stores:', err);
  }
}

function mergeAttendanceRecords(
  serverRecords: AttendanceRecord[],
  localRecords: AttendanceRecord[]
): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();

  // 1. Populate from server
  for (const s of serverRecords) {
    if (s && s.studentId) {
      map.set(s.studentId, s);
    }
  }

  // 2. Overlay local records (never discard locally marked records)
  for (const l of localRecords) {
    if (!l || !l.studentId) continue;
    const existing = map.get(l.studentId);
    if (!existing) {
      // Local record exists but server does not have it -> Always keep local record!
      map.set(l.studentId, l);
    } else if (l.syncStatus === 'PENDING_OFFLINE') {
      map.set(l.studentId, l);
    } else {
      const lTime = l.updatedAt ? new Date(l.updatedAt).getTime() : 0;
      const sTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      // If local has an explicit status and server is unmarked or older/equal, keep local
      if (l.status && !existing.status) {
        map.set(l.studentId, l);
      } else if (lTime >= sTime) {
        map.set(l.studentId, l);
      } else if (l.status && l.status !== existing.status && lTime >= sTime - 10000) {
        // Guard against slight clock skew where server updatedAt was generated milliseconds ahead
        map.set(l.studentId, l);
      }
    }
  }

  return Array.from(map.values());
}

function MainApp() {
  const { t, isRTL } = useLanguage();

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('attendance');

  // Core Data State (initialized with complete bundled data for 100% offline & Vercel reliability)
  const [staffList, setStaffList] = useState<User[]>(DEFAULT_STAFF);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const isMobileOrPrivileged = typeof window !== 'undefined' && (
      window.innerWidth < 768 ||
      safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true' ||
      safeLocalStorage.getItem('moe_login_source') === 'mobile'
    );

    const savedUserJson = safeLocalStorage.getItem('moe_logged_in_user');
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        if (isMobileOrPrivileged) {
          parsed.hasRapidRollCallPrivilege = true;
          parsed.loginViaMobile = true;
        }
        return parsed;
      } catch {}
    }
    const savedId = safeLocalStorage.getItem('moe_active_user_id');
    if (savedId) {
      const found = DEFAULT_STAFF.find((s) => s.id === savedId);
      if (found) {
        return isMobileOrPrivileged
          ? { ...found, hasRapidRollCallPrivilege: true, loginViaMobile: true }
          : found;
      }
    }
    const def = DEFAULT_STAFF.find((s) => isUserSuperAdmin(s)) || DEFAULT_STAFF[0] || null;
    return def && isMobileOrPrivileged
      ? { ...def, hasRapidRollCallPrivilege: true, loginViaMobile: true }
      : def;
  });

  // Selection state with resilient local persistence
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('moe_selected_date');
      const today = getMaldivesNow().dateStr;
      return saved && saved <= today ? saved : today;
    } catch {
      return getMaldivesNow().dateStr;
    }
  });
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'ALL'>(() => {
    try {
      const saved = safeLocalStorage.getItem('moe_selected_grade');
      return (saved as GradeLevel | 'ALL') || 'Grade 10';
    } catch {
      return 'Grade 10';
    }
  });
  const [selectedSession, setSelectedSession] = useState<SessionType>(() => {
    try {
      const saved = safeLocalStorage.getItem('moe_selected_session');
      return (saved as SessionType) || 'MORNING_BEFORE_BREAK';
    } catch {
      return 'MORNING_BEFORE_BREAK';
    }
  });

  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const savedDate = safeLocalStorage.getItem('moe_selected_date') || getMaldivesNow().dateStr;
      const savedSession = (safeLocalStorage.getItem('moe_selected_session') as SessionType) || 'MORNING_BEFORE_BREAK';
      const storageKey = `moe_att_${savedDate}_${savedSession}`;
      const saved = safeLocalStorage.getJSON<AttendanceRecord[]>(storageKey, []);
      const masterList = getLocalMasterRecords(savedDate, savedSession);
      const combined = Array.isArray(saved) ? [...saved] : [];
      for (const m of masterList) {
        if (!combined.some((c) => c.studentId === m.studentId)) {
          combined.push(m);
        }
      }
      return combined;
    } catch {
      return [];
    }
  });
  const [counterpartRecords, setCounterpartRecords] = useState<AttendanceRecord[]>([]);
  const [calendarDays, setCalendarDays] = useState<AcademicCalendarDay[]>(DEFAULT_CALENDAR);
  const [delegations, setDelegations] = useState<ClassDelegation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingExtraClassesCount, setPendingExtraClassesCount] = useState<number>(0);

  const fetchExtraClassesBadge = async () => {
    try {
      const res = await fetch('/api/extra-classes');
      if (res.ok) {
        const data = await res.json();
        setPendingExtraClassesCount(data.pendingCount || 0);
      }
    } catch (e) {}
  };

  // Active refs to maintain live session sync state without stale closure traps
  const selectedDateRef = useRef(selectedDate);
  const selectedGradeRef = useRef(selectedGrade);
  const selectedSessionRef = useRef(selectedSession);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
    safeLocalStorage.setItem('moe_selected_date', selectedDate);
  }, [selectedDate]);
  useEffect(() => {
    selectedGradeRef.current = selectedGrade;
    safeLocalStorage.setItem('moe_selected_grade', selectedGrade);
  }, [selectedGrade]);
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
    safeLocalStorage.setItem('moe_selected_session', selectedSession);
  }, [selectedSession]);

  // Stats state
  const [stats, setStats] = useState<AttendanceStatsSummary>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      schoolName: 'F. Magoodhoo School',
      schoolId: 'SCH-F02',
      totalStudents: 215,
      overallAttendanceRate: null,
      morningAttendanceRate: null,
      postBreakAttendanceRate: null,
      postBreakRecoveryRate: null,
      activeLeavesCount: 0,
      lateEntriesCount: 0,
      notInIslandCount: 0,
      sickLeaveCount: 0,
      pendingOfflineCount: 0,
      gradeStats: [],
    };
  });

  // Business Rules & Sequential Attendance State
  const [isSchoolClosed, setIsSchoolClosed] = useState<boolean>(false);
  const [schoolClosureReason, setSchoolClosureReason] = useState<string>('');
  const [schoolClosureReasonDhivehi, setSchoolClosureReasonDhivehi] = useState<string>('');
  const [closureDetails, setClosureDetails] = useState<{
    reason?: string;
    reasonDhivehi?: string;
    formattedLabel?: string;
    formattedLabelDhivehi?: string;
    source?: string;
  } | undefined>(undefined);
  const [pendingPreviousSession, setPendingPreviousSession] = useState<{
    date: string;
    session: SessionType;
    sessionLabel: string;
    unmarkedCount: number;
    grade?: string;
  } | null>(null);
  const [isSessionSubmitted, setIsSessionSubmitted] = useState<boolean>(false);
  const [manuallyReopenedDates, setManuallyReopenedDates] = useState<Set<string>>(new Set());
  const [isLiveSyncActive, setIsLiveSyncActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // School Session Timings (configurable for Morning and Afternoon)
  const [sessionTimings, setSessionTimings] = useState<SchoolSessionTimings>(() => {
    try {
      const cached = safeLocalStorage.getItem('school_session_timings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.morning && parsed?.afternoon) return parsed;
      }
    } catch {}
    return {
      morning: { startTime: '07:45', endTime: '10:15', label: 'Morning Session', labelDhivehi: 'ހެނދުނުގެ ސެޝަން' },
      afternoon: { startTime: '10:45', endTime: '13:15', label: 'Afternoon Session', labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން' },
    };
  });

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [smsStudent, setSmsStudent] = useState<Student | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);
  const [isOfflineQueueModalOpen, setIsOfflineQueueModalOpen] = useState(false);

  // Mobile Navigation & Login View State
  const [showLoginView, setShowLoginView] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const valid = safeLocalStorage.getItem('moe_portal_logged_in');
    if (valid === null) return true; // Default logged in on first load so portal is immediately functional
    return valid === 'true';
  });

  // Check if chosen date is Maldives weekend (Friday=5, Saturday=6)
  const isWeekend = (() => {
    if (!selectedDate) return false;
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(dayNum)) {
        // Use UTC noon to be completely immune to browser local timezone shifts
        const day = new Date(Date.UTC(y, m, dayNum, 12, 0, 0)).getUTCDay();
        return day === 5 || day === 6;
      }
    }
    return false;
  })();

  // Toast notifications for cross-browser safe alerts (avoids window.alert iframe security restrictions)
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'warning' | 'error' = 'warning') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // 1. Initial Load: Fetch from API and sync with Dexie cache
  useEffect(() => {
    initData();
  }, []);

  // 2. Refresh attendance & stats whenever date or session changes
  useEffect(() => {
    fetchAttendance();
    fetchMoEStats(true);
  }, [selectedDate, selectedSession]);

  // 2b. Re-fetch stats & attendance whenever switching to reports tab
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchMoEStats(true);
      fetchAttendance();
    }
  }, [activeTab]);

  const applyUpdatedTimings = (incoming: any) => {
    if (!incoming) return;
    const morning = incoming.normal?.morning || incoming.morning;
    const afternoon = incoming.normal?.afternoon || incoming.afternoon;
    if (!morning?.startTime || !afternoon?.startTime) return;
    const normalized: SchoolSessionTimings = {
      normal: { morning, afternoon },
      morning,
      afternoon,
      temporaryOverrides: Array.isArray(incoming.temporaryOverrides) ? incoming.temporaryOverrides : [],
    };
    let didChange = false;
    setSessionTimings((prev) => {
      if (
        prev?.morning?.startTime === normalized.morning.startTime &&
        prev?.morning?.endTime === normalized.morning.endTime &&
        prev?.afternoon?.startTime === normalized.afternoon.startTime &&
        prev?.afternoon?.endTime === normalized.afternoon.endTime &&
        JSON.stringify(prev?.temporaryOverrides || []) === JSON.stringify(normalized.temporaryOverrides)
      ) {
        return prev;
      }
      didChange = true;
      return normalized;
    });
    if (didChange) {
      safeLocalStorage.setItem('school_session_timings', JSON.stringify(normalized));
      setIsLiveSyncActive(true);
      setLastSyncTime(new Date());
    }
  };

  const isFetchingTimingsRef = useRef<boolean>(false);

  const fetchSessionTimings = async () => {
    if (isFetchingTimingsRef.current) return;
    isFetchingTimingsRef.current = true;

    try {
      let gotTimings = false;

      // 1. Primary: Server endpoint with no-cache headers & timestamp query param (Fast <1ms)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const timingRes = await fetch(`/api/settings/session-timings?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (timingRes.ok) {
          const cType = timingRes.headers.get('content-type') || '';
          if (cType.includes('application/json')) {
            const timingData = await timingRes.json();
            if (timingData.timings) {
              applyUpdatedTimings(timingData.timings);
              setIsLiveSyncActive(true);
              gotTimings = true;
            }
          }
        }
      } catch (err) {
        // Server timed out or network offline, try direct Firestore fallback
      }

      // 2. Direct Firestore fallback (guarantees real-time cross-browser sync on any hosting, Vercel, or proxy)
      if (!gotTimings) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const firestoreRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/industrial-heaven-2j4jh/databases/ai-studio-magoodhooschoole-128d6f0a-ac98-471b-97a7-60f7b0b880b4/documents/school_settings/session_timings?key=AIzaSyAfYbbnjncIlteLWYG9ZIpRRa8lq_QZvR8`,
            { cache: 'no-store', signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (firestoreRes.ok) {
            const doc = await firestoreRes.json();
            if (doc.fields?.timingsJson?.stringValue) {
              const parsed = JSON.parse(doc.fields.timingsJson.stringValue);
              applyUpdatedTimings(parsed);
              setIsLiveSyncActive(true);
            }
          }
        } catch (err) {
          // Silent catch for background polling
        }
      }
    } finally {
      isFetchingTimingsRef.current = false;
    }
  };

  const fetchAttendanceSilent = async () => {
    try {
      const curDate = selectedDateRef.current;
      const curSession = selectedSessionRef.current;
      const url = `/api/attendance?date=${curDate}&grade=ALL&session=${curSession}&_t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.records && curDate === selectedDateRef.current && curSession === selectedSessionRef.current) {
          const localRecords = await offlineDb.attendance
            .where('date')
            .equals(curDate)
            .and((r) => r.sessionType === curSession)
            .toArray().catch(() => []);
          const storageKey = `moe_att_${curDate}_${curSession}`;
          const storedList = safeLocalStorage.getJSON<AttendanceRecord[]>(storageKey, []);
          const masterList = getLocalMasterRecords(curDate, curSession);
          const allLocal = [...localRecords];
          for (const s of storedList) {
            if (!allLocal.some((l) => l.studentId === s.studentId)) {
              allLocal.push(s);
            }
          }
          for (const m of masterList) {
            if (!allLocal.some((l) => l.studentId === m.studentId)) {
              allLocal.push(m);
            }
          }
          const mergedRecords = mergeAttendanceRecords(data.records, allLocal);

          setAttendanceRecords((prev) => {
            if (prev.length === mergedRecords.length) {
              let isSame = true;
              for (let i = 0; i < prev.length; i++) {
                const a = prev[i];
                const b = mergedRecords[i];
                if (a.id !== b.id || a.status !== b.status || a.leaveReason !== b.leaveReason || a.arrivalTime !== b.arrivalTime) {
                  isSame = false;
                  break;
                }
              }
              if (isSame) return prev;
            }
            return mergedRecords;
          });
          if (mergedRecords.length > 0) {
            safeLocalStorage.setJSON(storageKey, mergedRecords);
            saveLocalMasterRecordsBulk(mergedRecords);
          }
          setCounterpartRecords((prev) => {
            const next = data.counterpartRecords || [];
            if (prev.length === next.length) {
              let isSame = true;
              for (let i = 0; i < prev.length; i++) {
                const a = prev[i];
                const b = next[i];
                if (a.id !== b.id || a.status !== b.status || a.leaveReason !== b.leaveReason || a.arrivalTime !== b.arrivalTime) {
                  isSame = false;
                  break;
                }
              }
              if (isSame) return prev;
            }
            return next;
          });
          const closedVal = Boolean(data.isSchoolClosed);
          setIsSchoolClosed((prev) => (prev === closedVal ? prev : closedVal));
          const submittedVal = Boolean(data.isSessionSubmitted);
          setIsSessionSubmitted((prev) => (prev === submittedVal ? prev : submittedVal));
        }
      }
    } catch {}
  };

  // 3. Real-time sync for session timings, attendance, and submission across multiple browsers, tabs, and incognito windows
  useEffect(() => {
    // Immediate fetch on mount
    fetchSessionTimings();

    // BroadcastChannel for same-origin tabs
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('school_portal_sync');
        channel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'SESSION_TIMINGS_UPDATED' && data.timings) {
            applyUpdatedTimings(data.timings);
          } else if (data?.type === 'SESSION_SUBMITTED') {
            if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
              setIsSessionSubmitted(true);
            }
            fetchAttendanceSilent();
            fetchMoEStats();
          } else if (data?.type === 'SESSION_REVERTED') {
            if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
              setIsSessionSubmitted(false);
            }
            fetchAttendanceSilent();
            fetchMoEStats();
          } else if (data?.type === 'ATTENDANCE_SINGLE_MUTATED' && data.record) {
            if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
              setAttendanceRecords((prev) => {
                const idx = prev.findIndex((r) => r.studentId === data.record.studentId);
                if (idx >= 0) {
                  const curr = prev[idx];
                  if (
                    curr.status === data.record.status &&
                    curr.leaveReason === data.record.leaveReason &&
                    curr.absenceReason === data.record.absenceReason &&
                    curr.notes === data.record.notes &&
                    curr.arrivedAt === data.record.arrivedAt &&
                    curr.markedByUserId === data.record.markedByUserId
                  ) {
                    return prev;
                  }
                  const copy = [...prev];
                  copy[idx] = data.record;
                  return copy;
                }
                return [...prev, data.record];
              });
              fetchMoEStats();
            }
          } else if (
            data?.type === 'ATTENDANCE_MUTATED' ||
            data?.type === 'ATTENDANCE_RECORD_REVERTED' ||
            data?.type === 'CALENDAR_UPDATED'
          ) {
            if (data?.resetAll) {
              clearAllLocalAttendanceStores();
              setAttendanceRecords([]);
              setCounterpartRecords([]);
              setIsSessionSubmitted(false);
              try {
                offlineDb.attendance.clear().catch(() => {});
                offlineDb.syncQueue.clear().catch(() => {});
              } catch {}
            }
            fetchAttendanceSilent();
            fetchMoEStats();
          } else if (data?.type === 'STUDENT_UPDATED' && data.student) {
            setStudents((prev) => prev.map((s) => (s.id === data.student.id ? data.student : s)));
          }
        };
      }
    } catch {}

    // Storage event for same-profile cross-window instant sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'school_session_timings' && e.newValue) {
        try {
          applyUpdatedTimings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Server-Sent Events (SSE) for instant live push across incognito, separate browsers, and devices
    let eventSource: EventSource | null = null;
    let sseReconnectTimer: any = null;

    const setupSSE = () => {
      try {
        if (typeof EventSource !== 'undefined') {
          eventSource = new EventSource('/api/live-sync');
          eventSource.onopen = () => {
            setIsLiveSyncActive(true);
            setLastSyncTime(new Date());
          };
          eventSource.onmessage = (event) => {
            try {
              setIsLiveSyncActive(true);
              setLastSyncTime(new Date());
              const data = JSON.parse(event.data);
              if ((data.type === 'SESSION_TIMINGS_UPDATED' || data.type === 'CONNECTED') && data.timings) {
                applyUpdatedTimings(data.timings);
              } else if (data.type === 'SESSION_SUBMITTED') {
                if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
                  setIsSessionSubmitted(true);
                }
                fetchAttendanceSilent();
                fetchMoEStats();
              } else if (data.type === 'SESSION_REVERTED') {
                if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
                  setIsSessionSubmitted(false);
                }
                fetchAttendanceSilent();
                fetchMoEStats();
              } else if (data.type === 'ATTENDANCE_SINGLE_MUTATED' && data.record) {
                if (data.date === selectedDateRef.current && data.session === selectedSessionRef.current) {
                  setAttendanceRecords((prev) => {
                    const idx = prev.findIndex((r) => r.studentId === data.record.studentId);
                    if (idx >= 0) {
                      const curr = prev[idx];
                      if (
                        curr.status === data.record.status &&
                        curr.leaveReason === data.record.leaveReason &&
                        curr.absenceReason === data.record.absenceReason &&
                        curr.notes === data.record.notes &&
                        curr.arrivedAt === data.record.arrivedAt &&
                        curr.markedByUserId === data.record.markedByUserId
                      ) {
                        return prev;
                      }
                      const copy = [...prev];
                      copy[idx] = data.record;
                      return copy;
                    }
                    return [...prev, data.record];
                  });
                  fetchMoEStats();
                }
              } else if (
                data.type === 'ATTENDANCE_MUTATED' ||
                data.type === 'ATTENDANCE_RECORD_REVERTED' ||
                data.type === 'CALENDAR_UPDATED'
              ) {
                if (data?.resetAll) {
                  clearAllLocalAttendanceStores();
                  setAttendanceRecords([]);
                  setCounterpartRecords([]);
                  setIsSessionSubmitted(false);
                  try {
                    offlineDb.attendance.clear().catch(() => {});
                    offlineDb.syncQueue.clear().catch(() => {});
                  } catch {}
                }
                fetchAttendanceSilent();
                fetchMoEStats();
              } else if (data.type === 'STUDENT_UPDATED' && data.student) {
                setStudents((prev) => prev.map((s) => (s.id === data.student.id ? data.student : s)));
              }
            } catch {}
          };
          eventSource.onerror = () => {
            try {
              eventSource?.close();
            } catch {}
            clearTimeout(sseReconnectTimer);
            sseReconnectTimer = setTimeout(setupSSE, 2000);
          };
        }
      } catch {}
    };

    setupSSE();

    // High-frequency Real-Time Version Pulse (every 1.5 seconds)
    // Synchronizes Normal tabs, Incognito tabs, and other staff devices immediately!
    let lastKnownAttendanceVersion = -1;
    let lastKnownTimingsVersion = -1;
    let isVersionCheckRunning = false;

    const checkAttendanceVersionPulse = async () => {
      if (isVersionCheckRunning) return;
      isVersionCheckRunning = true;
      try {
        const res = await fetch(`/api/attendance/version?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.timingsVersion === 'number') {
            if (lastKnownTimingsVersion !== -1 && data.timingsVersion !== lastKnownTimingsVersion) {
              fetchSessionTimings();
            }
            lastKnownTimingsVersion = data.timingsVersion;
          }
          if (typeof data.version === 'number') {
            if (lastKnownAttendanceVersion !== -1 && data.version !== lastKnownAttendanceVersion) {
              fetchAttendanceSilent();
              fetchMoEStats();
            }
            lastKnownAttendanceVersion = data.version;
          }
        }
      } catch {}
      finally {
        isVersionCheckRunning = false;
      }
    };

    // Run first check right away
    checkAttendanceVersionPulse();

    // Pulse every 1.5 seconds for instant multi-tab & incognito cross-sync
    const pulseInterval = setInterval(checkAttendanceVersionPulse, 1500);

    // Standard session timings interval (every 15 seconds)
    const timingsInterval = setInterval(() => {
      fetchSessionTimings();
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAttendanceSilent();
      }
    }, 15000);

    const handleFocus = () => {
      fetchSessionTimings();
      checkAttendanceVersionPulse();
      fetchAttendanceSilent();
    };
    window.addEventListener('focus', handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSessionTimings();
        checkAttendanceVersionPulse();
        fetchAttendanceSilent();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(timingsInterval);
      clearTimeout(sseReconnectTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      channel?.close();
      try {
        eventSource?.close();
      } catch {}
    };
  }, []);

  const initData = async () => {
    // Immediately fetch session timings in parallel
    fetchSessionTimings();
    try {
      // 1. Fetch Staff (with offline localStorage persistence)
      try {
        const staffRes = await fetch('/api/auth/staff');
        const cType = staffRes.headers.get('content-type') || '';
        if (staffRes.ok && cType.includes('application/json')) {
          const data = await staffRes.json();
          if (data.staff && data.staff.length > 0) {
            setStaffList(data.staff);
            safeLocalStorage.setItem('moe_cached_staff', JSON.stringify(data.staff));
            const savedId = safeLocalStorage.getItem('moe_active_user_id');
            const isSessionValid = safeLocalStorage.getItem('moe_portal_logged_in');
            if (isSessionValid === 'true' && savedId) {
              const active = data.staff.find((s: User) => s.id === savedId);
              if (active) {
                const isMobileOrPrivileged = typeof window !== 'undefined' && (
                  window.innerWidth < 768 ||
                  safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true' ||
                  safeLocalStorage.getItem('moe_login_source') === 'mobile'
                );
                const enriched: User = isMobileOrPrivileged
                  ? { ...active, hasRapidRollCallPrivilege: true, loginViaMobile: true }
                  : active;
                setCurrentUser(enriched);
                setIsLoggedIn(true);
                if (active.assignedGrade) {
                  setSelectedGrade(active.assignedGrade);
                }
              }
            }
          }
        } else {
          // Offline fallback
          const cachedStaff = safeLocalStorage.getItem('moe_cached_staff');
          if (cachedStaff) {
            const parsed = safeJsonParse(cachedStaff, []);
            if (parsed.length > 0) setStaffList(parsed);
          }
        }
      } catch (e) {
        // Network offline fallback
        const cachedStaff = safeLocalStorage.getItem('moe_cached_staff');
        if (cachedStaff) {
          const parsed = safeJsonParse(cachedStaff, []);
          if (parsed.length > 0) setStaffList(parsed);
        }
      }

      // 2. Fetch Students
      try {
        const studentRes = await fetch('/api/students');
        const cType = studentRes.headers.get('content-type') || '';
        if (studentRes.ok && cType.includes('application/json')) {
          const sData = await studentRes.json();
          if (sData.students && sData.students.length > 0) {
            setStudents(sData.students);
            await offlineDb.students.bulkPut(sData.students);
          }
        } else {
          const cachedStudents = await offlineDb.students.toArray();
          if (cachedStudents.length > 0) {
            setStudents(cachedStudents);
          }
        }
      } catch (e) {
        const cachedStudents = await offlineDb.students.toArray();
        if (cachedStudents.length > 0) {
          setStudents(cachedStudents);
        }
      }

      // 3. Fetch Calendar
      try {
        const calRes = await fetch('/api/calendar');
        if (calRes.ok) {
          const cData = await calRes.json();
          let calList: AcademicCalendarDay[] = cData.calendar || [];
          try {
            const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
            if (clientDeleted.length > 0) {
              calList = calList.filter((d) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
            }
          } catch (e) {}
          setCalendarDays(calList);
          try {
            safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
            await offlineDb.calendar.clear();
            if (calList.length > 0) {
              await offlineDb.calendar.bulkPut(calList);
            }
          } catch (e) {}
        } else {
          const cached = safeLocalStorage.getItem('moe_academic_calendar');
          if (cached) {
            let parsed = safeJsonParse(cached, []);
            try {
              const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
              if (clientDeleted.length > 0) {
                parsed = parsed.filter((d: AcademicCalendarDay) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
              }
            } catch (e) {}
            setCalendarDays(parsed);
          }
        }
      } catch (e) {
        const cached = safeLocalStorage.getItem('moe_academic_calendar');
        if (cached) {
          let parsed = safeJsonParse(cached, []);
          try {
            const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
            if (clientDeleted.length > 0) {
              parsed = parsed.filter((d: AcademicCalendarDay) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
            }
          } catch (e) {}
          setCalendarDays(parsed);
        }
      }

      // 4. Fetch Substitutions
      const subRes = await fetch('/api/substitutions');
      if (subRes.ok) {
        const subData = await subRes.json();
        setDelegations(subData.delegations || []);
      }

      // 5. Fetch Audit Logs
      fetchAuditLogs();

      // 6. Fetch MoE Statistics
      fetchMoEStats();

      // 7. Fetch Extra Classes Pending Badge
      fetchExtraClassesBadge();

      // 8. Fetch Configured Session Timings
      await fetchSessionTimings();
    } catch (err) {
      console.warn('Network offline or backend warm-up, reading from offline cache', err);
      const cached = await offlineDb.students.toArray();
      if (cached.length > 0) setStudents(cached);
    }
  };

  const fetchAttendance = async () => {
    try {
      // Non-blocking background sync flush so UI date-switching is immediate
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        syncEngine.flushQueue().catch((e) => {
          console.warn('Pre-fetch sync flush deferred:', e);
        });
      }

      const url = `/api/attendance?date=${selectedDate}&grade=ALL&session=${selectedSession}&_t=${Date.now()}`;
      let res: Response;
      try {
        res = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        });
      } catch {
        res = new Response(null, { status: 503 });
      }

      if (res.ok) {
        const data = await res.json();
        const serverRecords: AttendanceRecord[] = data.records || [];

        // Safe Offline Merge: Keep any local records not yet synced or newer
        try {
          const localRecords = await offlineDb.attendance
            .where('date')
            .equals(selectedDate)
            .and((r) => r.sessionType === selectedSession)
            .toArray().catch(() => []);

          const storageKey = `moe_att_${selectedDate}_${selectedSession}`;
          const storedList = safeLocalStorage.getJSON<AttendanceRecord[]>(storageKey, []);
          const masterList = getLocalMasterRecords(selectedDate, selectedSession);
          const allLocal = [...localRecords];
          for (const s of storedList) {
            if (!allLocal.some((l) => l.studentId === s.studentId)) {
              allLocal.push(s);
            }
          }
          for (const m of masterList) {
            if (!allLocal.some((l) => l.studentId === m.studentId)) {
              allLocal.push(m);
            }
          }

          const mergedRecords = mergeAttendanceRecords(serverRecords, allLocal);
          setAttendanceRecords(mergedRecords);

          // Update Dexie cache, safeLocalStorage & master local dictionary with merged records
          if (mergedRecords.length > 0) {
            safeLocalStorage.setJSON(storageKey, mergedRecords);
            saveLocalMasterRecordsBulk(mergedRecords);
            await offlineDb.attendance.bulkPut(mergedRecords).catch(() => {});
          }
        } catch {
          setAttendanceRecords(serverRecords);
        }

        setCounterpartRecords(data.counterpartRecords || []);
        setIsSchoolClosed(Boolean(data.isSchoolClosed));
        const rawReason = data.schoolClosureReason || data.closureDetails?.reason || '';
        const rawReasonDv = data.schoolClosureReasonDhivehi || data.closureDetails?.reasonDhivehi || '';
        setSchoolClosureReason(rawReason);
        setSchoolClosureReasonDhivehi(rawReasonDv);
        setClosureDetails(
          data.closureDetails ||
          (rawReason
            ? {
                reason: rawReason,
                reasonDhivehi: rawReasonDv,
                formattedLabel: data.formattedClosureLabel,
                formattedLabelDhivehi: data.formattedClosureLabelDhivehi,
                source: 'CALENDAR',
              }
            : undefined)
        );
        setPendingPreviousSession(null);
        setIsSessionSubmitted(Boolean(data.isSessionSubmitted));
      } else {
        // Fetch from Dexie offline
        const local = await offlineDb.attendance
          .where('date')
          .equals(selectedDate)
          .and((r) => r.sessionType === selectedSession)
          .toArray();
        setAttendanceRecords(local.length > 0 ? local : []);

        // Offline Maldivian Weekend check (Friday = 5, Saturday = 6)
        const d = new Date(selectedDate + 'T00:00:00Z');
        const day = d.getUTCDay();
        if ((day === 5 || day === 6) && !manuallyReopenedDates.has(selectedDate)) {
          setIsSchoolClosed(true);
          const reasonEn = day === 5 ? 'Official Weekend (Friday)' : 'Official Weekend (Saturday)';
          const reasonDv = day === 5 ? 'ހުކުރު (ހަފްތާ ބަންދު)' : 'ހޮނިހިރު (ހަފްތާ ބަންދު)';
          setSchoolClosureReason(reasonEn);
          setSchoolClosureReasonDhivehi(reasonDv);
          setClosureDetails({
            reason: reasonEn,
            reasonDhivehi: reasonDv,
            formattedLabel: `School Closed - ${reasonEn}`,
            formattedLabelDhivehi: `ސްކޫލް ބަންދު - ${reasonDv}`,
            source: 'CALENDAR',
          });
        } else {
          setIsSchoolClosed(false);
          setSchoolClosureReason('');
          setSchoolClosureReasonDhivehi('');
          setClosureDetails(undefined);
        }
      }
    } catch {
      const local = await offlineDb.attendance
        .where('date')
        .equals(selectedDate)
        .and((r) => r.sessionType === selectedSession)
        .toArray();
      setAttendanceRecords(local.length > 0 ? local : []);

      const d = new Date(selectedDate + 'T00:00:00Z');
      const day = d.getUTCDay();
      if ((day === 5 || day === 6) && !manuallyReopenedDates.has(selectedDate)) {
        setIsSchoolClosed(true);
        const reasonEn = day === 5 ? 'Official Weekend (Friday)' : 'Official Weekend (Saturday)';
        const reasonDv = day === 5 ? 'ހުކުރު (ހަފްތާ ބަންދު)' : 'ހޮނިހިރު (ހަފްތާ ބަންދު)';
        setSchoolClosureReason(reasonEn);
        setSchoolClosureReasonDhivehi(reasonDv);
        setClosureDetails({
          reason: reasonEn,
          reasonDhivehi: reasonDv,
          formattedLabel: `School Closed - ${reasonEn}`,
          formattedLabelDhivehi: `ސްކޫލް ބަންދު - ${reasonDv}`,
          source: 'CALENDAR',
        });
      } else {
        setIsSchoolClosed(false);
        setSchoolClosureReason('');
        setSchoolClosureReasonDhivehi('');
        setClosureDetails(undefined);
      }
    }
  };

  const fetchMoEStatsTimeoutRef = useRef<any>(null);
  const fetchMoEStats = async (immediate = false, dateParam?: string): Promise<void> => {
    if (fetchMoEStatsTimeoutRef.current) {
      clearTimeout(fetchMoEStatsTimeoutRef.current);
    }
    const runFetch = async () => {
      const targetDate = dateParam || selectedDateRef.current;
      try {
        const res = await fetch(`/api/reports/moe?date=${targetDate}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (targetDate === selectedDateRef.current) {
            setStats(data);
          }
        }
      } catch (err) {
        console.warn('MoE stats fetch deferred/offline:', err);
      }
    };

    if (immediate) {
      return runFetch();
    } else {
      return new Promise<void>((resolve) => {
        fetchMoEStatsTimeoutRef.current = setTimeout(async () => {
          await runFetch();
          resolve();
        }, 200);
      });
    }
  };

  const fetchAuditLogsTimeoutRef = useRef<any>(null);
  const fetchAuditLogs = async (immediate = false): Promise<void> => {
    if (fetchAuditLogsTimeoutRef.current) {
      clearTimeout(fetchAuditLogsTimeoutRef.current);
    }
    const runFetch = async () => {
      try {
        const res = await fetch(`/api/audit-logs?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.logs || []);
        }
      } catch (err) {
        console.warn('Audit logs fetch deferred/offline:', err);
      }
    };

    if (immediate) {
      return runFetch();
    } else {
      return new Promise<void>((resolve) => {
        fetchAuditLogsTimeoutRef.current = setTimeout(async () => {
          await runFetch();
          resolve();
        }, 400);
      });
    }
  };

  // Check if current user is privileged to take early attendance (Admin / Super Admin / Rapid Roll Call)
  const isPrivilegedUser = Boolean(
    currentUser?.role === 'ADMIN' ||
    currentUser?.isSuperAdmin ||
    isUserSuperAdmin(currentUser) ||
    currentUser?.hasRapidRollCallPrivilege ||
    currentUser?.loginViaMobile ||
    safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true' ||
    safeLocalStorage.getItem('moe_login_source') === 'mobile'
  );

  const isUserPrivilegedForSession = (reason?: string) => {
    if (reason !== 'SESSION_NOT_STARTED') return false;
    return isPrivilegedUser;
  };

  // Handlers for Mutations
  const handleUpdateRecord = async (record: AttendanceRecord) => {
    // 0. Validate eligibility: Cannot mark future date or session before start time unless privileged
    const eligibility = checkSessionMarkingEligibility(record.date, record.sessionType, sessionTimings);
    if (!eligibility.allowed && !isUserPrivilegedForSession(eligibility.reason)) {
      showNotification(eligibility.message, 'warning');
      return;
    }

    const previousRecords = attendanceRecords;
    const enrichedRecord: AttendanceRecord = {
      ...record,
      markedByUserId: record.markedByUserId || currentUser?.id || 'staff-1',
      markedByUserName: record.markedByUserName || currentUser?.fullName,
    };

    const storageKey = `moe_att_${enrichedRecord.date}_${enrichedRecord.sessionType}`;

    // 1. Optimistic UI update and immediate synchronous local persistence
    saveLocalMasterRecord(enrichedRecord);
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.studentId === enrichedRecord.studentId);
      const updated = idx >= 0 ? [...prev] : [...prev, enrichedRecord];
      if (idx >= 0) updated[idx] = enrichedRecord;
      safeLocalStorage.setJSON(storageKey, updated);
      return updated;
    });

    // Also persist immediately to Dexie offline DB
    await offlineDb.attendance.put(enrichedRecord).catch(() => {});

    // 2. Direct fast-path sync to server API with offline fallback
    try {
      const nowTimes = getMaldivesNow();
      const res = await fetch('/api/attendance/single', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: enrichedRecord,
          clientTime: nowTimes.timeStr,
          clientDate: enrichedRecord.date,
          hasRapidRollCallPrivilege: Boolean(currentUser?.hasRapidRollCallPrivilege || isPrivilegedUser),
          loginViaMobile: Boolean(currentUser?.loginViaMobile || isPrivilegedUser),
          isSuperAdmin: Boolean(currentUser?.isSuperAdmin || isUserSuperAdmin(currentUser)),
          requesterEmail: currentUser?.email,
          requesterUserId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        const savedRec = resData.record || enrichedRecord;
        saveLocalMasterRecord(savedRec);
        await offlineDb.attendance.put({ ...savedRec, syncStatus: 'SYNCED' });
        const currentList = safeLocalStorage.getJSON<AttendanceRecord[]>(storageKey, []);
        const idx = currentList.findIndex((r) => r.studentId === savedRec.studentId);
        const updatedList = idx >= 0 ? [...currentList] : [...currentList, savedRec];
        if (idx >= 0) updatedList[idx] = savedRec;
        safeLocalStorage.setJSON(storageKey, updatedList);
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('school_portal_sync');
            channel.postMessage({
              type: 'ATTENDANCE_SINGLE_MUTATED',
              date: enrichedRecord.date,
              session: enrichedRecord.sessionType,
              record: savedRec,
            });
            channel.close();
          }
        } catch {}
      } else {
        const errData = await res.json().catch(() => ({}));
        if (
          errData.error === 'FUTURE_DATE_NOT_ALLOWED' ||
          errData.error === 'SESSION_NOT_STARTED' ||
          errData.error === 'MANUAL_MARK_DISABLED' ||
          errData.error === 'SESSION_LOCKED'
        ) {
          // Revert optimistic update
          setAttendanceRecords(previousRecords);
          safeLocalStorage.setJSON(storageKey, previousRecords);
          showNotification(errData.message || 'Cannot mark attendance.', 'warning');
          return;
        }
        await syncEngine.recordAttendance(enrichedRecord);
      }
    } catch {
      await syncEngine.recordAttendance(enrichedRecord);
    }

    // 3. Update stats & audit in background
    fetchMoEStats();
    fetchAuditLogs();
  };

  const handleBulkMarkPresent = async (onlyUnmarked: boolean = false) => {
    // 0. Validate eligibility
    const eligibility = checkSessionMarkingEligibility(selectedDate, selectedSession, sessionTimings);
    if (!eligibility.allowed && !isUserPrivilegedForSession(eligibility.reason)) {
      showNotification(eligibility.message, 'warning');
      return;
    }

    const previousRecords = attendanceRecords;
    const relevantStudents =
      selectedGrade === 'ALL'
        ? students
        : students.filter((s) => s.gradeLevel === selectedGrade);

    const now = new Date().toISOString();
    const activeStaffId = currentUser?.id || 'staff-1';
    const activeStaffName = currentUser?.fullName;

    const currentRecordsMap = new Map<string, AttendanceRecord>(
      attendanceRecords.map((r) => [r.studentId, r])
    );

    const updatedRecords: AttendanceRecord[] = relevantStudents.map((st) => {
      const existing = currentRecordsMap.get(st.id);
      if (onlyUnmarked && existing && existing.status) {
        return existing;
      }
      return {
        id: existing?.id || `att-${st.id}-${selectedDate}-${selectedSession}`,
        studentId: st.id,
        date: selectedDate,
        sessionType: selectedSession,
        status: 'PRESENT',
        leaveReason: 'NONE',
        markedByUserId: activeStaffId,
        markedByUserName: activeStaffName,
        syncStatus: 'SYNCED',
        updatedAt: now,
      };
    });

    // Optimistic UI update merging with other grades' records
    const otherRecords = attendanceRecords.filter(
      (r) => !relevantStudents.some((st) => st.id === r.studentId)
    );
    const combinedNew = [...otherRecords, ...updatedRecords];
    saveLocalMasterRecordsBulk(updatedRecords);
    setAttendanceRecords(combinedNew);
    const storageKey = `moe_att_${selectedDate}_${selectedSession}`;
    safeLocalStorage.setJSON(storageKey, combinedNew);
    await offlineDb.attendance.bulkPut(updatedRecords).catch(() => {});

    // Direct fast-path sync to server API with offline fallback
    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: updatedRecords,
          hasRapidRollCallPrivilege: Boolean(currentUser?.hasRapidRollCallPrivilege || isPrivilegedUser),
          loginViaMobile: Boolean(currentUser?.loginViaMobile || isPrivilegedUser),
          isSuperAdmin: Boolean(currentUser?.isSuperAdmin || isUserSuperAdmin(currentUser)),
          requesterEmail: currentUser?.email,
          requesterUserId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        await offlineDb.attendance.bulkPut(updatedRecords).catch(() => {});
        safeLocalStorage.setJSON(storageKey, combinedNew);
        if (resData.isSessionSubmitted) {
          setIsSessionSubmitted(true);
        }
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('school_portal_sync');
            channel.postMessage({
              type: 'ATTENDANCE_MUTATED',
              date: selectedDate,
              session: selectedSession,
            });
            channel.close();
          }
        } catch {}
      } else {
        const errData = await res.json().catch(() => ({}));
        if (
          errData.error === 'FUTURE_DATE_NOT_ALLOWED' ||
          errData.error === 'SESSION_NOT_STARTED' ||
          errData.error === 'MANUAL_MARK_DISABLED' ||
          errData.error === 'SESSION_LOCKED'
        ) {
          setAttendanceRecords(previousRecords);
          safeLocalStorage.setJSON(storageKey, previousRecords);
          showNotification(errData.message || 'Cannot mark attendance.', 'warning');
          return;
        }
        await syncEngine.bulkRecordAttendance(updatedRecords);
      }
    } catch {
      await syncEngine.bulkRecordAttendance(updatedRecords);
    }

    fetchMoEStats();
    fetchAuditLogs();
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const isMobileLogin = typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true' ||
        safeLocalStorage.getItem('moe_login_source') === 'mobile'
      );
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          loginViaMobile: isMobileLogin,
          hasRapidRollCallPrivilege: isMobileLogin,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const userWithPrivilege: User = {
          ...data.user,
          hasRapidRollCallPrivilege: isMobileLogin ? true : data.user?.hasRapidRollCallPrivilege,
          loginViaMobile: isMobileLogin ? true : data.user?.loginViaMobile,
        };
        setCurrentUser(userWithPrivilege);
        safeLocalStorage.setItem('moe_logged_in_user', JSON.stringify(userWithPrivilege));
        safeLocalStorage.setItem('moe_active_user_id', userWithPrivilege.id);
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const handleAssignDelegation = async (del: {
    date: string;
    originalTeacherId: string;
    substituteTeacherId: string;
    gradeLevel: GradeLevel;
    reason: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(del),
      });
      if (res.ok) {
        const data = await res.json();
        setDelegations((prev) => [data.delegation, ...prev]);
        try {
          await offlineDb.delegations.put(data.delegation);
        } catch (e) {}
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to assign delegation:', err);
    }
  };

  const handleUpdateDelegation = async (id: string, updatedFields: Partial<ClassDelegation>) => {
    try {
      const res = await fetch(`/api/substitutions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setDelegations((prev) => prev.map((d) => (d.id === id ? data.delegation : d)));
        try {
          await offlineDb.delegations.put(data.delegation);
        } catch (e) {}
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to update delegation:', err);
    }
  };

  const handleDeleteDelegation = async (id: string) => {
    try {
      const res = await fetch(`/api/substitutions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDelegations((prev) => prev.filter((d) => d.id !== id));
        try {
          await offlineDb.delegations.delete(id);
        } catch (e) {}
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to delete delegation:', err);
    }
  };

  const handleRefreshCalendar = async () => {
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        let calList: AcademicCalendarDay[] = data.calendar || [];
        try {
          const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
          if (clientDeleted.length > 0) {
            calList = calList.filter((d) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
          }
        } catch (e) {}
        setCalendarDays(calList);
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
          await offlineDb.calendar.clear();
          if (calList.length > 0) {
            await offlineDb.calendar.bulkPut(calList);
          }
        } catch (e) {}
        fetchAuditLogs();
        fetchAttendance();
        fetchMoEStats();
      }
    } catch (err) {
      console.error('Failed to refresh calendar:', err);
    }
  };

  const handleToggleCalendarDay = async (
    date: string,
    dayType: AcademicDayType,
    desc?: string,
    descDv?: string
  ) => {
    try {
      const res = await fetch('/api/calendar/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, dayType, description: desc, descriptionDhivehi: descDv }),
      });
      if (res.ok) {
        const data = await res.json();
        const calList = data.calendar || [];
        setCalendarDays(calList);
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
          await offlineDb.calendar.clear();
          await offlineDb.calendar.bulkPut(calList);
        } catch (e) {}
        fetchAuditLogs();
        if (date === selectedDate) {
          fetchAttendance();
          fetchMoEStats();
        }
      }
    } catch (err) {
      console.error('Failed to toggle calendar day:', err);
    }
  };

  const handleSaveHoliday = async (holiday: {
    id?: string;
    date: string;
    endDate?: string;
    dayType: AcademicDayType;
    description: string;
    descriptionDhivehi?: string;
  }) => {
    try {
      const isEdit = Boolean(holiday.id);
      const url = isEdit ? `/api/calendar/holiday/${holiday.id}` : '/api/calendar/holiday';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holiday),
      });
      if (res.ok) {
        const data = await res.json();
        const calList = data.calendar || [];
        setCalendarDays(calList);
        // Unmark from client deleted tracking if saved/edited
        try {
          const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
          const filtered = clientDeleted.filter((x) => x !== holiday.id && x !== holiday.date);
          safeLocalStorage.setItem('moe_deleted_holidays', JSON.stringify(filtered));
        } catch (e) {}
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
          await offlineDb.calendar.clear();
          await offlineDb.calendar.bulkPut(calList);
        } catch (e) {}
        fetchAuditLogs();
        const isInRange = holiday.endDate
          ? selectedDate >= holiday.date && selectedDate <= holiday.endDate
          : holiday.date === selectedDate;
        if (isInRange) {
          fetchAttendance();
          fetchMoEStats();
        }
      }
    } catch (err) {
      console.error('Failed to save holiday:', err);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      // Optimistic instant local removal & blacklist
      try {
        const clientDeleted: string[] = safeJsonParse(safeLocalStorage.getItem('moe_deleted_holidays'), []);
        if (!clientDeleted.includes(id)) {
          clientDeleted.push(id);
          safeLocalStorage.setItem('moe_deleted_holidays', JSON.stringify(clientDeleted));
        }
      } catch (e) {}

      setCalendarDays((prev) => {
        const updated = prev.filter((d) => d.id !== id && d.date !== id);
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      const res = await fetch(`/api/calendar/holiday/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        const calList = data.calendar || [];
        setCalendarDays(calList);
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
          await offlineDb.calendar.clear();
          await offlineDb.calendar.bulkPut(calList);
        } catch (e) {}
        fetchAuditLogs();
        fetchAttendance();
        fetchMoEStats();
      }
    } catch (err) {
      console.error('Failed to delete holiday:', err);
    }
  };

  const handleResetCalendar = async () => {
    try {
      try {
        safeLocalStorage.removeItem('moe_deleted_holidays');
      } catch (e) {}
      const res = await fetch('/api/calendar/reset', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        const calList = data.calendar || [];
        setCalendarDays(calList);
        try {
          safeLocalStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
          await offlineDb.calendar.clear();
          await offlineDb.calendar.bulkPut(calList);
        } catch (e) {}
        fetchAuditLogs();
        fetchAttendance();
        fetchMoEStats();
      }
    } catch (err) {
      console.error('Failed to reset calendar:', err);
    }
  };

  const handleUpdateSessionTimings = async (newTimings: SchoolSessionTimings) => {
    // 1. Instantly update local state and localStorage
    applyUpdatedTimings(newTimings);
    setIsLiveSyncActive(true);
    setLastSyncTime(new Date());

    // 2. Broadcast via BroadcastChannel for same-origin tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('school_portal_sync');
        channel.postMessage({ type: 'SESSION_TIMINGS_UPDATED', timings: newTimings });
        channel.close();
      }
    } catch {}

    // 3. Persist to server API and await confirmation
    try {
      const res = await fetch('/api/settings/session-timings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timings: newTimings }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.timings) {
          applyUpdatedTimings(data.timings);
        }
      }
    } catch (err) {
      console.warn('PUT session timings error:', err);
    }

    // 4. Also directly persist to Firestore document in parallel
    try {
      const payload = JSON.stringify({
        fields: {
          timingsJson: { stringValue: JSON.stringify(newTimings) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      });
      await fetch(
        `https://firestore.googleapis.com/v1/projects/industrial-heaven-2j4jh/databases/ai-studio-magoodhooschoole-128d6f0a-ac98-471b-97a7-60f7b0b880b4/documents/school_settings/session_timings?key=AIzaSyAfYbbnjncIlteLWYG9ZIpRRa8lq_QZvR8&updateMask.fieldPaths=timingsJson&updateMask.fieldPaths=updatedAt`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }
      );
    } catch {}
  };

  const handleOpenTimingsModal = () => {
    setIsTimingsModalOpen(true);
    fetchSessionTimings().catch(() => {});
  };

  const handleDeclareSchoolClosed = async (reason: string, reasonDhivehi?: string) => {
    try {
      const res = await fetch('/api/school/close-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          reason,
          reasonDhivehi,
          markedByUserId: currentUser?.id || 'staff-1',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsSchoolClosed(true);
        const reasonStr = data.reason || reason;
        const reasonDvStr = data.reasonDhivehi || reasonDhivehi || '';
        setSchoolClosureReason(reasonStr);
        setSchoolClosureReasonDhivehi(reasonDvStr);
        setClosureDetails({
          reason: reasonStr,
          reasonDhivehi: reasonDvStr,
          formattedLabel: data.formattedClosureLabel,
          formattedLabelDhivehi: data.formattedClosureLabelDhivehi,
          source: 'PORTAL_MANUAL_CONTINGENCY',
        });
        await fetchAttendance();
        await fetchMoEStats();
        await fetchAuditLogs();
        const calRes = await fetch('/api/calendar');
        if (calRes.ok) {
          const cData = await calRes.json();
          setCalendarDays(cData.calendar || []);
        }
      }
    } catch (err) {
      console.error('Failed to declare school closed:', err);
    }
  };

  const handleReopenSchoolDay = async () => {
    setIsSchoolClosed(false);
    setSchoolClosureReason('');
    setSchoolClosureReasonDhivehi('');
    setClosureDetails(undefined);
    setManuallyReopenedDates((prev) => new Set(prev).add(selectedDate));
    try {
      const res = await fetch('/api/school/reopen-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          markedByUserId: currentUser?.id || 'staff-1',
        }),
      });
      if (res.ok) {
        await fetchAttendance();
        await fetchMoEStats();
        await fetchAuditLogs();
        const calRes = await fetch('/api/calendar');
        if (calRes.ok) {
          const cData = await calRes.json();
          setCalendarDays(cData.calendar || []);
        }
      }
    } catch (err) {
      console.warn('Reopen school day deferred/offline:', err);
    }
  };

  const handleSubmitSession = async () => {
    const eligibility = checkSessionMarkingEligibility(selectedDate, selectedSession, sessionTimings);
    if (!eligibility.allowed && !isUserPrivilegedForSession(eligibility.reason)) {
      showNotification(eligibility.message, 'warning');
      return;
    }
    try {
      const res = await fetch('/api/attendance/submit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          session: selectedSession,
          grade: selectedGrade,
          submittedByUserId: currentUser?.id || 'staff-1',
        }),
      });
      if (res.ok) {
        setIsSessionSubmitted(true);
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('school_portal_sync');
            channel.postMessage({ type: 'SESSION_SUBMITTED', date: selectedDate, session: selectedSession });
            channel.close();
          }
        } catch {}
        await fetchAttendance();
        await fetchMoEStats();
        await fetchAuditLogs();
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.message || 'Failed to submit session.', 'error');
      }
    } catch (err) {
      console.error('Failed to submit session:', err);
    }
  };

  const handleRevertSession = async (reason: string) => {
    try {
      const res = await fetch('/api/attendance/revert-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          session: selectedSession,
          reason,
          requesterEmail: currentUser?.email,
          requesterUserId: currentUser?.id,
        }),
      });
      if (res.ok) {
        setIsSessionSubmitted(false);
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('school_portal_sync');
            channel.postMessage({ type: 'SESSION_REVERTED', date: selectedDate, session: selectedSession });
            channel.close();
          }
        } catch {}
        await fetchAttendance();
        await fetchMoEStats();
        await fetchAuditLogs();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to revert session');
      }
    } catch (err) {
      console.error('Failed to revert session:', err);
      throw err;
    }
  };

  const handleRevertRecord = async (params: {
    studentId: string;
    newStatus: AttendanceStatus;
    leaveReason?: LeaveReason;
    arrivalTime?: string;
    reason: string;
  }) => {
    try {
      const res = await fetch('/api/attendance/revert-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: params.studentId,
          date: selectedDate,
          sessionType: selectedSession,
          newStatus: params.newStatus,
          leaveReason: params.leaveReason,
          arrivalTime: params.arrivalTime,
          reason: params.reason,
          requesterEmail: currentUser?.email,
          requesterUserId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedRec = data.record;
        setAttendanceRecords((prev) => {
          const idx = prev.findIndex(
            (r) =>
              r.studentId === params.studentId &&
              r.date === selectedDate &&
              r.sessionType === selectedSession
          );
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedRec;
            return copy;
          }
          return [...prev, updatedRec];
        });
        await offlineDb.attendance.put({ ...updatedRec, syncStatus: 'SYNCED' });
        await fetchMoEStats();
        await fetchAuditLogs();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to revert attendance record');
      }
    } catch (err) {
      console.error('Failed to revert record:', err);
      throw err;
    }
  };

  const [showResetAttendanceModal, setShowResetAttendanceModal] = useState(false);
  const [isResettingAttendance, setIsResettingAttendance] = useState(false);
  const [hasConfirmedResetRisk, setHasConfirmedResetRisk] = useState(false);

  const handleResetAllAttendance = async () => {
    setIsResettingAttendance(true);
    try {
      // 1. Immediately wipe safeLocalStorage, IndexedDB and UI state locally so user is never blocked
      clearAllLocalAttendanceStores();
      try {
        await offlineDb.attendance.clear();
        await offlineDb.syncQueue.clear();
      } catch (e) {
        console.warn('Could not clear offlineDb:', e);
      }
      setAttendanceRecords([]);
      setCounterpartRecords([]);
      setIsSessionSubmitted(false);

      // 2. Notify server to wipe remote memory/disk store
      try {
        await fetch('/api/attendance/reset-all', {
          method: 'POST',
        });
      } catch (err) {
        console.warn('Remote reset deferred/offline:', err);
      }

      await fetchAttendance();
      await fetchMoEStats();
      await fetchAuditLogs();
      setShowResetAttendanceModal(false);
      setHasConfirmedResetRisk(false);
    } catch (err) {
      console.error('Failed to reset all attendance:', err);
    } finally {
      setIsResettingAttendance(false);
    }
  };

  const handleGoToPendingSession = (date: string, session: SessionType, grade?: string) => {
    setSelectedDate(date);
    setSelectedSession(session);
    if (grade && grade !== 'ALL') {
      setSelectedGrade(grade as GradeLevel);
    }
  };

  const handleSaveStudent = async (updatedStudent: Student) => {
    try {
      const res = await fetch(`/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update student');
      }

      const data = await res.json();
      const savedStudent: Student = data.student || updatedStudent;

      // Update in local state
      setStudents((prev) =>
        prev.map((s) => (s.id === savedStudent.id ? savedStudent : s))
      );

      // Cache in Dexie
      try {
        await offlineDb.students.put(savedStudent);
      } catch (dbErr) {
        console.warn('Dexie student cache update skipped:', dbErr);
      }

      // Re-fetch attendance records to reflect updated name
      await fetchAttendance();
      await fetchAuditLogs();
      setEditingStudent(null);
    } catch (err) {
      console.error('Failed to save student record:', err);
      throw err;
    }
  };

  const handleApplyVoiceMatches = async (
    matches: Array<{
      studentId?: string;
      studentName: string;
      studentNameDhivehi?: string;
      status: AttendanceRecord['status'];
      leaveReason?: AttendanceRecord['leaveReason'];
      arrivalTime?: string;
      remarks?: string;
    }>
  ) => {
    const eligibility = checkSessionMarkingEligibility(selectedDate, selectedSession, sessionTimings);
    if (!eligibility.allowed && !isUserPrivilegedForSession(eligibility.reason)) {
      showNotification(eligibility.message, 'warning');
      return;
    }

    const updatedRecords = [...attendanceRecords];
    let appliedCount = 0;

    for (const match of matches) {
      // 1. Direct match by studentId
      let student = match.studentId ? students.find((s) => s.id === match.studentId) : undefined;

      // 2. Fallback to name search across English and Dhivehi
      if (!student) {
        student = students.find((s) => {
          const matchNameEn = (s.fullName || '').toLowerCase();
          const matchNameDv = (s.fullNameDhivehi || '').trim();
          const queryName = (match.studentName || '').trim().toLowerCase();
          const queryNameRaw = (match.studentName || '').trim();
          const queryNameDv = (match.studentNameDhivehi || '').trim();
          return (
            (queryName && (matchNameEn.includes(queryName) || queryName.includes(matchNameEn))) ||
            (queryNameRaw && matchNameDv && (matchNameDv.includes(queryNameRaw) || queryNameRaw.includes(matchNameDv))) ||
            (queryNameDv && matchNameDv && (matchNameDv.includes(queryNameDv) || queryNameDv.includes(matchNameDv)))
          );
        });
      }

      if (student) {
        const record: AttendanceRecord = {
          id: `att-${student.id}-${selectedDate}-${selectedSession}`,
          studentId: student.id,
          date: selectedDate,
          sessionType: selectedSession,
          status: match.status,
          leaveReason: match.leaveReason || 'NONE',
          arrivalTime: match.arrivalTime,
          remarks: match.remarks,
          markedByUserId: currentUser?.id || 'staff-1',
          markedByUserName: currentUser?.fullName,
          syncStatus: 'PENDING_OFFLINE',
          updatedAt: new Date().toISOString(),
        };

        const idx = updatedRecords.findIndex((r) => r.studentId === student.id);
        if (idx >= 0) {
          updatedRecords[idx] = record;
        } else {
          updatedRecords.push(record);
        }

        await syncEngine.recordAttendance(record);
        appliedCount++;
      }
    }

    setAttendanceRecords(updatedRecords);
    fetchMoEStats();
    fetchAuditLogs();

    if (appliedCount > 0) {
      showNotification(
        isRTL
          ? `${appliedCount} ދަރިވަރުންގެ ހާޒިރީ އަދާހަމަކުރެވިއްޖެ`
          : `Successfully applied attendance for ${appliedCount} student(s) from voice note`,
        'info'
      );
    } else {
      showNotification(
        isRTL
          ? 'ދަރިވަރެއްގެ ރެކޯޑް ނުފެނުނު'
          : 'No matching student records found to update',
        'warning'
      );
    }
  };

  const handleOpenSmsDraft = (student: Student) => {
    setSmsStudent(student);
    setIsSmsModalOpen(true);
  };

  const handleLoginUser = (user: User) => {
    const isMobileLogin =
      Boolean(user.loginViaMobile) ||
      Boolean(user.hasRapidRollCallPrivilege) ||
      (typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true' ||
        safeLocalStorage.getItem('moe_login_source') === 'mobile'
      ));

    const privilegedUser: User = {
      ...user,
      hasRapidRollCallPrivilege: isMobileLogin ? true : user.hasRapidRollCallPrivilege,
      loginViaMobile: isMobileLogin ? true : user.loginViaMobile,
    };

    setCurrentUser(privilegedUser);
    setIsLoggedIn(true);
    setShowLoginView(false);
    setActiveTab('attendance'); // Prioritize Attendance tab on login
    safeLocalStorage.setItem('moe_portal_logged_in', 'true');
    safeLocalStorage.setItem('moe_active_user_id', user.id);
    safeLocalStorage.setItem('moe_logged_in_user', JSON.stringify(privilegedUser));
    if (isMobileLogin) {
      safeLocalStorage.setItem('moe_login_source', 'mobile');
      safeLocalStorage.setItem('moe_rapid_roll_call_privileged', 'true');
      safeLocalStorage.setItem('moe_default_roll_call_mode', 'rapid');
    }
    if (user.assignedGrade) {
      setSelectedGrade(user.assignedGrade);
    }
    // Inform backend of user switch while retaining client privileges
    fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        loginViaMobile: isMobileLogin,
        hasRapidRollCallPrivilege: isMobileLogin,
      }),
    }).catch(() => {});
    fetchAuditLogs();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    safeLocalStorage.removeItem('moe_portal_logged_in');
    safeLocalStorage.removeItem('moe_active_user_id');
    safeLocalStorage.removeItem('moe_logged_in_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowLoginView(true);
  };

  // If user requested staff login screen or hasn't logged in yet
  if (showLoginView || !isLoggedIn || !currentUser) {
    return (
      <MobileLoginView
        staffList={staffList}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onClose={isLoggedIn && currentUser ? () => setShowLoginView(false) : undefined}
        isModal={Boolean(isLoggedIn && currentUser)}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 ${isRTL ? 'font-thaana' : 'font-sans'}`}>
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        staffList={staffList}
        studentsCount={students.length}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLoginView={() => setShowLoginView(true)}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenSuperAdminPasswords={() => setIsSuperAdminModalOpen(true)}
        onResetAllAttendance={() => setShowResetAttendanceModal(true)}
        pendingExtraClassesCount={pendingExtraClassesCount}
        onOpenTimingsModal={handleOpenTimingsModal}
        onOpenOfflineQueueModal={() => setIsOfflineQueueModalOpen(true)}
        onManualSync={async () => {
          const res = await syncEngine.flushQueue();
          if (res.syncedCount > 0) {
            showNotification(
              isRTL
                ? `${res.syncedCount} ހާޒިރީ ރެކޯޑް ކާމިޔާބުކަމާއެކު ސާވަރަށް ސިންކްކުރެވިއްޖެ!`
                : `Successfully synced ${res.syncedCount} attendance records to server!`,
              'info'
            );
            await fetchAttendance();
            await fetchMoEStats();
          } else {
            setIsOfflineQueueModalOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 sm:pb-32 md:pb-8 space-y-5 sm:space-y-6">
        {/* Real-time Dashboard KPI Bar (visible across portal on desktop; hidden on mobile attendance to prioritize instant roll call) */}
        <div className={activeTab === 'attendance' ? 'hidden md:block' : 'block'}>
          <DashboardStats stats={stats} />
        </div>

        {/* View Switcher */}
        {activeTab === 'extra_classes' && (
          <ExtraClassesModule
            currentUser={currentUser}
            staffList={staffList}
            students={students}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceMatrix
            students={students}
            records={attendanceRecords}
            counterpartRecords={counterpartRecords}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onUpdateRecord={handleUpdateRecord}
            onBulkMarkPresent={handleBulkMarkPresent}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenSmsDraftModal={handleOpenSmsDraft}
            isWeekend={isWeekend}
            isSchoolClosed={isSchoolClosed}
            schoolClosureReason={schoolClosureReason || closureDetails?.reason}
            schoolClosureReasonDhivehi={schoolClosureReasonDhivehi || closureDetails?.reasonDhivehi}
            closureDetails={closureDetails}
            pendingPreviousSession={pendingPreviousSession}
            isSessionSubmitted={isSessionSubmitted}
            onDeclareSchoolClosed={handleDeclareSchoolClosed}
            onReopenSchoolDay={handleReopenSchoolDay}
            onSubmitSession={handleSubmitSession}
            onRevertSession={handleRevertSession}
            onRevertRecord={handleRevertRecord}
            onGoToPendingSession={handleGoToPendingSession}
            onEditStudent={(st) => setEditingStudent(st)}
            currentUser={currentUser}
            staffList={staffList}
            onSwitchStaff={handleSwitchUser}
            onOpenLoginView={() => setShowLoginView(true)}
            sessionTimings={sessionTimings}
            onUpdateSessionTimings={handleUpdateSessionTimings}
            onOpenTimingsModal={handleOpenTimingsModal}
            isLiveSyncActive={isLiveSyncActive}
            lastSyncTime={lastSyncTime}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts
            gradeStats={stats.gradeStats}
            activeLeavesCount={stats.activeLeavesCount}
            notInIslandCount={stats.notInIslandCount}
            sickLeaveCount={stats.sickLeaveCount}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsModule
            gradeStats={stats.gradeStats}
            students={students}
            records={attendanceRecords}
            selectedDate={selectedDate}
            selectedGrade={selectedGrade}
            currentUser={currentUser}
            onRefresh={() => {
              fetchMoEStats();
              fetchAttendance();
            }}
            overallRate={stats.overallAttendanceRate}
            activeLeaves={stats.activeLeavesCount}
            lateEntries={stats.lateEntriesCount}
            notInIsland={stats.notInIslandCount}
            totalDaysNeedToPresent={stats.totalDaysNeedToPresent}
            closedDaysDeducted={stats.closedDaysDeducted}
            isSchoolClosed={isSchoolClosed}
          />
        )}

        {activeTab === 'delegations' && (
          <SubstitutionModal
            staffList={staffList}
            delegations={delegations}
            onAssignDelegation={handleAssignDelegation}
            onUpdateDelegation={handleUpdateDelegation}
            onDeleteDelegation={handleDeleteDelegation}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'calendar' && (
          <AcademicCalendarModal
            calendar={calendarDays}
            onToggleDayType={handleToggleCalendarDay}
            onSaveHoliday={handleSaveHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            onRefreshCalendar={handleRefreshCalendar}
            onResetCalendar={handleResetCalendar}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('attendance');
            }}
            onClose={() => setActiveTab('attendance')}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantDrawer onClose={() => setActiveTab('attendance')} />
        )}

        {activeTab === 'audit' && (
          <AuditLogViewer logs={auditLogs} onRefresh={fetchAuditLogs} />
        )}

        {activeTab === 'schema' && <DatabaseSchemaViewer />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenMenuDrawer={() => setIsMenuDrawerOpen(true)}
        hasRapidRollCallPrivilege={Boolean(
          currentUser?.hasRapidRollCallPrivilege ||
          currentUser?.loginViaMobile ||
          (typeof window !== 'undefined' && safeLocalStorage.getItem('moe_rapid_roll_call_privileged') === 'true')
        )}
      />

      {/* Mobile More Modules Sheet / Drawer */}
      <MobileMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLoginView={() => setShowLoginView(true)}
        onOpenSuperAdminPasswords={() => setIsSuperAdminModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenTimingsModal={handleOpenTimingsModal}
        onLogout={handleLogout}
      />

      {/* Live Student & Staff Directory Sync Modal */}
      <MagoodhooSyncModal
        isOpen={isSyncModalOpen || activeTab === 'sync'}
        onClose={() => {
          setIsSyncModalOpen(false);
          if (activeTab === 'sync') setActiveTab('attendance');
        }}
        students={students}
        staff={staffList}
        onStudentsUpdated={(newStudents) => {
          setStudents(newStudents);
          fetchAttendance();
          fetchAuditLogs();
        }}
        onStaffUpdated={(newStaff) => {
          setStaffList(newStaff);
        }}
        onEditStudent={(st) => setEditingStudent(st)}
      />

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        targetGrade={selectedGrade}
        selectedDate={selectedDate}
        students={students}
        onApplyParsedAttendance={handleApplyVoiceMatches}
      />

      {/* Parent SMS Notification Modal */}
      <ParentSmsModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        student={smsStudent}
      />

      {/* Edit Student / Dhivehi Name Correction Modal */}
      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={handleSaveStudent}
        isRTL={isRTL}
      />

      {/* Global Session Timings & Duration Settings Modal */}
      <SessionTimingsModal
        isOpen={isTimingsModalOpen}
        onClose={() => setIsTimingsModalOpen(false)}
        currentTimings={sessionTimings}
        selectedDate={selectedDate}
        onSave={handleUpdateSessionTimings}
        onRefresh={fetchSessionTimings}
      />

      {/* Super Admin Staff Password Center Modal */}
      {isSuperAdminModalOpen && (
        <SuperAdminPasswordModal
          currentUser={currentUser}
          onClose={() => setIsSuperAdminModalOpen(false)}
          onStaffUpdated={async () => {
            const res = await fetch('/api/auth/staff');
            if (res.ok) {
              const data = await res.json();
              setStaffList(data.staff || []);
            }
          }}
        />
      )}

      {/* Staff Change Password Modal (Self-service or Compulsory on 1st Login) */}
      {(isChangePasswordModalOpen || Boolean(currentUser && (!currentUser.hasCustomPassword || currentUser.mustChangePassword) && !hasStaffLocalCustomPassword(currentUser.email))) && (
        <StaffChangePasswordModal
          currentUser={currentUser}
          isCompulsory={Boolean(currentUser && (!currentUser.hasCustomPassword || currentUser.mustChangePassword) && !hasStaffLocalCustomPassword(currentUser.email))}
          onLogout={handleLogout}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={() => {
            if (currentUser) {
              const updated = {
                ...currentUser,
                hasCustomPassword: true,
                mustChangePassword: false,
                isFirstLogin: false,
              };
              setCurrentUser(updated);
              safeLocalStorage.setItem('moe_logged_in_user', JSON.stringify(updated));
            }
            fetchAuditLogs();
          }}
        />
      )}

      {/* Reset All Attendance Confirmation Modal */}
      {showResetAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-rose-500/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* 1. High-Visibility Destructive Warning Status Bar across the very top */}
            <div className="relative">
              <div className="h-3 w-full bg-linear-to-r from-red-600 via-amber-500 to-rose-600 animate-pulse" />
              <div className="bg-rose-500/10 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{isRTL ? 'ނުރައްކާތެރި ޢަމަލެއް • އަނބުރާ ނުގެނެވޭނެ' : 'Destructive Action • Cannot Be Undone'}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetAttendanceModal(false);
                    setHasConfirmedResetRisk(false);
                  }}
                  disabled={isResettingAttendance}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Header with High-Visibility Warning Icon & Halo */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-600 flex items-center justify-center shrink-0 shadow-inner relative">
                  <AlertTriangle className="w-7 h-7 text-rose-600 stroke-[2.5]" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {isRTL ? 'ހުރިހާ ހާޒިރީ ރެކޯޑްތަކެއް ފޮހެލަންވީތަ؟' : 'Wipe & Reset All Attendance?'}
                  </h3>
                  <p className="text-xs text-rose-600 font-bold mt-1">
                    {isRTL ? 'މި ޢަމަލު ކުރުމަށްފަހު އެއްވެސް ޑޭޓާއެއް އަނބުރާ ނުހޯދޭނެއެވެ' : 'Destructive process: permanently erases all attendance history'}
                  </p>
                </div>
              </div>

              {/* 3. Irreversible Danger Callout Box */}
              <div className="rounded-2xl border-2 border-rose-300 bg-linear-to-b from-rose-50/90 to-red-50/60 p-4 text-xs space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-rose-950">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isRTL ? 'ސަމާލުކަން ދެއްވާ: މިއީ އަނބުރާ ނުގެނެވޭނެ ނިންމުމެކެވެ' : 'WARNING: Permanent System Reset'}</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 font-medium list-disc list-inside">
                  <li>
                    <strong className="text-slate-900">{isRTL ? 'ހުރިހާ ހާޒިރީއެއް ފޮހެވުން:' : 'Wipe all records:'}</strong>{' '}
                    {isRTL ? '215 ދަރިވަރުންގެ ހުރިހާ ދުވަހެއްގެ އަދި ދަންފަޅިތަކެއްގެ ހާޒިރީ މުޅިން ސާފުކުރެވޭނެއެވެ.' : 'All attendance marked for all 215 students will be permanently deleted.'}
                  </li>
                  <li>
                    <strong className="text-slate-900">{isRTL ? 'ސެޝަންތައް ހުޅުވާލުން:' : 'Unlock all sessions:'}</strong>{' '}
                    {isRTL ? 'ހުރިހާ ސެޝަނެއްގެ ފައިނަލް ސްޓޭޓަސް ރީސެޓްވެ، އާ ހާޒިރީ ޖެހުމަށް ތައްޔާރުވާނެއެވެ.' : 'All finalized/locked sessions will be unlocked and set to unmarked state.'}
                  </li>
                  <li>
                    <strong className="text-rose-700">{isRTL ? 'އަނބުރާ ނުގެނެވުން:' : 'Irreversible:'}</strong>{' '}
                    {isRTL ? 'މި ޢަމަލު ކުރުމަށްފަހު ފޮހެވުނު ޑޭޓާ އަލުން އަނބުރާ ނުހޯދޭނެއެވެ.' : 'This process cannot be undone or rolled back.'}
                  </li>
                </ul>
              </div>

              {/* 4. Safety Confirmation Checkbox to Prevent Accidental Clicks */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-rose-300 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="acknowledge-destructive-risk-checkbox"
                  checked={hasConfirmedResetRisk}
                  onChange={(e) => setHasConfirmedResetRisk(e.target.checked)}
                  disabled={isResettingAttendance}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-slate-800 leading-snug">
                  {isRTL
                    ? 'އަޅުގަނޑު މި ޢަމަލުގެ ނުރައްކާތެރިކަން ދެނެގަނެ، ހުރިހާ ހާޒިރީއެއް ފޮހެލުމަށް އެއްބަސްވަމެވެ.'
                    : 'I acknowledge that this process is destructive, cannot be undone, and permanently wipes all recorded attendance.'}
                </span>
              </label>

              {/* 5. Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetAttendanceModal(false);
                    setHasConfirmedResetRisk(false);
                  }}
                  disabled={isResettingAttendance}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition cursor-pointer min-h-[42px]"
                >
                  {isRTL ? 'ކެންސަލް' : 'Cancel'}
                </button>
                <button
                  type="button"
                  id="confirm-reset-all-attendance-btn"
                  onClick={handleResetAllAttendance}
                  disabled={isResettingAttendance || !hasConfirmedResetRisk}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 min-h-[42px] ${
                    hasConfirmedResetRisk && !isResettingAttendance
                      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/30 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
                  }`}
                  title={!hasConfirmedResetRisk ? (isRTL ? 'ފުރަތަމަ ޗެކްބޮކްސް ފާހަގަކުރައްވާ' : 'Please check the acknowledgment box above to enable') : undefined}
                >
                  {isResettingAttendance ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{isRTL ? 'ފޮހެމުންދަނީ...' : 'Wiping All Attendance...'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                      <span>{isRTL ? 'އާނ، ހުރިހާ ހާޒިރީއެއް ފޮހެލާ' : 'I Understand, Reset All Attendance'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Attendance Queue Manager Modal */}
      <OfflineQueueModal
        isOpen={isOfflineQueueModalOpen}
        onClose={() => setIsOfflineQueueModalOpen(false)}
        pendingCount={stats?.pendingOfflineCount || 0}
        onSyncComplete={async () => {
          await fetchAttendance();
          await fetchMoEStats();
        }}
      />

      {/* In-App Floating Toast Notification (replaces native window.alert to prevent iframe/sandbox crashes) */}
      {toastNotification && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold backdrop-blur-md ${
              toastNotification.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-900/30'
                : toastNotification.type === 'warning'
                ? 'bg-amber-900/95 text-amber-50 border-amber-700 shadow-amber-900/30'
                : 'bg-teal-900/95 text-teal-50 border-teal-700 shadow-teal-900/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${
                  toastNotification.type === 'error'
                    ? 'text-rose-300'
                    : toastNotification.type === 'warning'
                    ? 'text-amber-300'
                    : 'text-teal-300'
                }`}
              />
              <span className="leading-snug">{toastNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition cursor-pointer text-white/80 hover:text-white shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Mode & Sync Notification Floating Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
