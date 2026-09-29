import React, { useState, useEffect } from 'react';
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
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { ExtraClassesModule } from './components/ExtraClassesModule';
import { syncEngine } from './lib/syncEngine';
import { offlineDb } from './lib/db';
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
} from './types';

function MainApp() {
  const { t, isRTL } = useLanguage();

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('attendance');

  // Core Data State
  const [staffList, setStaffList] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [counterpartRecords, setCounterpartRecords] = useState<AttendanceRecord[]>([]);
  const [calendarDays, setCalendarDays] = useState<AcademicCalendarDay[]>([]);
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

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'ALL'>('Grade 4');
  const [selectedSession, setSelectedSession] = useState<SessionType>('MORNING_BEFORE_BREAK');

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

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [smsStudent, setSmsStudent] = useState<Student | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Mobile Navigation & Login View State
  const [showLoginView, setShowLoginView] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const valid = localStorage.getItem('moe_portal_logged_in');
    if (valid === null) return true; // Default logged in on first load so portal is immediately functional
    return valid === 'true';
  });

  // Check if chosen date is Maldives weekend (Friday=5, Saturday=6)
  const isWeekend = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const day = d.getDay();
    return day === 5 || day === 6;
  })();

  // 1. Initial Load: Fetch from API and sync with Dexie cache
  useEffect(() => {
    initData();
  }, []);

  // 2. Refresh attendance whenever date, grade, or session changes
  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedGrade, selectedSession]);

  const initData = async () => {
    try {
      // 1. Fetch Staff
      const staffRes = await fetch('/api/auth/staff');
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
        const savedId = localStorage.getItem('moe_active_user_id');
        const isSessionValid = localStorage.getItem('moe_portal_logged_in');
        if (isSessionValid === 'true' && savedId) {
          const active = data.staff?.find((s: User) => s.id === savedId);
          if (active) {
            setCurrentUser(active);
            setIsLoggedIn(true);
            if (active.assignedGrade) {
              setSelectedGrade(active.assignedGrade);
            }
          } else {
            const defaultUser = data.staff?.[0];
            if (defaultUser) {
              setCurrentUser(defaultUser);
              setIsLoggedIn(true);
              localStorage.setItem('moe_active_user_id', defaultUser.id);
              localStorage.setItem('moe_portal_logged_in', 'true');
              if (defaultUser.assignedGrade) setSelectedGrade(defaultUser.assignedGrade);
            }
          }
        } else if (isSessionValid !== 'false') {
          // First time opening on this browser or PC - auto select lead staff/principal
          const defaultUser = data.staff?.[0];
          if (defaultUser) {
            setCurrentUser(defaultUser);
            setIsLoggedIn(true);
            localStorage.setItem('moe_active_user_id', defaultUser.id);
            localStorage.setItem('moe_portal_logged_in', 'true');
            if (defaultUser.assignedGrade) setSelectedGrade(defaultUser.assignedGrade);
          }
        }
      }

      // 2. Fetch Students
      const studentRes = await fetch('/api/students');
      if (studentRes.ok) {
        const sData = await studentRes.json();
        setStudents(sData.students || []);
        // Cache in Dexie for offline readiness
        if (sData.students?.length > 0) {
          await offlineDb.students.bulkPut(sData.students);
        }
      } else {
        // Load from Dexie cache if offline
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
            const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
            if (clientDeleted.length > 0) {
              calList = calList.filter((d) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
            }
          } catch (e) {}
          setCalendarDays(calList);
          try {
            localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
            await offlineDb.calendar.clear();
            if (calList.length > 0) {
              await offlineDb.calendar.bulkPut(calList);
            }
          } catch (e) {}
        } else {
          const cached = localStorage.getItem('moe_academic_calendar');
          if (cached) {
            let parsed = JSON.parse(cached);
            try {
              const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
              if (clientDeleted.length > 0) {
                parsed = parsed.filter((d: AcademicCalendarDay) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
              }
            } catch (e) {}
            setCalendarDays(parsed);
          }
        }
      } catch (e) {
        const cached = localStorage.getItem('moe_academic_calendar');
        if (cached) {
          let parsed = JSON.parse(cached);
          try {
            const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
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
    } catch (err) {
      console.warn('Network offline or backend warm-up, reading from offline cache', err);
      const cached = await offlineDb.students.toArray();
      if (cached.length > 0) setStudents(cached);
    }
  };

  const fetchAttendance = async () => {
    try {
      // First flush any pending offline-queued attendance records if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await syncEngine.flushQueue();
        } catch (e) {
          console.warn('Pre-fetch sync flush deferred:', e);
        }
      }

      const url = `/api/attendance?date=${selectedDate}&grade=${selectedGrade}&session=${selectedSession}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
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
        setPendingPreviousSession(data.pendingPreviousSession || null);
        setIsSessionSubmitted(Boolean(data.isSessionSubmitted));
      } else {
        // Fetch from Dexie offline
        const local = await offlineDb.attendance
          .where('date')
          .equals(selectedDate)
          .and((r) => r.sessionType === selectedSession)
          .toArray();
        if (local.length > 0) {
          setAttendanceRecords(local);
        }
      }
    } catch {
      const local = await offlineDb.attendance
        .where('date')
        .equals(selectedDate)
        .and((r) => r.sessionType === selectedSession)
        .toArray();
      if (local.length > 0) setAttendanceRecords(local);
    }
  };

  const fetchMoEStats = async () => {
    try {
      const res = await fetch(`/api/reports/moe?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch MoE stats:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Handlers for Mutations
  const handleUpdateRecord = async (record: AttendanceRecord) => {
    const enrichedRecord: AttendanceRecord = {
      ...record,
      markedByUserId: record.markedByUserId || currentUser?.id || 'staff-1',
      markedByUserName: record.markedByUserName || currentUser?.fullName,
    };

    // 1. Optimistic UI update
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.studentId === enrichedRecord.studentId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = enrichedRecord;
        return updated;
      }
      return [...prev, enrichedRecord];
    });

    // 2. Direct fast-path sync to server API with offline fallback
    try {
      const res = await fetch('/api/attendance/single', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: enrichedRecord }),
      });
      if (res.ok) {
        const resData = await res.json();
        const savedRec = resData.record || enrichedRecord;
        await offlineDb.attendance.put({ ...savedRec, syncStatus: 'SYNCED' });
      } else {
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
      if (onlyUnmarked && existing && (existing.status === 'ABSENT' || existing.status === 'LATE' || existing.status === 'LEAVE')) {
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
    setAttendanceRecords([...otherRecords, ...updatedRecords]);

    // Direct fast-path sync to server API with offline fallback
    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: updatedRecords }),
      });
      if (res.ok) {
        await offlineDb.attendance.bulkPut(updatedRecords);
        setIsSessionSubmitted(true);
      } else {
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
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
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
          const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
          if (clientDeleted.length > 0) {
            calList = calList.filter((d) => !clientDeleted.includes(d.id) && !clientDeleted.includes(d.date));
          }
        } catch (e) {}
        setCalendarDays(calList);
        try {
          localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
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
          localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
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
          const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
          const filtered = clientDeleted.filter((x) => x !== holiday.id && x !== holiday.date);
          localStorage.setItem('moe_deleted_holidays', JSON.stringify(filtered));
        } catch (e) {}
        try {
          localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
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
        const clientDeleted: string[] = JSON.parse(localStorage.getItem('moe_deleted_holidays') || '[]');
        if (!clientDeleted.includes(id)) {
          clientDeleted.push(id);
          localStorage.setItem('moe_deleted_holidays', JSON.stringify(clientDeleted));
        }
      } catch (e) {}

      setCalendarDays((prev) => {
        const updated = prev.filter((d) => d.id !== id && d.date !== id);
        try {
          localStorage.setItem('moe_academic_calendar', JSON.stringify(updated));
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
          localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
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
        localStorage.removeItem('moe_deleted_holidays');
      } catch (e) {}
      const res = await fetch('/api/calendar/reset', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        const calList = data.calendar || [];
        setCalendarDays(calList);
        try {
          localStorage.setItem('moe_academic_calendar', JSON.stringify(calList));
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
        setIsSchoolClosed(false);
        setSchoolClosureReason('');
        setSchoolClosureReasonDhivehi('');
        setClosureDetails(undefined);
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
      console.error('Failed to reopen school day:', err);
    }
  };

  const handleSubmitSession = async () => {
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
        await fetchAttendance();
        await fetchMoEStats();
        await fetchAuditLogs();
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
      studentName: string;
      status: AttendanceRecord['status'];
      leaveReason?: AttendanceRecord['leaveReason'];
      arrivalTime?: string;
    }>
  ) => {
    const updatedRecords = [...attendanceRecords];

    for (const match of matches) {
      const student = students.find((s) => {
        const matchName = s.fullName.toLowerCase();
        const queryName = match.studentName.toLowerCase();
        return matchName.includes(queryName) || queryName.includes(matchName);
      });

      if (student) {
        const record: AttendanceRecord = {
          id: `att-${student.id}-${selectedDate}-${selectedSession}`,
          studentId: student.id,
          date: selectedDate,
          sessionType: selectedSession,
          status: match.status,
          leaveReason: match.leaveReason || 'NONE',
          arrivalTime: match.arrivalTime,
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
      }
    }

    setAttendanceRecords(updatedRecords);
    fetchMoEStats();
    fetchAuditLogs();
  };

  const handleOpenSmsDraft = (student: Student) => {
    setSmsStudent(student);
    setIsSmsModalOpen(true);
  };

  const handleLoginUser = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLoginView(false);
    localStorage.setItem('moe_portal_logged_in', 'true');
    localStorage.setItem('moe_active_user_id', user.id);
    localStorage.setItem('moe_logged_in_user', JSON.stringify(user));
    if (user.assignedGrade) {
      setSelectedGrade(user.assignedGrade);
    }
    handleSwitchUser(user.id);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('moe_portal_logged_in');
    localStorage.removeItem('moe_active_user_id');
    localStorage.removeItem('moe_logged_in_user');
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
        pendingExtraClassesCount={pendingExtraClassesCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 sm:pb-32 md:pb-8 space-y-5 sm:space-y-6">
        {/* Real-time Dashboard KPI Bar (visible across portal) */}
        <DashboardStats stats={stats} />

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
          />
        )}

        {activeTab === 'ai' && <AIAssistantDrawer />}

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
        onLogout={handleLogout}
        onManualSync={async () => {
          await syncEngine.flushQueue();
        }}
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

      {/* Staff Self-Service Change Password Modal */}
      {isChangePasswordModalOpen && (
        <StaffChangePasswordModal
          currentUser={currentUser}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={() => {
            fetchAuditLogs();
          }}
        />
      )}
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
