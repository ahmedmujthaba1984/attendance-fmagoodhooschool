import {
  Student,
  AttendanceRecord,
  StudentAttendanceReport,
  ClassAttendanceReport,
  ReportPeriodType,
  AttendanceReportMode,
  AcademicCalendarDay,
  GradeLevel,
} from '../types';
import { ALL_ACADEMIC_WEEKS_2026, getCurrentOrLatestSchoolWeek } from './academicWeeks';

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_DV = ['އާދީއްތަ', 'ހޯމަ', 'އަންގާރަ', 'ބުދަ', 'ބުރާސްފަތި', 'ހުކުރު', 'ހޮނިހިރު'];

export function getClientSchoolDatesBetween(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  let guard = 0;
  while (curr <= end && guard < 366) {
    const day = curr.getUTCDay();
    // Maldives school days: Sunday(0) to Thursday(4)
    if (day !== 5 && day !== 6) {
      dates.push(curr.toISOString().slice(0, 10));
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
    guard++;
  }
  return dates;
}

export function generateClientStudentReport({
  student,
  period = 'monthly',
  year = 2026,
  month = 9,
  weekStart,
  startDate,
  endDate,
  reportMode = 'BOTH',
  records = [],
  calendarDays = [],
}: {
  student: Student;
  period?: ReportPeriodType;
  year?: number;
  month?: number;
  weekStart?: string;
  startDate?: string;
  endDate?: string;
  reportMode?: AttendanceReportMode;
  records?: AttendanceRecord[];
  calendarDays?: AcademicCalendarDay[];
}): StudentAttendanceReport {
  let sDate = '2026-09-01';
  let eDate = '2026-09-30';

  if (period === 'daily') {
    sDate = startDate || '2026-09-30';
    eDate = sDate;
  } else if (period === 'weekly') {
    const curWeek = weekStart || getCurrentOrLatestSchoolWeek().startDate;
    sDate = curWeek;
    const cur = new Date(sDate + 'T00:00:00Z');
    cur.setUTCDate(cur.getUTCDate() + 4);
    eDate = cur.toISOString().slice(0, 10);
  } else if (period === 'monthly') {
    const mStr = String(month).padStart(2, '0');
    sDate = `${year}-${mStr}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    eDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
  } else if (period === 'yearly') {
    sDate = `${year}-01-11`;
    eDate = `${year}-12-17`;
  } else if (period === 'custom' && startDate && endDate) {
    sDate = startDate;
    eDate = endDate;
  }

  const schoolDates = getClientSchoolDatesBetween(sDate, eDate);

  // Student specific records map: `${date}_${sessionType}` -> AttendanceRecord
  const studentRecsMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.studentId === student.id) {
      studentRecsMap.set(`${r.date}_${r.sessionType}`, r);
    }
  });

  const dailyRecords: any[] = [];
  let morningPresentDays = 0;
  let morningLateDays = 0;
  let morningLeaveDays = 0;
  let morningAbsentDays = 0;
  let morningRecordedCount = 0;

  let afternoonPresentDays = 0;
  let afternoonLateDays = 0;
  let afternoonLeaveDays = 0;
  let afternoonAbsentDays = 0;
  let afternoonRecordedCount = 0;

  let closedDays = 0;

  schoolDates.forEach((d) => {
    const dayIndex = new Date(d + 'T00:00:00Z').getUTCDay();
    const dayOfWeek = DAY_NAMES_EN[dayIndex];

    const calDay = calendarDays.find((cd) => cd.date === d);
    const isClosed = calDay ? ['PUBLIC_HOLIDAY', 'TERM_BREAK', 'SCHOOL_CLOSED', 'SCHOOL_CLOSED_WEATHER', 'NON_TEACHING_DAY'].includes(calDay.dayType) : false;

    if (isClosed) {
      closedDays++;
      dailyRecords.push({
        date: d,
        dayOfWeek,
        morningStatus: 'SCHOOL_CLOSED',
        morningLeaveReason: 'OFFICIAL_DUTY',
        postBreakStatus: 'SCHOOL_CLOSED',
        postBreakLeaveReason: 'OFFICIAL_DUTY',
        isClosed: true,
        closureReason: calDay?.description || 'School Closed',
        extraClasses: [],
      });
      return;
    }

    const mRec = studentRecsMap.get(`${d}_MORNING_BEFORE_BREAK`);
    const pRec = studentRecsMap.get(`${d}_POST_BREAK`);

    if (mRec && mRec.status) {
      morningRecordedCount++;
      if (mRec.status === 'PRESENT') morningPresentDays++;
      else if (mRec.status === 'LATE') morningLateDays++;
      else if (mRec.status === 'LEAVE') morningLeaveDays++;
      else if (mRec.status === 'ABSENT') morningAbsentDays++;
    }

    if (pRec && pRec.status) {
      afternoonRecordedCount++;
      if (pRec.status === 'PRESENT') afternoonPresentDays++;
      else if (pRec.status === 'LATE') afternoonLateDays++;
      else if (pRec.status === 'LEAVE') afternoonLeaveDays++;
      else if (pRec.status === 'ABSENT') afternoonAbsentDays++;
    }

    dailyRecords.push({
      date: d,
      dayOfWeek,
      morningStatus: mRec?.status,
      morningLeaveReason: mRec?.leaveReason || 'NONE',
      morningArrivalTime: mRec?.arrivalTime,
      postBreakStatus: pRec?.status,
      postBreakLeaveReason: pRec?.leaveReason || 'NONE',
      isClosed: false,
      closureReason: undefined,
      extraClasses: [],
    });
  });

  const totalSchoolDays = schoolDates.length;
  const instructionalDays = Math.max(1, totalSchoolDays - closedDays);

  const officialSessions = morningRecordedCount + afternoonRecordedCount;
  const officialPresentSessions =
    morningPresentDays + morningLateDays + afternoonPresentDays + afternoonLateDays;
  const officialAttendanceRate = officialSessions > 0
    ? Math.min(100, Math.round((officialPresentSessions / officialSessions) * 100))
    : null;
  const morningAttendanceRate = morningRecordedCount > 0
    ? Math.min(100, Math.round(((morningPresentDays + morningLateDays) / morningRecordedCount) * 100))
    : null;
  const afternoonAttendanceRate = afternoonRecordedCount > 0
    ? Math.min(100, Math.round(((afternoonPresentDays + afternoonLateDays) / afternoonRecordedCount) * 100))
    : null;

  const displayRate =
    reportMode === 'MORNING'
      ? morningAttendanceRate
      : reportMode === 'AFTERNOON'
      ? afternoonAttendanceRate
      : officialAttendanceRate;

  const moeStatus = (displayRate != null && displayRate >= 90)
    ? 'EXEMPLARY'
    : (displayRate != null && displayRate >= 80)
    ? 'SATISFACTORY'
    : 'AT_RISK';

  return {
    student,
    period,
    reportMode,
    startDate: sDate,
    endDate: eDate,
    totalSchoolDays,
    instructionalDays,
    closedDays,
    morningPresentDays,
    morningLateDays,
    morningLeaveDays,
    morningAbsentDays,
    morningAttendanceRate,
    afternoonPresentDays,
    afternoonLateDays,
    afternoonLeaveDays,
    afternoonAbsentDays,
    afternoonAttendanceRate,
    presentDays: reportMode === 'MORNING' ? morningPresentDays : reportMode === 'AFTERNOON' ? afternoonPresentDays : morningPresentDays + afternoonPresentDays,
    lateDays: reportMode === 'MORNING' ? morningLateDays : reportMode === 'AFTERNOON' ? afternoonLateDays : morningLateDays + afternoonLateDays,
    leaveDays: reportMode === 'MORNING' ? morningLeaveDays : reportMode === 'AFTERNOON' ? afternoonLeaveDays : morningLeaveDays + afternoonLeaveDays,
    absentDays: reportMode === 'MORNING' ? morningAbsentDays : reportMode === 'AFTERNOON' ? afternoonAbsentDays : morningAbsentDays + afternoonAbsentDays,
    officialAttendanceRate,
    combinedAttendanceRate: officialAttendanceRate,
    totalExtraClasses: 0,
    extraClassPresent: 0,
    extraClassLate: 0,
    extraClassLeave: 0,
    extraClassAbsent: 0,
    extraClassAttendanceRate: null,
    combinedTotalSessions: officialSessions,
    combinedPresentSessions: officialPresentSessions,
    moeStatus,
    attendanceRate: displayRate ?? undefined,
    dailyRecords,
    extraClassLogs: [],
  };
}

export function generateClientClassReport({
  grade,
  students = [],
  period = 'monthly',
  year = 2026,
  month = 9,
  weekStart,
  startDate,
  endDate,
  reportMode = 'BOTH',
  records = [],
  calendarDays = [],
}: {
  grade: GradeLevel | 'ALL';
  students: Student[];
  period?: ReportPeriodType;
  year?: number;
  month?: number;
  weekStart?: string;
  startDate?: string;
  endDate?: string;
  reportMode?: AttendanceReportMode;
  records?: AttendanceRecord[];
  calendarDays?: AcademicCalendarDay[];
}): ClassAttendanceReport {
  let sDate = '2026-09-01';
  let eDate = '2026-09-30';

  if (period === 'daily') {
    sDate = startDate || '2026-09-30';
    eDate = sDate;
  } else if (period === 'weekly') {
    const curWeek = weekStart || getCurrentOrLatestSchoolWeek().startDate;
    sDate = curWeek;
    const cur = new Date(sDate + 'T00:00:00Z');
    cur.setUTCDate(cur.getUTCDate() + 4);
    eDate = cur.toISOString().slice(0, 10);
  } else if (period === 'monthly') {
    const mStr = String(month).padStart(2, '0');
    sDate = `${year}-${mStr}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    eDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
  } else if (period === 'yearly') {
    sDate = `${year}-01-11`;
    eDate = `${year}-12-17`;
  } else if (period === 'custom' && startDate && endDate) {
    sDate = startDate;
    eDate = endDate;
  }

  const targetStudents = grade === 'ALL'
    ? students
    : students.filter((s) => s.gradeLevel === grade);

  const boysCount = targetStudents.filter((s) => s.gender === 'MALE').length;
  const girlsCount = targetStudents.filter((s) => s.gender === 'FEMALE').length;
  const totalEnrolled = targetStudents.length;

  const schoolDates = getClientSchoolDatesBetween(sDate, eDate);
  const instructionalDays = schoolDates.length;

  // Student rows
  let perfectCount = 0;
  let chronicCount = 0;
  let totalPresSum = 0;
  let totalRecSum = 0;

  const studentRows = targetStudents.map((st) => {
    const rep = generateClientStudentReport({
      student: st,
      period,
      year,
      month,
      weekStart,
      startDate: sDate,
      endDate: eDate,
      reportMode,
      records,
      calendarDays,
    });

    const attRate = rep.officialAttendanceRate ?? rep.morningAttendanceRate ?? null;
    if (attRate !== null) {
      totalRecSum++;
      totalPresSum += attRate;
      if (attRate >= 100) perfectCount++;
      if (attRate < 80) chronicCount++;
    }

    return {
      id: st.id,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      fullNameDhivehi: st.fullNameDhivehi || st.fullName,
      gender: st.gender,
      gradeLevel: st.gradeLevel,
      totalDays: rep.totalSchoolDays,
      instructionalDays: rep.instructionalDays,
      presentCount: rep.presentDays,
      lateCount: rep.lateDays,
      leaveCount: rep.leaveDays,
      absentCount: rep.absentDays,
      attendanceRate: attRate,
      moeStatus: rep.moeStatus,
      morningRate: rep.morningAttendanceRate,
      morningPresent: rep.morningPresentDays,
      morningLate: rep.morningLateDays,
      morningLeave: rep.morningLeaveDays,
      morningAbsent: rep.morningAbsentDays,
      afternoonRate: rep.afternoonAttendanceRate,
      afternoonPresent: rep.afternoonPresentDays,
      afternoonLate: rep.afternoonLateDays,
      afternoonLeave: rep.afternoonLeaveDays,
      afternoonAbsent: rep.afternoonAbsentDays,
      officialRate: rep.officialAttendanceRate,
      extraClassCount: 0,
      extraClassAttended: 0,
      extraClassRate: null,
      combinedRate: rep.combinedAttendanceRate,
    };
  });

  const overallRate = totalRecSum > 0 ? Math.round(totalPresSum / totalRecSum) : null;

  return {
    grade,
    period,
    reportMode,
    startDate: sDate,
    endDate: eDate,
    totalEnrolled,
    boysCount,
    girlsCount,
    classTeacher: 'Class Lead Teacher',
    overallRate,
    morningOverallRate: overallRate,
    afternoonOverallRate: overallRate,
    officialOverallRate: overallRate,
    extraClassOverallRate: null,
    combinedOverallRate: overallRate,
    totalExtraClasses: 0,
    extraClassesHeld: [],
    instructionalDays,
    closedDays: 0,
    students: studentRows,
    chronicCount,
    perfectAttendanceCount: perfectCount,
  };
}

export function generateClientReportCardData({
  term = 'term2',
  grade = 'ALL',
  students = [],
  records = [],
  termConfigs = [],
  startDate,
  endDate,
}: {
  term?: string;
  grade?: string;
  students: Student[];
  records?: AttendanceRecord[];
  termConfigs?: any[];
  startDate?: string;
  endDate?: string;
}) {
  let sDate = startDate || '2026-08-09';
  let eDate = endDate || '2026-12-17';
  let termName = 'Term 2';
  let termNameDhivehi = 'ދެވަނަ ޓާމް';

  if (term === 'term1') {
    sDate = '2026-01-11';
    eDate = '2026-06-25';
    termName = 'Term 1';
    termNameDhivehi = 'ފުރަތަމަ ޓާމް';
  } else if (term === 'yearly') {
    sDate = '2026-01-11';
    eDate = '2026-12-17';
    termName = 'Full Academic Year';
    termNameDhivehi = 'އަހަރީ ޖުމްލަ';
  } else if (term === 'custom' && startDate && endDate) {
    sDate = startDate;
    eDate = endDate;
    termName = 'Custom Period';
    termNameDhivehi = 'ޚާއްޞަ މުއްދަތު';
  } else {
    const cfg = termConfigs.find((c: any) => c.id === term);
    if (cfg) {
      sDate = cfg.startDate;
      eDate = cfg.endDate;
      termName = cfg.name;
      termNameDhivehi = cfg.nameDhivehi;
    }
  }

  const schoolDates = getClientSchoolDatesBetween(sDate, eDate);
  const daysToBeAttended = Math.max(1, schoolDates.length);

  const targetStudents = grade === 'ALL'
    ? students
    : students.filter((s) => s.gradeLevel === grade);

  const studentRows = targetStudents.map((st) => {
    const studentRecs = records.filter(
      (r) => r.studentId === st.id && r.date >= sDate && r.date <= eDate
    );

    let daysAttended = 0;
    let daysLate = 0;
    let daysAbsent = 0;
    let daysLeave = 0;

    const countedDates = new Set<string>();
    studentRecs.forEach((r) => {
      if (!countedDates.has(r.date)) {
        if (r.status === 'PRESENT') {
          daysAttended++;
          countedDates.add(r.date);
        } else if (r.status === 'LATE') {
          daysAttended++;
          daysLate++;
          countedDates.add(r.date);
        } else if (r.status === 'LEAVE') {
          daysLeave++;
          countedDates.add(r.date);
        } else if (r.status === 'ABSENT') {
          daysAbsent++;
          countedDates.add(r.date);
        }
      }
    });

    const attendanceRate = daysToBeAttended > 0
      ? Math.min(100, Math.round((daysAttended / daysToBeAttended) * 100))
      : 0;

    return {
      studentId: st.id,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      fullNameDhivehi: st.fullNameDhivehi || st.fullName,
      gradeLevel: st.gradeLevel,
      gender: st.gender,
      daysToBeAttended,
      daysAttended,
      daysLate,
      daysAbsent,
      daysLeave,
      attendanceRate,
    };
  });

  const totalRate = studentRows.reduce((acc, curr) => acc + curr.attendanceRate, 0);
  const schoolAverageRate = studentRows.length > 0 ? Math.round(totalRate / studentRows.length) : 0;

  return {
    term,
    termName,
    termNameDhivehi,
    grade,
    startDate: sDate,
    endDate: eDate,
    daysToBeAttended,
    totalStudents: targetStudents.length,
    schoolAverageRate,
    students: studentRows,
  };
}
