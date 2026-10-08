// Core Data Models and Domain Types for Maldives School Attendance Portal

export type Role = 'ADMIN' | 'TEACHER';

export type DayType =
  | 'REGULAR_TEACHING_DAY'
  | 'REGULAR_SCHOOL'
  | 'WEEKEND_FRIDAY'
  | 'WEEKEND_SATURDAY'
  | 'PUBLIC_HOLIDAY'
  | 'NON_TEACHING_DAY'
  | 'TERM_BREAK'
  | 'EXAMINATION_DAY'
  | 'EXAM_DAY'
  | 'SPECIAL_ACTIVITY_DAY'
  | 'SCHOOL_CLOSED'
  | 'SCHOOL_CLOSED_WEATHER';

export type AcademicDayType = DayType;

export type SessionType = 'MORNING_BEFORE_BREAK' | 'POST_BREAK';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'SCHOOL_CLOSED';

export type SessionAttendanceStatus = 'PENDING' | 'SUBMITTED' | 'CLOSED';

export interface PendingAttendanceSession {
  date: string; // YYYY-MM-DD
  sessionType: SessionType;
  gradeLevel: GradeLevel | 'ALL';
  sessionName: string;
  sessionNameDhivehi: string;
  reason: string;
  reasonDhivehi: string;
}

export type LeaveReason =
  | 'NONE'
  | 'SICK_LEAVE'
  | 'SICK_LEAVE_MC'
  | 'NOT_IN_ISLAND'
  | 'OFFICIAL_DUTY'
  | 'OTHER';

export type SyncStatus = 'SYNCED' | 'PENDING_OFFLINE';

export interface SessionTimingConfig {
  startTime: string; // e.g. "07:45"
  endTime: string;   // e.g. "10:15"
  label?: string;
  labelDhivehi?: string;
}

export interface TemporarySessionOverride {
  id: string;
  date: string;          // YYYY-MM-DD
  endDate?: string;      // optional end date
  reason?: string;
  reasonDhivehi?: string;
  morning: SessionTimingConfig;
  afternoon: SessionTimingConfig;
  createdAt?: string;
}

export interface SchoolSessionTimings {
  normal?: {
    morning: SessionTimingConfig;
    afternoon: SessionTimingConfig;
  };
  morning: SessionTimingConfig;
  afternoon: SessionTimingConfig;
  temporaryOverrides?: TemporarySessionOverride[];
}

export type GradeLevel =
  | 'LKG'
  | 'UKG'
  | 'Grade 1'
  | 'Grade 2'
  | 'Grade 3'
  | 'Grade 4'
  | 'Grade 5'
  | 'Grade 6'
  | 'Grade 7'
  | 'Grade 8'
  | 'Grade 9'
  | 'Grade 10';

export interface User {
  id: string;
  username: string;
  fullName: string;
  fullNameDhivehi: string;
  role: Role;
  designation: string;
  designationDhivehi?: string;
  department?: string;
  staffId?: string;
  nationalId?: string;
  email?: string;
  phone?: string;
  primarySubject?: string;
  qualification?: string;
  teachingSubjectOrGrades?: string;
  assignedGrade?: GradeLevel;
  assignedGrades?: string[];
  isActive: boolean;
  isSuperAdmin?: boolean;
  hasCustomPassword?: boolean;
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  hasRapidRollCallPrivilege?: boolean;
  loginViaMobile?: boolean;
  passwordUpdatedAt?: string;
  createdAt: string;
}

export interface StaffPasswordInfo {
  id: string;
  staffId: string;
  fullName: string;
  fullNameDhivehi?: string;
  email: string;
  role: Role;
  designation: string;
  department?: string;
  hasCustomPassword: boolean;
  mustChangePassword?: boolean;
  isSuperAdmin: boolean;
  passwordUpdatedAt?: string;
}

export type Gender = 'MALE' | 'FEMALE';

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  fullNameDhivehi: string;
  gender: Gender;
  gradeLevel: GradeLevel;
  section: string;
  parentContactPhone: string;
  parentEmail?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';
  islandAddress?: string;
  guardianName?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  sessionType: SessionType;
  status: AttendanceStatus;
  leaveReason: LeaveReason;
  markedByUserId: string;
  markedByUserName?: string;
  arrivalTime?: string; // e.g. "07:55"
  remarks?: string;
  syncStatus: SyncStatus;
  clientSyncId?: string;
  updatedAt: string;
  revertedByUserId?: string;
  revertedByUserName?: string;
  revertedAt?: string;
  previousStatus?: AttendanceStatus;
  revertReason?: string;
}

export interface ClassDelegation {
  id: string;
  date: string; // YYYY-MM-DD
  originalTeacherId: string;
  substituteTeacherId: string;
  gradeLevel: GradeLevel;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface AcademicCalendarDay {
  id: string;
  date: string; // YYYY-MM-DD
  dayType: DayType;
  description: string;
  descriptionDhivehi: string;
  isManualOverride: boolean;
  updatedByUserId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  actionType: string;
  entityAffected: string;
  ipAddress?: string;
  details: string;
}

export interface OfflineQueueItem {
  id: string;
  clientSyncId: string;
  payload: AttendanceRecord;
  createdAt: number;
  retryCount: number;
}

export interface MoEGradeStat {
  grade: GradeLevel;
  totalEnrolled: number;
  morningPresent: number;
  morningAbsent: number;
  morningLate: number;
  morningLeave: number;
  postBreakPresent: number;
  postBreakAbsent: number;
  attendanceRate: number;
  chronicAbsenteesCount: number;
  // Extra class metrics
  extraClassesHeld?: number;
  extraClassAttended?: number;
  extraClassLate?: number;
  extraClassAbsent?: number;
  extraClassLeave?: number;
  extraClassRate?: number;
  // Combined metrics
  combinedRate?: number;
  combinedPresent?: number;
  combinedTotal?: number;
}

export interface DashboardTrendPoint {
  date: string;
  fullDate: string;
  morning: number;
  postBreak: number;
  officialRate: number;
  extraClassRate: number;
  extraClassesCount: number;
  combinedRate: number;
  baseline: number;
}

export interface AttendanceStatsSummary {
  totalStudents: number;
  overallAttendanceRate: number | null;
  officialAttendanceRate?: number | null;
  morningAttendanceRate: number | null;
  postBreakAttendanceRate: number | null;
  postBreakRecoveryRate: number | null;
  extraClassAttendanceRate?: number | null;
  combinedAttendanceRate?: number | null;
  totalExtraClasses?: number;
  activeLeavesCount: number;
  lateEntriesCount: number;
  pendingOfflineCount: number;
  notInIslandCount: number;
  sickLeaveCount: number;
  totalCalendarDays?: number;
  closedDaysDeducted?: number;
  totalDaysNeedToPresent?: number;
  isSchoolClosed?: boolean;
}

export interface AIPatternPrediction {
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  patternType: 'PRE_POST_WEEKEND_SPIKE' | 'CHRONIC_ABSENTEEISM' | 'POST_BREAK_DROP' | 'ISLAND_TRAVEL';
  attendanceRate: number;
  consecutiveAbsences: number;
  summary: string;
  recommendedAction: string;
}

export interface AIDailyBrief {
  date: string;
  headline: string;
  summary: string;
  keyHighlights: string[];
  weatherOrIslandContext: string;
  actionableInsights: string[];
}

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type ReportScopeType = 'overview' | 'student' | 'class' | 'weekly' | 'monthly' | 'yearly';
export type AttendanceReportMode = 'MORNING' | 'AFTERNOON' | 'EXTRA_CLASS' | 'BOTH' | 'OFFICIAL';

export interface StudentExtraClassAttendanceLog {
  extraClassId: string;
  title: string;
  titleDhivehi?: string;
  subject: string;
  subjectDhivehi?: string;
  gradeLevel: GradeLevel | string;
  date: string;
  startTime: string;
  endTime: string;
  venue?: string;
  venueDhivehi?: string;
  teacherName: string;
  teacherNameDhivehi?: string;
  status: AttendanceStatus;
  arrivalTime?: string;
  remarks?: string;
}

export interface StudentAttendanceDailyLog {
  date: string;
  dayOfWeek: string;
  morningStatus: AttendanceStatus;
  morningLeaveReason?: LeaveReason;
  morningArrivalTime?: string;
  postBreakStatus: AttendanceStatus;
  postBreakLeaveReason?: LeaveReason;
  isClosed: boolean;
  closureReason?: string;
  notes?: string;
  extraClasses?: StudentExtraClassAttendanceLog[];
}

export interface StudentAttendanceReport {
  student: Student;
  period: ReportPeriodType;
  reportMode?: AttendanceReportMode;
  startDate: string;
  endDate: string;
  totalSchoolDays: number;
  instructionalDays: number;
  closedDays: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  attendanceRate: number; // Primary display rate (conforms to reportMode: OFFICIAL, EXTRA_CLASS, or BOTH)
  moeStatus: 'EXEMPLARY' | 'SATISFACTORY' | 'AT_RISK';
  dailyRecords: StudentAttendanceDailyLog[];
  // Official sessions metrics (Morning & Afternoon)
  morningPresentDays?: number;
  morningLateDays?: number;
  morningLeaveDays?: number;
  morningAbsentDays?: number;
  morningAttendanceRate?: number;
  afternoonPresentDays?: number;
  afternoonLateDays?: number;
  afternoonLeaveDays?: number;
  afternoonAbsentDays?: number;
  afternoonAttendanceRate?: number;
  officialAttendanceRate?: number;
  // Extra classes metrics
  totalExtraClasses?: number;
  extraClassPresent?: number;
  extraClassLate?: number;
  extraClassLeave?: number;
  extraClassAbsent?: number;
  extraClassAttendanceRate?: number;
  extraClassLogs?: StudentExtraClassAttendanceLog[];
  // Combined metrics (Official + Extra Class)
  combinedTotalSessions?: number;
  combinedPresentSessions?: number;
  combinedAttendanceRate?: number;
}

export interface ClassStudentRow {
  id: string;
  admissionNumber: string;
  fullName: string;
  fullNameDhivehi?: string;
  gender: Gender;
  gradeLevel: GradeLevel;
  totalDays: number;
  instructionalDays: number;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  attendanceRate: number;
  moeStatus: 'EXEMPLARY' | 'SATISFACTORY' | 'AT_RISK';
  // Mode-specific metrics
  morningRate?: number;
  morningPresent?: number;
  morningLate?: number;
  morningLeave?: number;
  morningAbsent?: number;
  afternoonRate?: number;
  afternoonPresent?: number;
  afternoonLate?: number;
  afternoonLeave?: number;
  afternoonAbsent?: number;
  officialRate?: number;
  extraClassCount?: number;
  extraClassAttended?: number;
  extraClassRate?: number;
  combinedRate?: number;
}

export interface ClassAttendanceReport {
  grade: GradeLevel | 'ALL';
  period: ReportPeriodType;
  reportMode?: AttendanceReportMode;
  startDate: string;
  endDate: string;
  totalEnrolled: number;
  boysCount: number;
  girlsCount: number;
  classTeacher: string;
  overallRate: number;
  instructionalDays: number;
  closedDays: number;
  students: ClassStudentRow[];
  chronicCount: number;
  perfectAttendanceCount: number;
  // Multi-mode breakdown
  morningOverallRate?: number;
  afternoonOverallRate?: number;
  officialOverallRate?: number;
  extraClassOverallRate?: number;
  combinedOverallRate?: number;
  totalExtraClasses?: number;
  extraClassesHeld?: Array<{
    id: string;
    title: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    teacherName: string;
    attendedCount: number;
    totalEnrolled: number;
  }>;
}

export interface WeeklyDailyStat {
  date: string;
  dayOfWeek: string;
  dayName?: string;
  dayNameDhivehi?: string;
  isClosed: boolean;
  closureReason?: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalEnrolled?: number;
  rate: number;
}

export interface WeeklyGradeRow {
  grade: GradeLevel | string;
  sundayRate: number | null;
  mondayRate: number | null;
  tuesdayRate: number | null;
  wednesdayRate: number | null;
  thursdayRate: number | null;
  weeklyAverageRate: number | null;
}

export interface WeeklyAttendanceReport {
  weekNumber: number;
  weekTitle?: string;
  reportMode?: AttendanceReportMode;
  startDate: string; // Sunday
  endDate: string;   // Thursday
  overallRate: number | null;
  weeklyAverageRate: number | null;
  morningWeeklyRate?: number;
  afternoonWeeklyRate?: number;
  officialWeeklyRate?: number;
  extraClassWeeklyRate?: number;
  combinedWeeklyRate?: number;
  totalExtraClasses?: number;
  totalSchoolDays: number;
  instructionalDays: number;
  closedDays: number;
  bestClass?: string;
  dailyStats: WeeklyDailyStat[];
  dailyBreakdown: WeeklyDailyStat[];
  gradeMatrix: WeeklyGradeRow[];
  gradeRates: Array<{
    grade: GradeLevel;
    rates: Record<string, number>;
    weeklyAverage: number;
    extraClassRate?: number;
    officialRate?: number;
  }>;
  extraClassesHeld?: Array<{
    id: string;
    title: string;
    subject: string;
    date: string;
    gradeLevel: string;
    teacherName: string;
    attendedCount: number;
    totalEnrolled: number;
  }>;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  reportMode?: AttendanceReportMode;
  monthName: string;
  monthNameDhivehi: string;
  totalSchoolDays: number;
  instructionalDays: number;
  closedDays: number;
  overallRate: number | null;
  monthlyRate: number | null;
  morningMonthlyRate?: number;
  afternoonMonthlyRate?: number;
  officialMonthlyRate?: number;
  extraClassMonthlyRate?: number;
  combinedMonthlyRate?: number;
  totalExtraClasses?: number;
  enrolledStudents: number;
  weeklyBreakdown: Array<{
    weekLabel: string;
    instructionalDays: number;
    rate: number;
    officialRate?: number;
    extraClassRate?: number;
  }>;
  weeklyAverages: Array<{ weekLabel: string; rate: number }>;
  gradeBreakdown: Array<{
    grade: GradeLevel | string;
    enrolled: number;
    monthlyRate: number;
    officialRate?: number;
    extraClassRate?: number;
    combinedRate?: number;
    chronicCount: number;
  }>;
  gradeAverages: Array<{ grade: GradeLevel; rate: number; enrolled: number }>;
  dailyTrends: Array<{ date: string; rate: number; isClosed: boolean }>;
}

export interface YearlyAttendanceReport {
  academicYear: number;
  reportMode?: AttendanceReportMode;
  moeStandardDays: number;
  baseQuota: number;
  closedDaysDeducted: number;
  netRequiredDays: number;
  totalDaysNeedToPresent: number;
  overallCumulativeRate: number;
  annualAverageRate: number;
  morningAnnualRate?: number;
  afternoonAnnualRate?: number;
  officialAnnualRate?: number;
  extraClassAnnualRate?: number;
  combinedAnnualRate?: number;
  totalExtraClasses?: number;
  totalEnrolled: number;
  chronicAbsenteesCount: number;
  perfectAttendanceCount: number;
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    monthNameDhivehi: string;
    instructionalDays: number;
    closedDays: number;
    averageRate: number;
    rate: number;
    officialRate?: number;
    extraClassRate?: number;
  }>;
  gradeBreakdown: Array<{
    grade: GradeLevel | string;
    enrolled: number;
    annualRate: number;
    officialRate?: number;
    extraClassRate?: number;
    chronicCount: number;
    perfectAttendanceCount: number;
    perfectCount?: number;
  }>;
  gradeYearlyRates?: any[];
}

export type ExtraClassStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface ExtraClassAttendanceRecord {
  studentId: string;
  studentName?: string;
  studentNameDhivehi?: string;
  admissionNumber?: string;
  gradeLevel?: GradeLevel;
  status: AttendanceStatus; // PRESENT, ABSENT, LATE, LEAVE
  arrivalTime?: string; // e.g. "14:35"
  remarks?: string;
  markedAt?: string;
  markedByUserId?: string;
  markedByUserName?: string;
}

export interface ExtraClass {
  id: string;
  title: string;
  titleDhivehi?: string;
  subject: string;
  subjectDhivehi?: string;
  gradeLevel: GradeLevel | 'ALL';
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "15:30"
  venue?: string;
  venueDhivehi?: string;
  teacherId: string;
  teacherName: string;
  teacherNameDhivehi?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  status: ExtraClassStatus;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attendanceSubmitted?: boolean;
  attendanceSubmittedAt?: string;
  attendanceSubmittedBy?: string;
  attendanceRecords?: ExtraClassAttendanceRecord[];
  notes?: string;
  source?: 'MANUAL' | 'EXCEL_UPLOAD';
}

export interface TermDurationConfig {
  id: string; // 'term1' | 'term2' | 'yearly' | 'custom'
  name: string; // 'Term 1'
  nameDhivehi: string; // 'ފުރަތަމަ ޓާމް'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent?: boolean;
}

export interface StudentReportCardAttendance {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  fullNameDhivehi?: string;
  gradeLevel: GradeLevel;
  gender: 'MALE' | 'FEMALE';
  daysToBeAttended: number; // ހާޒިރުވާން ޖެހޭ ދުވަހުގެ އަދަދު
  daysAttended: number;     // ހާޒިރުވި ދުވަހުގެ އަދަދު
  daysLate: number;         // ގަޑިއަށް ނުދެވޭ ދުވަހުގެ އަދަދު
  daysAbsent: number;       // ޣައިރު ޙާޟިރު
  daysLeave: number;        // ސަލާމް
  attendanceRate: number;   // ޕަސެންޓް %
  customNotes?: string;
}

export interface ReportCardAttendanceResponse {
  term: string; // 'term1' | 'term2' | 'yearly' | 'custom'
  termName: string;
  termNameDhivehi: string;
  startDate: string;
  endDate: string;
  schoolName: string;
  schoolId: string;
  totalInstructionalDays: number;
  totalEnrolled: number;
  averageRate: number;
  termDurations: TermDurationConfig[];
  students: StudentReportCardAttendance[];
}


