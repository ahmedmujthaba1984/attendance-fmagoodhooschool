import {
  Student,
  AttendanceRecord,
  StudentAttendanceReport,
  ClassAttendanceReport,
  WeeklyAttendanceReport,
  MonthlyAttendanceReport,
  YearlyAttendanceReport,
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

export function getDeterministicStudentAttendance(student: Student, dateStr: string): {
  status: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
  postBreakStatus: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
  leaveReason: string;
  arrivalTime?: string;
} {
  const admNum = parseInt((student.admissionNumber || '').replace(/\D/g, ''), 10) || 100;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayHash = (y * 372 + m * 31 + d);
  const seed = Math.abs((admNum * 47 + dayHash * 29) % 1000);
  const isChronicStudent = (admNum % 41 === 0);
  const isPerfectStudent = (admNum % 29 === 0);

  let status: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT' = 'PRESENT';
  let leaveReason = 'NONE';
  let arrivalTime: string | undefined = '07:45';

  if (isPerfectStudent) {
    status = 'PRESENT';
    arrivalTime = '07:45';
  } else if (isChronicStudent) {
    if (seed < 120) {
      status = 'ABSENT';
      arrivalTime = undefined;
    } else if (seed < 220) {
      status = 'LEAVE';
      leaveReason = seed % 2 === 0 ? 'SICK_LEAVE' : 'NOT_IN_ISLAND';
      arrivalTime = undefined;
    } else if (seed < 320) {
      status = 'LATE';
      arrivalTime = seed % 2 === 0 ? '08:15' : '08:25';
    } else {
      status = 'PRESENT';
      arrivalTime = '07:45';
    }
  } else {
    if (seed < 18) {
      status = 'ABSENT';
      arrivalTime = undefined;
    } else if (seed < 38) {
      status = 'LEAVE';
      leaveReason = seed % 3 === 0 ? 'SICK_LEAVE' : seed % 3 === 1 ? 'SICK_LEAVE_MC' : 'NOT_IN_ISLAND';
      arrivalTime = undefined;
    } else if (seed < 68) {
      status = 'LATE';
      arrivalTime = seed % 2 === 0 ? '08:10' : '08:20';
    } else {
      status = 'PRESENT';
      arrivalTime = '07:45';
    }
  }

  let postBreakStatus: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT' = status;
  if (status === 'PRESENT') {
    if (seed > 985 && !isPerfectStudent) {
      postBreakStatus = 'ABSENT';
    }
  } else if (status === 'LATE') {
    postBreakStatus = 'PRESENT';
  } else if (status === 'LEAVE') {
    postBreakStatus = 'LEAVE';
  } else if (status === 'ABSENT') {
    postBreakStatus = 'ABSENT';
  }

  return {
    status,
    postBreakStatus,
    leaveReason,
    arrivalTime,
  };
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

    const finalMStatus = mRec?.status;
    const finalPStatus = pRec?.status;
    const finalMLeave = mRec?.leaveReason || 'NONE';
    const finalPLeave = pRec?.leaveReason || 'NONE';
    const finalArrival = mRec?.arrivalTime;

    if (finalMStatus) {
      morningRecordedCount++;
      if (finalMStatus === 'PRESENT') morningPresentDays++;
      else if (finalMStatus === 'LATE') morningLateDays++;
      else if (finalMStatus === 'LEAVE') morningLeaveDays++;
      else if (finalMStatus === 'ABSENT') morningAbsentDays++;
    }

    if (finalPStatus) {
      afternoonRecordedCount++;
      if (finalPStatus === 'PRESENT') afternoonPresentDays++;
      else if (finalPStatus === 'LATE') afternoonLateDays++;
      else if (finalPStatus === 'LEAVE') afternoonLeaveDays++;
      else if (finalPStatus === 'ABSENT') afternoonAbsentDays++;
    }

    dailyRecords.push({
      date: d,
      dayOfWeek,
      morningStatus: finalMStatus,
      morningLeaveReason: finalMLeave,
      morningArrivalTime: finalArrival,
      postBreakStatus: finalPStatus,
      postBreakLeaveReason: finalPLeave,
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
  const totalInstructionalDays = Math.max(1, schoolDates.length);
  const daysToBeAttended = totalInstructionalDays;

  // Retrieve any client-side saved overrides from localStorage
  let localOverrides: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('moe_report_card_overrides');
      if (saved) localOverrides = JSON.parse(saved);
    } catch {}
  }

  const targetStudents = grade === 'ALL'
    ? students
    : students.filter((s) => s.gradeLevel === grade);

  const studentRows = targetStudents.map((st, sIdx) => {
    // 1. Check for manual teacher override for this term & student
    const overrideKey = `${term}_${st.id}`;
    const override = localOverrides[overrideKey] || localOverrides[st.id];

    // 2. Check explicitly recorded attendance from active sessions
    const studentRecs = records.filter(
      (r) => r.studentId === st.id && r.date >= sDate && r.date <= eDate
    );

    let recPresent = 0;
    let recLate = 0;
    let recAbsent = 0;
    let recLeave = 0;

    const countedDates = new Set<string>();
    studentRecs.forEach((r) => {
      if (!countedDates.has(r.date)) {
        countedDates.add(r.date);
        if (r.status === 'PRESENT') recPresent++;
        else if (r.status === 'LATE') {
          recPresent++;
          recLate++;
        } else if (r.status === 'LEAVE') recLeave++;
        else if (r.status === 'ABSENT') recAbsent++;
      }
    });

    // 3. Compute attendance figures for the term based on actual records
    const hasAnyRecords = records.length > 0;
    let baseAttended = 0;
    let baseLate = 0;
    let baseLeave = 0;
    let baseAbsent = 0;

    if (hasAnyRecords) {
      baseAttended = recPresent + recLate;
      baseLate = recLate;
      baseLeave = recLeave;
      baseAbsent = recAbsent;
    }

    // Apply manual override if present
    const finalDaysToBeAttended = override?.daysToBeAttended !== undefined
      ? Number(override.daysToBeAttended)
      : totalInstructionalDays;

    const finalDaysAttended = override?.daysAttended !== undefined
      ? Number(override.daysAttended)
      : baseAttended;

    const finalDaysLate = override?.daysLate !== undefined
      ? Number(override.daysLate)
      : baseLate;

    const finalDaysAbsent = override?.daysAbsent !== undefined
      ? Number(override.daysAbsent)
      : baseAbsent;

    const finalDaysLeave = override?.daysLeave !== undefined
      ? Number(override.daysLeave)
      : baseLeave;

    const attendanceRate = finalDaysToBeAttended > 0
      ? Math.min(100, Math.round((finalDaysAttended / finalDaysToBeAttended) * 100))
      : 0;

    return {
      studentId: st.id,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      fullNameDhivehi: st.fullNameDhivehi || st.fullName,
      gradeLevel: st.gradeLevel,
      gender: st.gender,
      daysToBeAttended: finalDaysToBeAttended,
      daysAttended: finalDaysAttended,
      daysLate: finalDaysLate,
      daysAbsent: finalDaysAbsent,
      daysLeave: finalDaysLeave,
      attendanceRate,
      customNotes: override?.customNotes,
    };
  });

  const totalRate = studentRows.reduce((acc, curr) => acc + curr.attendanceRate, 0);
  const schoolAverageRate = studentRows.length > 0 ? Math.round(totalRate / studentRows.length) : 95;

  return {
    term,
    termName,
    termNameDhivehi,
    grade,
    startDate: sDate,
    endDate: eDate,
    schoolName: 'F. Magoodhoo School',
    schoolId: 'SCH-F02',
    totalInstructionalDays,
    daysToBeAttended: totalInstructionalDays,
    totalEnrolled: targetStudents.length,
    totalStudents: targetStudents.length,
    averageRate: schoolAverageRate,
    schoolAverageRate,
    termDurations: termConfigs,
    students: studentRows,
  };
}

export function generateClientWeeklyReport({
  weekStart,
  reportMode = 'BOTH',
  students = [],
  records = [],
  calendarDays = [],
}: {
  weekStart: string;
  reportMode?: AttendanceReportMode;
  students: Student[];
  records?: AttendanceRecord[];
  calendarDays?: AcademicCalendarDay[];
}): WeeklyAttendanceReport {
  const currentWeek =
    ALL_ACADEMIC_WEEKS_2026.find((w) => w.startDate === weekStart) ||
    getCurrentOrLatestSchoolWeek();

  const startDate = currentWeek.startDate;
  const endDate = currentWeek.endDate;

  const schoolDates = getClientSchoolDatesBetween(startDate, endDate);
  const totalSchoolDays = schoolDates.length;

  const ALL_GRADES_LIST: GradeLevel[] = [
    'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  ];

  let closedDays = 0;
  let totalPresentCount = 0;
  let totalSessionCount = 0;

  const dailyStats = schoolDates.map((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    const dayIndex = d.getUTCDay();
    const dayOfWeek = DAY_NAMES_EN[dayIndex];
    const dayNameDhivehi = DAY_NAMES_DV[dayIndex];

    const calDay = calendarDays.find((cd) => cd.date === dateStr);
    const isClosed = calDay ? ['PUBLIC_HOLIDAY', 'TERM_BREAK', 'SCHOOL_CLOSED', 'SCHOOL_CLOSED_WEATHER', 'NON_TEACHING_DAY'].includes(calDay.dayType) : false;

    if (isClosed) {
      closedDays++;
      return {
        date: dateStr,
        dayOfWeek,
        dayName: dayOfWeek,
        dayNameDhivehi,
        isClosed: true,
        closureReason: calDay?.description || 'School Closed',
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        totalEnrolled: students.length,
        rate: 100,
      };
    }

    const dayRecords = records.filter((r) => r.date === dateStr);
    let pres = 0;
    let late = 0;
    let abs = 0;
    let leave = 0;
    let recs = 0;

    if (dayRecords.length > 0) {
      dayRecords.forEach((r) => {
        recs++;
        if (r.status === 'PRESENT') pres++;
        else if (r.status === 'LATE') late++;
        else if (r.status === 'LEAVE') leave++;
        else if (r.status === 'ABSENT') abs++;
      });
    }

    const dayRate = recs > 0 ? Math.round(((pres + late) / recs) * 100) : null;
    totalPresentCount += pres + late;
    totalSessionCount += recs;

    return {
      date: dateStr,
      dayOfWeek,
      dayName: dayOfWeek,
      dayNameDhivehi,
      isClosed: false,
      closureReason: undefined,
      present: pres,
      absent: abs,
      late,
      leave,
      totalEnrolled: students.length,
      rate: dayRate,
    };
  });

  const instructionalDays = Math.max(1, totalSchoolDays - closedDays);
  const overallRate = totalSessionCount > 0
    ? Math.round((totalPresentCount / totalSessionCount) * 100)
    : null;

  // Grade matrix for the 5 days (Sun to Thu)
  const gradeMatrix = ALL_GRADES_LIST.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const stIds = new Set(gradeStudents.map((s) => s.id));

    const dayRates = schoolDates.map((dateStr) => {
      const recs = records.filter((r) => r.date === dateStr && stIds.has(r.studentId));
      if (recs.length === 0) return null;
      const p = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      return Math.round((p / recs.length) * 100);
    });

    const validRates = dayRates.filter((r): r is number => r !== null);
    const avg = validRates.length > 0
      ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
      : null;

    return {
      grade,
      sundayRate: dayRates[0] ?? null,
      mondayRate: dayRates[1] ?? null,
      tuesdayRate: dayRates[2] ?? null,
      wednesdayRate: dayRates[3] ?? null,
      thursdayRate: dayRates[4] ?? null,
      weeklyAverageRate: avg,
    };
  });

  const gradeRates = gradeMatrix.map((gm) => ({
    grade: gm.grade as GradeLevel,
    rates: {
      Sunday: gm.sundayRate ?? 0,
      Monday: gm.mondayRate ?? 0,
      Tuesday: gm.tuesdayRate ?? 0,
      Wednesday: gm.wednesdayRate ?? 0,
      Thursday: gm.thursdayRate ?? 0,
    },
    weeklyAverage: gm.weeklyAverageRate ?? 0,
    officialRate: gm.weeklyAverageRate ?? 0,
    extraClassRate: undefined,
  }));

  const sortedGrades = [...gradeMatrix].sort((a, b) => (b.weeklyAverageRate ?? 0) - (a.weeklyAverageRate ?? 0));
  const bestClass = sortedGrades[0]?.weeklyAverageRate != null ? sortedGrades[0].grade : undefined;

  return {
    weekNumber: currentWeek.weekNumber,
    weekTitle: currentWeek.label,
    reportMode,
    startDate,
    endDate,
    overallRate,
    weeklyAverageRate: overallRate,
    morningWeeklyRate: overallRate,
    afternoonWeeklyRate: overallRate,
    officialWeeklyRate: overallRate,
    extraClassWeeklyRate: undefined,
    combinedWeeklyRate: overallRate,
    totalExtraClasses: 0,
    totalSchoolDays,
    instructionalDays,
    closedDays,
    bestClass,
    dailyStats,
    dailyBreakdown: dailyStats,
    gradeMatrix,
    gradeRates,
    extraClassesHeld: [],
  };
}

export function generateClientMonthlyReport({
  year = 2026,
  month = 9,
  reportMode = 'BOTH',
  students = [],
  records = [],
  calendarDays = [],
}: {
  year?: number;
  month?: number;
  reportMode?: AttendanceReportMode;
  students: Student[];
  records?: AttendanceRecord[];
  calendarDays?: AcademicCalendarDay[];
}): MonthlyAttendanceReport {
  const mStr = String(month).padStart(2, '0');
  const startDate = `${year}-${mStr}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

  const monthNamesEn = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesDv = [
    '', 'ޖެނުއަރީ', 'ފެބްރުއަރީ', 'މާރިޗު', 'އޭޕްރީލް', 'މެއި', 'ޖޫން',
    'ޖުލައި', 'އޮގަސްޓް', 'ސެޕްޓެމްބަރ', 'އޮކްޓޫބަރ', 'ނޮވެމްބަރ', 'ޑިސެމްބަރ',
  ];

  const monthName = monthNamesEn[month] || 'September';
  const monthNameDhivehi = monthNamesDv[month] || 'ސެޕްޓެމްބަރ';

  const schoolDates = getClientSchoolDatesBetween(startDate, endDate);
  const totalSchoolDays = schoolDates.length;

  const ALL_GRADES_LIST: GradeLevel[] = [
    'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  ];

  const monthRecords = records.filter((r) => r.date >= startDate && r.date <= endDate);
  const totalEnrolled = students.length;

  // Grade breakdown
  const gradeBreakdown = ALL_GRADES_LIST.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const stIds = new Set(gradeStudents.map((s) => s.id));
    const recs = monthRecords.filter((r) => stIds.has(r.studentId));

    let rate: number | null = null;
    if (recs.length > 0) {
      const p = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      rate = Math.round((p / recs.length) * 100);
    }

    return {
      grade,
      enrolled: gradeStudents.length,
      monthlyRate: rate,
      officialRate: rate,
      extraClassRate: undefined,
      combinedRate: rate,
      chronicCount: rate < 80 ? Math.max(1, Math.round(gradeStudents.length * 0.1)) : 0,
    };
  });

  const gradeAverages = gradeBreakdown.map((g) => ({
    grade: g.grade as GradeLevel,
    rate: g.monthlyRate,
    enrolled: g.enrolled,
  }));

  const gradesWithRate = gradeBreakdown.filter((g) => g.monthlyRate != null);
  const overallRate = gradesWithRate.length > 0
    ? Math.round(gradesWithRate.reduce((a, b) => a + (b.monthlyRate || 0), 0) / gradesWithRate.length)
    : null;

  // Weekly breakdown
  const weeksInMonth = ALL_ACADEMIC_WEEKS_2026.filter((w) => w.monthName === monthName);
  const weeklyBreakdown = weeksInMonth.map((w) => {
    const wDates = getClientSchoolDatesBetween(w.startDate, w.endDate);
    return {
      weekLabel: w.label,
      instructionalDays: wDates.length,
      rate: overallRate,
      officialRate: overallRate,
      extraClassRate: undefined,
    };
  });

  const weeklyAverages = weeklyBreakdown.map((w) => ({
    weekLabel: w.weekLabel,
    rate: w.rate,
  }));

  const dailyTrends = schoolDates.map((dateStr) => {
    const calDay = calendarDays.find((cd) => cd.date === dateStr);
    const isClosed = calDay ? ['PUBLIC_HOLIDAY', 'TERM_BREAK', 'SCHOOL_CLOSED', 'SCHOOL_CLOSED_WEATHER', 'NON_TEACHING_DAY'].includes(calDay.dayType) : false;
    const dayRecs = monthRecords.filter((r) => r.date === dateStr);
    let r: number | null = null;
    if (dayRecs.length > 0) {
      const p = dayRecs.filter((x) => x.status === 'PRESENT' || x.status === 'LATE').length;
      r = Math.round((p / dayRecs.length) * 100);
    }
    return {
      date: dateStr,
      rate: isClosed ? 100 : r,
      isClosed,
    };
  });

  return {
    year,
    month,
    reportMode,
    monthName,
    monthNameDhivehi,
    totalSchoolDays,
    instructionalDays: totalSchoolDays,
    closedDays: 0,
    overallRate,
    monthlyRate: overallRate,
    morningMonthlyRate: overallRate,
    afternoonMonthlyRate: overallRate,
    officialMonthlyRate: overallRate,
    extraClassMonthlyRate: undefined,
    combinedMonthlyRate: overallRate,
    totalExtraClasses: 0,
    enrolledStudents: totalEnrolled,
    weeklyBreakdown,
    weeklyAverages,
    gradeBreakdown,
    gradeAverages,
    dailyTrends,
  };
}

export function generateClientYearlyReport({
  academicYear = 2026,
  reportMode = 'BOTH',
  students = [],
  records = [],
  calendarDays = [],
}: {
  academicYear?: number;
  reportMode?: AttendanceReportMode;
  students: Student[];
  records?: AttendanceRecord[];
  calendarDays?: AcademicCalendarDay[];
}): YearlyAttendanceReport {
  const ALL_GRADES_LIST: GradeLevel[] = [
    'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  ];

  const monthNamesEn = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesDv = [
    '', 'ޖެނުއަރީ', 'ފެބްރުއަރީ', 'މާރިޗު', 'އޭޕްރީލް', 'މެއި', 'ޖޫން',
    'ޖުލައި', 'އޮގަސްޓް', 'ސެޕްޓެމްބަރ', 'އޮކްޓޫބަރ', 'ނޮވެމްބަރ', 'ޑިސެމްބަރ',
  ];

  // Academic months in Maldives 2026: Jan to Dec (excluding vacation July)
  const months = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  const monthlyBreakdown = months.map((m) => {
    const rep = generateClientMonthlyReport({
      year: academicYear,
      month: m,
      reportMode,
      students,
      records,
      calendarDays,
    });
    return {
      month: m,
      monthName: monthNamesEn[m],
      monthNameDhivehi: monthNamesDv[m],
      instructionalDays: rep.instructionalDays,
      closedDays: rep.closedDays,
      averageRate: rep.monthlyRate,
      rate: rep.monthlyRate,
      officialRate: rep.monthlyRate,
      extraClassRate: undefined,
    };
  });

  const gradeBreakdown = ALL_GRADES_LIST.map((grade) => {
    const gradeStudents = students.filter((s) => s.gradeLevel === grade);
    const stIds = new Set(gradeStudents.map((s) => s.id));
    const recs = records.filter((r) => stIds.has(r.studentId));

    let annualRate: number | null = null;
    let perfectCount = 0;
    if (recs.length > 0) {
      const p = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      annualRate = Math.round((p / recs.length) * 100);
      if (annualRate >= 100) perfectCount = gradeStudents.length;
    }

    return {
      grade,
      enrolled: gradeStudents.length,
      annualRate,
      officialRate: annualRate,
      extraClassRate: undefined,
      chronicCount: annualRate !== null && annualRate < 80 ? Math.max(1, Math.round(gradeStudents.length * 0.1)) : 0,
      perfectAttendanceCount: perfectCount,
      perfectCount,
    };
  });

  const baseQuota = 200;
  const closedDaysDeducted = 9;
  const netRequiredDays = 191;

  const validGrades = gradeBreakdown.filter((g) => g.annualRate !== null);
  const overallRate = validGrades.length > 0
    ? Math.round(validGrades.reduce((a, b) => a + (b.annualRate || 0), 0) / validGrades.length)
    : null;

  return {
    academicYear,
    reportMode,
    moeStandardDays: baseQuota,
    baseQuota,
    closedDaysDeducted,
    netRequiredDays,
    totalDaysNeedToPresent: netRequiredDays,
    overallCumulativeRate: overallRate,
    annualAverageRate: overallRate,
    morningAnnualRate: overallRate,
    afternoonAnnualRate: overallRate,
    officialAnnualRate: overallRate,
    extraClassAnnualRate: undefined,
    combinedAnnualRate: overallRate,
    totalExtraClasses: 0,
    totalEnrolled: students.length,
    chronicAbsenteesCount: 0,
    perfectAttendanceCount: 0,
    monthlyBreakdown,
    gradeBreakdown,
    gradeYearlyRates: gradeBreakdown,
  };
}
