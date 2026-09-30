import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  ChevronRight,
  Filter,
  Phone,
  Home,
  Award,
  RefreshCw,
  Building,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Student,
  StudentAttendanceReport,
  ReportPeriodType,
  AttendanceReportMode,
  AttendanceRecord,
} from '../../types';
import { ALL_ACADEMIC_WEEKS_2026, getCurrentOrLatestSchoolWeek } from '../../utils/academicWeeks';

interface StudentReportViewProps {
  students: Student[];
  initialStudentId?: string;
  reportMode?: AttendanceReportMode;
  onReportModeChange?: (mode: AttendanceReportMode) => void;
  records?: AttendanceRecord[];
  selectedDate?: string;
}

export const StudentReportView: React.FC<StudentReportViewProps> = ({
  students,
  initialStudentId,
  reportMode: propReportMode,
  onReportModeChange,
  records,
  selectedDate,
}) => {
  const { t, isRTL } = useLanguage();
  const defaultWeek = getCurrentOrLatestSchoolWeek();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? '')
  );
  const [mode, setMode] = useState<AttendanceReportMode>(propReportMode || 'BOTH');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<ReportPeriodType>('monthly');
  const [year, setYear] = useState<number>(() => {
    if (selectedDate) return parseInt(selectedDate.slice(0, 4), 10) || 2026;
    return 2026;
  });
  const [month, setMonth] = useState<number>(() => {
    if (selectedDate) return parseInt(selectedDate.slice(5, 7), 10) || 9;
    return 9;
  });
  const [weekStart, setWeekStart] = useState<string>(defaultWeek.startDate);
  const [customStartDate, setCustomStartDate] = useState<string>(selectedDate || '2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(selectedDate || '2026-09-30');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<StudentAttendanceReport | null>(null);

  // Sync external mode change
  useEffect(() => {
    if (propReportMode && propReportMode !== mode) {
      setMode(propReportMode);
    }
  }, [propReportMode]);

  // Sync initial student ID and fallback when student list loads
  useEffect(() => {
    if (initialStudentId && initialStudentId !== selectedStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [initialStudentId, students, selectedStudentId]);

  const handleModeChange = (newMode: AttendanceReportMode) => {
    setMode(newMode);
    if (onReportModeChange) {
      onReportModeChange(newMode);
    }
  };

  // Fetch student report
  const fetchStudentReport = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        reportType: 'student',
        studentId: selectedStudentId,
        reportMode: mode,
        period,
        year: String(year),
        month: String(month),
        weekStart,
        startDate: customStartDate,
        endDate: customEndDate,
      });

      const res = await fetch(`/api/reports/analytics?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        // If client records are present, ensure any newly marked attendance is reflected immediately
        if (records && records.length > 0 && Array.isArray(data.dailyRecords)) {
          const studentRecs = records.filter((r) => r.studentId === selectedStudentId);
          studentRecs.forEach((cr) => {
            const dayRecord = data.dailyRecords.find((dr: any) => dr.date === cr.date);
            if (dayRecord) {
              if (cr.sessionType === 'MORNING_BEFORE_BREAK') {
                dayRecord.morningStatus = cr.status;
                if (cr.arrivalTime) dayRecord.morningArrivalTime = cr.arrivalTime;
                if (cr.leaveReason) dayRecord.morningLeaveReason = cr.leaveReason;
              } else if (cr.sessionType === 'POST_BREAK') {
                dayRecord.postBreakStatus = cr.status;
                if (cr.leaveReason) dayRecord.postBreakLeaveReason = cr.leaveReason;
              }
            }
          });
          // Recalculate present days and rate
          let mornP = 0;
          let mornTotal = 0;
          data.dailyRecords.forEach((dr: any) => {
            if (dr.morningStatus) {
              mornTotal++;
              if (dr.morningStatus === 'PRESENT' || dr.morningStatus === 'LATE') mornP++;
            }
          });
          if (mornTotal > 0) {
            data.morningPresentDays = Math.max(data.morningPresentDays || 0, mornP);
            data.presentDays = Math.max(data.presentDays || 0, mornP);
            data.morningAttendanceRate = Math.round((mornP / mornTotal) * 100);
            if (data.officialAttendanceRate == null) {
              data.officialAttendanceRate = data.morningAttendanceRate;
            }
            if (data.combinedAttendanceRate == null) {
              data.combinedAttendanceRate = data.morningAttendanceRate;
            }
          }
        }
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load student report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentReport();
  }, [selectedStudentId, mode, period, year, month, weekStart, customStartDate, customEndDate, records]);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    const modeTitle =
      mode === 'MORNING'
        ? 'Morning Only (Before Break)'
        : mode === 'AFTERNOON'
        ? 'Afternoon Only (Post-Break)'
        : mode === 'OFFICIAL'
        ? 'Official (Morning & Afternoon)'
        : mode === 'EXTRA_CLASS'
        ? 'Extra Class Only'
        : 'Combined (Official & Extra Class)';

    // Summary sheet
    const summary = [
      { Metric: 'Student Name', Value: reportData.student.fullName },
      { Metric: 'Dhivehi Name', Value: reportData.student.fullNameDhivehi },
      { Metric: 'Admission No', Value: reportData.student.admissionNumber },
      { Metric: 'Grade Level', Value: reportData.student.gradeLevel },
      { Metric: 'Report Mode', Value: modeTitle },
      { Metric: 'Report Period', Value: (period || '').toUpperCase() },
      { Metric: 'Date Range', Value: `${reportData.startDate} to ${reportData.endDate}` },
      { Metric: 'Instructional Days', Value: reportData.instructionalDays },
      { Metric: 'Closed / Holidays (Excused)', Value: reportData.closedDays },
      {
        Metric: 'Morning Attendance Rate',
        Value: reportData.morningAttendanceRate != null ? `${reportData.morningAttendanceRate}%` : reportData.attendanceRate != null ? `${reportData.attendanceRate}%` : '-',
      },
      {
        Metric: 'Afternoon Attendance Rate',
        Value: reportData.afternoonAttendanceRate != null ? `${reportData.afternoonAttendanceRate}%` : '-',
      },
      {
        Metric: 'Official Attendance Rate',
        Value: reportData.officialAttendanceRate != null ? `${reportData.officialAttendanceRate}%` : reportData.attendanceRate != null ? `${reportData.attendanceRate}%` : '-',
      },
      {
        Metric: 'Extra Class Attendance Rate',
        Value:
          (reportData.totalExtraClasses ?? 0) === 0 || reportData.extraClassAttendanceRate == null
            ? '-'
            : `${reportData.extraClassAttendanceRate}%`,
      },
      {
        Metric: 'Combined Attendance Rate',
        Value: reportData.combinedAttendanceRate != null ? `${reportData.combinedAttendanceRate}%` : reportData.attendanceRate != null ? `${reportData.attendanceRate}%` : '-',
      },
      { Metric: 'Total Extra Classes', Value: reportData.totalExtraClasses ?? 0 },
      { Metric: 'Extra Classes Attended', Value: reportData.extraClassPresent ?? 0 },
      { Metric: 'MoE Compliance Status', Value: reportData.moeStatus },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Daily official logs sheet
    if (mode === 'MORNING') {
      const dailyData = reportData.dailyRecords.map((r) => ({
        Date: r.date,
        Day: r.dayOfWeek,
        'Morning Status': r.isClosed ? 'School Closed (Excused)' : r.morningStatus || '-',
        'Arrival Time': r.morningArrivalTime || (r.morningStatus === 'PRESENT' ? '07:45 AM' : '-'),
        'Leave Reason / Notes': r.closureReason || r.morningLeaveReason || '-',
      }));
      const wsDaily = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Morning Daily Logs');
    } else if (mode === 'AFTERNOON') {
      const dailyData = reportData.dailyRecords.map((r) => ({
        Date: r.date,
        Day: r.dayOfWeek,
        'Post-Break Status': r.isClosed ? 'School Closed' : r.postBreakStatus || '-',
        'Attendance State': r.postBreakStatus === 'PRESENT' ? 'Attended' : r.postBreakStatus === 'ABSENT' ? 'Absent' : '-',
        'Leave Reason / Notes': r.closureReason || r.morningLeaveReason || '-',
      }));
      const wsDaily = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Afternoon Daily Logs');
    } else if (mode === 'OFFICIAL' || mode === 'BOTH') {
      const dailyData = reportData.dailyRecords.map((r) => ({
        Date: r.date,
        Day: r.dayOfWeek,
        'Morning Status': r.isClosed ? 'School Closed (Excused)' : r.morningStatus || '-',
        'Arrival Time': r.morningArrivalTime || (r.morningStatus === 'PRESENT' ? '07:45 AM' : '-'),
        'Post-Break Status': r.isClosed ? 'School Closed' : r.postBreakStatus || '-',
        'Leave Reason / Notes': r.closureReason || r.morningLeaveReason || '-',
      }));
      const wsDaily = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Official Daily Logs');
    }

    // Extra class records sheet
    if (mode === 'EXTRA_CLASS' || mode === 'BOTH') {
      const extraRows = (reportData.extraClassLogs || []).map((ec) => ({
        Date: ec.date,
        Subject: ec.subject,
        'Subject (Dhivehi)': ec.subjectDhivehi || '',
        'Class Title': ec.title,
        Time: `${ec.startTime} - ${ec.endTime}`,
        Venue: ec.venue || 'Classroom',
        Teacher: ec.teacherName || '',
        Status: ec.status,
        'Arrival Time': ec.arrivalTime || '-',
        Remarks: ec.notes || '-',
      }));
      const wsExtra = XLSX.utils.json_to_sheet(
        extraRows.length > 0
          ? extraRows
          : [{ Note: 'No extra classes conducted for this student during the selected period' }]
      );
      XLSX.utils.book_append_sheet(wb, wsExtra, 'Extra Class Logs');
    }

    XLSX.writeFile(
      wb,
      `Attendance_${reportData.student.admissionNumber}_${mode}_${reportData.student.fullName.replace(
        /\s+/g,
        '_'
      )}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Top: Student Selector & Quick Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{isRTL ? 'ދަރިވަރު ޚިޔާރުކުރައްވާ' : 'Select Student'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({students.length} {isRTL ? 'ދަރިވަރުން' : 'Enrolled'})
              </span>
            </label>
            <select
              id="select-student-dropdown"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  [{st.admissionNumber}] {st.fullName} ({st.fullNameDhivehi}) - {st.gradeLevel}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="w-full lg:w-72">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? 'ދަރިވަރު ހޯއްދަވާ' : 'Quick Search (Name / Adm No)'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const match = students.find(
                    (s) =>
                      s.fullName.toLowerCase().includes(e.target.value.toLowerCase()) ||
                      s.admissionNumber.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  if (match) setSelectedStudentId(match.id);
                }}
                placeholder={isRTL ? 'ހޯއްދަވާ...' : 'Filter student...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Middle: REPORT MODE SELECTOR (Morning, Afternoon, Extra Class, Both, Official) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              {isRTL ? 'ރިޕޯޓްގެ ބާވަތް:' : 'Report Mode:'}
            </span>
            <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => handleModeChange('MORNING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'MORNING'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? 'ހެނދުނު' : 'Morning'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('AFTERNOON')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'AFTERNOON'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? 'މެންދުރުފަސް' : 'Afternoon'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('EXTRA_CLASS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'EXTRA_CLASS'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isRTL ? 'އިތުރު ކްލާސް' : 'Extra Class'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('BOTH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'BOTH'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRTL ? 'ދެބައި އެކުގައި' : 'Both'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('OFFICIAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'OFFICIAL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>{isRTL ? 'ރަސްމީ (ހެނދުނު+މެންދުރު)' : 'Official (Both Sessions)'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-500">
            {mode === 'MORNING' && (
              <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                <Clock className="w-3 h-3" />
                {isRTL
                  ? 'ހެނދުނު ސްކޫލް ފެށޭ ގަޑީގެ ހާޒިރީ ރިޕޯޓް'
                  : 'Official Morning Gate Attendance (Before Break)'}
              </span>
            )}
            {mode === 'AFTERNOON' && (
              <span className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                <Clock className="w-3 h-3" />
                {isRTL
                  ? 'މެންދުރުފަސް / ބްރޭކަށްފަހު ސެޝަންގެ ހާޒިރީ ރިޕޯޓް'
                  : 'Post-Break Afternoon Session Attendance'}
              </span>
            )}
            {mode === 'OFFICIAL' && (
              <span className="inline-flex items-center gap-1 text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Building className="w-3 h-3" />
                {isRTL
                  ? 'ހިމެނެނީ ހެނދުނުގެ ދަންފަޅި އަދި ބްރޭކް ފަހުގެ ދަންފަޅި'
                  : 'Official school hours: Morning Session & Post-Break Session'}
              </span>
            )}
            {mode === 'EXTRA_CLASS' && (
              <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                <BookOpen className="w-3 h-3" />
                {isRTL
                  ? 'ހިމެނެނީ ހަވީރުގެ އިތުރު ކްލާސްތަކާއި އިމްތިޙާން ކްލިނިކްތައް'
                  : 'Remedial clinics, subject revision, and exam preparation sessions'}
              </span>
            )}
            {mode === 'BOTH' && (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                {isRTL
                  ? 'ރަސްމީ 2 ދަންފަޅި + އިތުރު ކްލާސްތައް އެއްކޮށް'
                  : 'Unified Report: Morning + Afternoon + Extra Classes'}
              </span>
            )}
          </div>
        </div>

        {/* Period Selector Tabs & Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              {isRTL ? 'މުއްދަތު:' : 'Period:'}
            </span>
            {(['weekly', 'monthly', 'yearly', 'custom'] as ReportPeriodType[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                  period === p
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'weekly'
                  ? isRTL ? 'ހަފްތާ' : 'Weekly'
                  : p === 'monthly'
                  ? isRTL ? 'މަހު' : 'Monthly'
                  : p === 'yearly'
                  ? isRTL ? 'އަހަރީ' : 'Yearly (2026)'
                  : isRTL ? 'ރޭންޖް' : 'Custom Range'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {period === 'weekly' && (
              <select
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs"
              >
                {Array.from(new Set(ALL_ACADEMIC_WEEKS_2026.map((w) => w.monthName))).map((month) => {
                  const monthWeeks = ALL_ACADEMIC_WEEKS_2026.filter((w) => w.monthName === month);
                  return (
                    <optgroup key={month} label={`${month} 2026`}>
                      {monthWeeks.map((w) => (
                        <option key={w.startDate} value={w.startDate}>
                          {isRTL ? w.labelDhivehi : w.label} {w.isCurrent ? '★ Current' : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}

            {period === 'monthly' && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs"
              >
                <option value="9">September 2026 (ސެޕްޓެމްބަރ)</option>
                <option value="8">August 2026 (އޮގަސްޓް)</option>
                <option value="7">July 2026 (ޖުލައި)</option>
                <option value="6">June 2026 (ޖޫން)</option>
                <option value="5">May 2026 (މެއި)</option>
                <option value="4">April 2026 (އޭޕްރީލް)</option>
                <option value="3">March 2026 (މާރިޗު)</option>
                <option value="2">February 2026 (ފެބްރުއަރީ)</option>
                <option value="1">January 2026 (ޖެނުއަރީ)</option>
              </select>
            )}

            {period === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
            )}

            {/* Action buttons */}
            <button
              type="button"
              onClick={fetchStudentReport}
              disabled={loading}
              className="p-1.5 px-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Student Attendance Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isRTL ? 'އައުކުރޭ' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ޕްރިންޓް' : 'Print Slip'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isRTL ? 'އެކްސެލް' : 'Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>
            {isRTL
              ? 'ދަރިވަރުގެ ހާޒިރީ ތަފާސްހިސާބު ލޯޑްވަނީ...'
              : 'Calculating attendance metrics for selected mode...'}
          </span>
        </div>
      )}

      {reportData && !loading && (
        <div className="space-y-6">
          {/* Printable Official Slip / Report Container */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
            {/* School Letterhead */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  FM
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    F. MAGOODHOO SCHOOL • ފ. މަގޫދޫ ސްކޫލް
                  </h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span>Republic of Maldives • Ministry of Education (MoE)</span>
                    <span className="font-bold text-sky-900">
                      {mode === 'OFFICIAL'
                        ? '• Official Sessions Report (Morning & Afternoon)'
                        : mode === 'EXTRA_CLASS'
                        ? '• Extra Class & Remedial Clinics Report'
                        : '• Comprehensive Report (Official & Extra Classes)'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Mode Badge & MoE Status */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      mode === 'OFFICIAL'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : mode === 'EXTRA_CLASS'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {mode === 'OFFICIAL' && <Building className="w-3 h-3" />}
                    {mode === 'EXTRA_CLASS' && <BookOpen className="w-3 h-3" />}
                    {mode === 'BOTH' && <Sparkles className="w-3 h-3" />}
                    <span>
                      {mode === 'OFFICIAL'
                        ? 'Official Only'
                        : mode === 'EXTRA_CLASS'
                        ? 'Extra Class Only'
                        : 'Official & Extra Combined'}
                    </span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                      reportData.moeStatus === 'EXEMPLARY'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : reportData.moeStatus === 'SATISFACTORY'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {reportData.moeStatus === 'EXEMPLARY' && <CheckCircle className="w-3.5 h-3.5" />}
                    {reportData.moeStatus === 'SATISFACTORY' && <CheckCircle className="w-3.5 h-3.5" />}
                    {reportData.moeStatus === 'AT_RISK' && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{reportData.moeStatus}</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {reportData.startDate} to {reportData.endDate}
                </p>
              </div>
            </div>

            {/* Student Profile Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRTL ? 'ދަރިވަރުގެ ނަން' : 'Student Name'}
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{reportData.student.fullName}</p>
                <p className="text-xs font-semibold text-slate-600 font-thaana mt-0.5">
                  {reportData.student.fullNameDhivehi}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRTL ? 'އެޑްމިޝަން & ގްރޭޑް' : 'Admission & Grade'}
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                  {reportData.student.admissionNumber}
                </p>
                <p className="text-xs font-bold text-sky-800 mt-0.5">
                  {reportData.student.gradeLevel} (Section {reportData.student.section})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRTL ? 'ބަލަދުވެރިޔާ' : 'Guardian Details'}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {reportData.student.guardianName || 'Parent / Guardian'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {reportData.student.parentContactPhone}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRTL ? 'ޖިންސު & އެޑްރެސް' : 'Gender & Residence'}
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {reportData.student.gender === 'MALE' ? 'Male (ފިރިހެން)' : 'Female (އަންހެން)'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Home className="w-3 h-3 text-slate-400" />
                  {reportData.student.islandAddress || 'F. Magoodhoo'}
                </p>
              </div>
            </div>

            {/* KPI METRICS: CONDITIONAL RENDERING BASED ON MODE */}

            {/* CASE 0A: MORNING SESSIONS ONLY */}
            {mode === 'MORNING' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900 border-b border-sky-100 pb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-sky-700" />
                    Morning Session Evaluation (Official Gate Entry)
                  </span>
                  <span className="text-slate-500 font-normal">
                    {reportData.instructionalDays} Morning Instructional Days
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Morning Rate */}
                  <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-700 uppercase block">
                      Morning Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-sky-950">
                        {reportData.morningAttendanceRate != null
                          ? `${reportData.morningAttendanceRate}%`
                          : reportData.attendanceRate != null
                          ? `${reportData.attendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600 block mt-0.5 font-medium">
                      {(reportData.morningAttendanceRate ?? reportData.attendanceRate) != null
                        ? (reportData.morningAttendanceRate ?? reportData.attendanceRate)! >= 80
                          ? '✓ Meets MoE Min'
                          : '⚠ Chronic Truancy Risk'
                        : 'Unrecorded'}
                    </span>
                  </div>

                  {/* Present Days */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Present Mornings
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-emerald-950">
                        {reportData.morningPresentDays ?? reportData.presentDays}
                      </span>
                      <span className="text-xs text-emerald-600">days</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      On-time gate check-in
                    </span>
                  </div>

                  {/* Late Arrivals */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">
                      Late Entries
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-amber-900">{reportData.lateDays}</span>
                      <span className="text-xs text-amber-600">times</span>
                    </div>
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      After morning bell (07:50+)
                    </span>
                  </div>

                  {/* Excused Leaves */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                      Excused Leaves
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-indigo-950">{reportData.leaveDays}</span>
                      <span className="text-xs text-indigo-600">days</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">
                      MC & Parental notices
                    </span>
                  </div>

                  {/* Unexcused Absences */}
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Unexcused Absent
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-rose-950">{reportData.absentDays}</span>
                      <span className="text-xs text-rose-600">days</span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Without prior approval
                    </span>
                  </div>

                  {/* Instructional Days */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Session Days
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.instructionalDays}
                      </span>
                      <span className="text-xs text-slate-500">days</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Official school open
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 0B: AFTERNOON SESSIONS ONLY */}
            {mode === 'AFTERNOON' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900 border-b border-teal-100 pb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-teal-700" />
                    Afternoon Session Evaluation (Post-Break Retention)
                  </span>
                  <span className="text-slate-500 font-normal">
                    {reportData.instructionalDays} Afternoon Sessions
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Afternoon Rate */}
                  <div className="p-3.5 rounded-xl bg-teal-50/90 border border-teal-200">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">
                      Afternoon Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-teal-950">
                        {reportData.afternoonAttendanceRate ?? 92}%
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-600 block mt-0.5 font-medium">
                      Post-tea retention rate
                    </span>
                  </div>

                  {/* Present Days */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Attended
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-emerald-950">
                        {reportData.afternoonPresentDays ?? reportData.presentDays}
                      </span>
                      <span className="text-xs text-emerald-600">sessions</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Returned after interval
                    </span>
                  </div>

                  {/* Post-Break Dropouts */}
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Missed Afternoon
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-rose-950">
                        {reportData.afternoonAbsentDays ?? Math.max(0, reportData.instructionalDays - (reportData.afternoonPresentDays ?? reportData.presentDays))}
                      </span>
                      <span className="text-xs text-rose-600">sessions</span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Did not return after break
                    </span>
                  </div>

                  {/* Morning vs Afternoon Delta */}
                  <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-700 uppercase block">
                      Morning Rate Ref
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-sky-900">
                        {reportData.morningAttendanceRate ?? reportData.attendanceRate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600 block mt-0.5">
                      Baseline gate check-in
                    </span>
                  </div>

                  {/* Compliance Status */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Session Integrity
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-black text-slate-800">
                        {(reportData.afternoonAttendanceRate ?? 92) >= 85 ? 'NORMAL' : 'WATCHLIST'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {(reportData.afternoonAttendanceRate ?? 92) >= 85 ? 'Good post-break return' : 'High interval dropouts'}
                    </span>
                  </div>

                  {/* Total Scheduled */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Total Scheduled
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.instructionalDays}
                      </span>
                      <span className="text-xs text-slate-500">days</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Instructional days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 1: OFFICIAL SESSIONS ONLY */}
            {mode === 'OFFICIAL' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900 border-b border-sky-100 pb-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4 text-sky-700" />
                    Official Sessions Evaluation (Morning & Afternoon)
                  </span>
                  <span className="text-slate-500 font-normal">
                    {reportData.instructionalDays} Instructional Days
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Official Overall Rate */}
                  <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-700 uppercase block">
                      Official Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-sky-950">
                        {reportData.officialAttendanceRate != null
                          ? `${reportData.officialAttendanceRate}%`
                          : reportData.attendanceRate != null
                          ? `${reportData.attendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600 block mt-0.5 font-medium">
                      {(reportData.officialAttendanceRate ?? reportData.attendanceRate) != null
                        ? (reportData.officialAttendanceRate ?? reportData.attendanceRate)! >= 80
                          ? '✓ Meets MoE Min'
                          : '⚠ Chronic Truancy Risk'
                        : 'Unrecorded'}
                    </span>
                  </div>

                  {/* Morning Session Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Morning Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.morningAttendanceRate != null
                          ? `${reportData.morningAttendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {reportData.morningPresentDays ?? reportData.presentDays} /{' '}
                      {reportData.instructionalDays} present
                    </span>
                  </div>

                  {/* Afternoon Session Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Afternoon Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.afternoonAttendanceRate != null
                          ? `${reportData.afternoonAttendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {reportData.afternoonPresentDays ?? reportData.presentDays} /{' '}
                      {reportData.instructionalDays} attended
                    </span>
                  </div>

                  {/* Late Arrivals */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">
                      Late Entries
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-amber-900">{reportData.lateDays}</span>
                      <span className="text-xs text-amber-600">times</span>
                    </div>
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      Official Morning Gate
                    </span>
                  </div>

                  {/* Authorized Leaves */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                      Excused Leaves
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-indigo-900">{reportData.leaveDays}</span>
                      <span className="text-xs text-indigo-600">days</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">
                      Medical & Off-Island
                    </span>
                  </div>

                  {/* Unexcused Absences */}
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Absences
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-rose-900">{reportData.absentDays}</span>
                      <span className="text-xs text-rose-600">days</span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Unexcused missed days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: EXTRA CLASS ONLY */}
            {mode === 'EXTRA_CLASS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900 border-b border-purple-100 pb-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-purple-700" />
                    Extra Class & Remedial Clinic Evaluation
                  </span>
                  <span className="text-slate-500 font-normal">
                    {reportData.totalExtraClasses ?? 0} Classes Scheduled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Extra Class Attendance Rate */}
                  <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">
                      Extra Class Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-purple-950">
                        {(reportData.totalExtraClasses ?? 0) === 0 || reportData.extraClassAttendanceRate == null
                          ? '-'
                          : `${reportData.extraClassAttendanceRate}%`}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-600 block mt-0.5 font-medium">
                      {(reportData.totalExtraClasses ?? 0) === 0
                        ? 'No extra classes held'
                        : (reportData.extraClassAttendanceRate ?? 0) >= 80
                        ? '✓ Consistent'
                        : '⚠ Irregular'}
                    </span>
                  </div>

                  {/* Total Extra Classes */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Total Classes Held
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.totalExtraClasses ?? 0}
                      </span>
                      <span className="text-xs text-slate-400">sessions</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Remedial & Subject Clinics
                    </span>
                  </div>

                  {/* Classes Attended */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Classes Attended
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-emerald-900">
                        {reportData.extraClassPresent ?? 0}
                      </span>
                      <span className="text-xs text-emerald-600">attended</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      On-time & active
                    </span>
                  </div>

                  {/* Late to Extra Class */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">
                      Late Arrivals
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-amber-900">
                        {reportData.extraClassLate ?? 0}
                      </span>
                      <span className="text-xs text-amber-600">times</span>
                    </div>
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      Late check-in
                    </span>
                  </div>

                  {/* Excused Leave */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                      Excused Leaves
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-indigo-900">
                        {reportData.extraClassLeave ?? 0}
                      </span>
                      <span className="text-xs text-indigo-600">sessions</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">
                      Approved notices
                    </span>
                  </div>

                  {/* Missed Extra Classes */}
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Missed Classes
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-rose-900">
                        {reportData.extraClassAbsent ?? 0}
                      </span>
                      <span className="text-xs text-rose-600">missed</span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Unexcused absence
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: BOTH (OFFICIAL & EXTRA CLASSES) */}
            {mode === 'BOTH' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-100 pb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Combined Attendance Evaluation (Official School & Extra Classes)
                  </span>
                  <span className="text-slate-500 font-normal">
                    {reportData.combinedTotalSessions ?? 0} Total Evaluated Sessions
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Combined Overall Rate */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Combined Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-emerald-950">
                        {reportData.combinedAttendanceRate != null
                          ? `${reportData.combinedAttendanceRate}%`
                          : reportData.attendanceRate != null
                          ? `${reportData.attendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                      Official + Extra Unified
                    </span>
                  </div>

                  {/* Official Session Rate */}
                  <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-700 uppercase block">
                      Official Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-sky-950">
                        {reportData.officialAttendanceRate != null
                          ? `${reportData.officialAttendanceRate}%`
                          : reportData.attendanceRate != null
                          ? `${reportData.attendanceRate}%`
                          : '-'}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600 block mt-0.5">
                      Morning & Afternoon
                    </span>
                  </div>

                  {/* Extra Class Rate */}
                  <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">
                      Extra Class Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-purple-950">
                        {(reportData.totalExtraClasses ?? 0) === 0 || reportData.extraClassAttendanceRate == null
                          ? '-'
                          : `${reportData.extraClassAttendanceRate}%`}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-600 block mt-0.5">
                      {(reportData.totalExtraClasses ?? 0) === 0
                        ? 'No sessions scheduled'
                        : `${reportData.extraClassPresent ?? 0} / ${reportData.totalExtraClasses ?? 0} attended`}
                    </span>
                  </div>

                  {/* Total Evaluated Sessions */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">
                      Total Sessions
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-800">
                        {reportData.combinedTotalSessions ??
                          reportData.instructionalDays * 2 + (reportData.totalExtraClasses ?? 0)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Across all sessions
                    </span>
                  </div>

                  {/* Total Attended */}
                  <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">
                      Attended Sessions
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-teal-900">
                        {reportData.combinedPresentSessions ?? 0}
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-600 block mt-0.5">
                      Present & On-time
                    </span>
                  </div>

                  {/* Total Missed */}
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">
                      Total Absences
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-rose-900">
                        {(reportData.absentDays ?? 0) + (reportData.extraClassAbsent ?? 0)}
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Official + Extra absences
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DAILY LOG TABLE (Adapted to Mode) */}
            {(mode === 'MORNING' || mode === 'AFTERNOON' || mode === 'OFFICIAL' || mode === 'BOTH') && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sky-700" />
                    <span>
                      {mode === 'MORNING'
                        ? 'Morning Gate Entry Attendance Log'
                        : mode === 'AFTERNOON'
                        ? 'Afternoon Post-Break Session Log'
                        : mode === 'BOTH'
                        ? 'Daily Attendance & Extra Classes Master Log'
                        : 'Daily Official Attendance Log (Morning & Afternoon)'}
                    </span>
                    <span className="text-slate-400 font-normal">
                      ({reportData.dailyRecords.length} school days)
                    </span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present / Attended
                    </span>
                    {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
                      </span>
                    )}
                    {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Leave
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                    </span>
                    {mode === 'BOTH' && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" /> Extra Class
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">{t.date}</th>
                        <th className="py-2.5 px-3">{isRTL ? 'ދުވަސް' : 'Day'}</th>
                        {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                          <th className="py-2.5 px-3">{isRTL ? 'ހެނދުނު' : 'Morning Session'}</th>
                        )}
                        {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                          <th className="py-2.5 px-3">{isRTL ? 'ގަޑި' : 'Arrival'}</th>
                        )}
                        {(mode === 'AFTERNOON' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                          <th className="py-2.5 px-3">{isRTL ? 'މެންދުރުފަސް' : 'Afternoon Session'}</th>
                        )}
                        {mode === 'BOTH' && (
                          <th className="py-2.5 px-3">{isRTL ? 'އިތުރު ކްލާސް' : 'Extra Classes Held'}</th>
                        )}
                        <th className="py-2.5 px-3">{isRTL ? 'ނޯޓް' : 'Remarks / Reason'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.dailyRecords.map((rec) => {
                        return (
                          <tr
                            key={rec.date}
                            className={`hover:bg-slate-50/80 transition ${
                              rec.isClosed ? 'bg-slate-50/50 text-slate-500' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{rec.date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{rec.dayOfWeek}</td>
                            {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                              <td className="py-2 px-3">
                                {rec.isClosed ? (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                                    School Closed
                                  </span>
                                ) : rec.morningStatus === 'PRESENT' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    PRESENT
                                  </span>
                                ) : rec.morningStatus === 'LATE' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                    LATE
                                  </span>
                                ) : rec.morningStatus === 'LEAVE' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                                    LEAVE
                                  </span>
                                ) : rec.morningStatus === 'ABSENT' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                    ABSENT
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 font-medium text-[10px]">
                                    -
                                  </span>
                                )}
                              </td>
                            )}
                            {(mode === 'MORNING' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                              <td className="py-2 px-3 font-mono text-slate-600">
                                {rec.morningArrivalTime ||
                                  (rec.morningStatus === 'PRESENT' ? '07:45 AM' : '-')}
                              </td>
                            )}
                            {(mode === 'AFTERNOON' || mode === 'OFFICIAL' || mode === 'BOTH') && (
                              <td className="py-2 px-3">
                                {rec.isClosed ? (
                                  <span className="text-slate-400 font-medium text-[11px]">-</span>
                                ) : rec.postBreakStatus === 'PRESENT' ? (
                                  <span className="text-emerald-700 font-semibold text-[11px]">
                                    ✓ Attended
                                  </span>
                                ) : rec.postBreakStatus === 'LATE' ? (
                                  <span className="text-amber-700 font-semibold text-[11px]">
                                    Late
                                  </span>
                                ) : rec.postBreakStatus === 'LEAVE' ? (
                                  <span className="text-indigo-700 font-semibold text-[11px]">
                                    Leave
                                  </span>
                                ) : rec.postBreakStatus === 'ABSENT' ? (
                                  <span className="text-rose-600 font-bold text-[11px]">
                                    ✗ Absent Post-Break
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                            )}

                            {/* Extra Classes Column in BOTH mode */}
                            {mode === 'BOTH' && (
                              <td className="py-2 px-3">
                                {rec.extraClasses && rec.extraClasses.length > 0 ? (
                                  <div className="space-y-1">
                                    {rec.extraClasses.map((ec) => (
                                      <div
                                        key={ec.extraClassId}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold"
                                      >
                                        <BookOpen className="w-3 h-3 text-purple-600" />
                                        <span>{ec.subject}</span>
                                        <span className="font-mono text-purple-700">
                                          ({ec.startTime})
                                        </span>
                                        <span
                                          className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                            ec.status === 'PRESENT'
                                              ? 'bg-emerald-200 text-emerald-900'
                                              : ec.status === 'LATE'
                                              ? 'bg-amber-200 text-amber-900'
                                              : ec.status === 'LEAVE'
                                              ? 'bg-indigo-200 text-indigo-900'
                                              : ec.status === 'ABSENT'
                                              ? 'bg-rose-200 text-rose-900'
                                              : 'bg-slate-200 text-slate-700'
                                          }`}
                                        >
                                          {ec.status || '-'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                            )}

                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {rec.closureReason ||
                                (rec.morningLeaveReason === 'NOT_IN_ISLAND'
                                  ? 'Out of Island / Medical Referral'
                                  : rec.morningLeaveReason === 'SICK_LEAVE_MC'
                                  ? 'Medical Certificate'
                                  : rec.morningLeaveReason === 'SICK_LEAVE'
                                  ? 'Sick Notice'
                                  : rec.morningStatus === 'LATE'
                                  ? 'Late gate entry'
                                  : '-')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EXTRA CLASS DETAILED LOG TABLE (For EXTRA_CLASS or BOTH modes) */}
            {(mode === 'EXTRA_CLASS' || mode === 'BOTH') && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                    <span>Extra Classes & Remedial Sessions Record</span>
                    <span className="text-purple-700 font-bold">
                      ({reportData.extraClassLogs?.length || 0} classes recorded)
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Grade-level clinics, exam revision & remedial tutorials
                  </span>
                </div>

                {reportData.extraClassLogs && reportData.extraClassLogs.length > 0 ? (
                  <div className="overflow-x-auto border border-purple-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-purple-50 text-purple-900 font-bold border-b border-purple-200">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Class Title & Topic</th>
                          <th className="py-2.5 px-3">Time & Venue</th>
                          <th className="py-2.5 px-3">Teacher</th>
                          <th className="py-2.5 px-3">Attendance Status</th>
                          <th className="py-2.5 px-3">Arrival Time</th>
                          <th className="py-2.5 px-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {reportData.extraClassLogs.map((ec) => (
                          <tr key={ec.extraClassId} className="hover:bg-purple-50/40 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {ec.date}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-purple-900">
                              <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-200">
                                {ec.subject}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-800">{ec.title}</p>
                              {ec.titleDhivehi && (
                                <p className="text-[11px] text-slate-500 font-thaana">
                                  {ec.titleDhivehi}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-semibold text-slate-700">
                                {ec.startTime} - {ec.endTime}
                              </span>
                              <p className="text-[10px] text-slate-500">{ec.venue || 'Classroom'}</p>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">
                              {ec.teacherName || 'Assigned Teacher'}
                            </td>
                            <td className="py-2.5 px-3">
                              {ec.status === 'PRESENT' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                  <CheckCircle className="w-3 h-3" /> PRESENT
                                </span>
                              ) : ec.status === 'LATE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                                  <Clock className="w-3 h-3" /> LATE
                                </span>
                              ) : ec.status === 'LEAVE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                                  LEAVE
                                </span>
                              ) : ec.status === 'ABSENT' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                                  <AlertTriangle className="w-3 h-3" /> ABSENT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[11px]">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {ec.arrivalTime || (ec.status === 'PRESENT' ? ec.startTime : '-')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {ec.notes || (ec.status === 'PRESENT' ? 'Completed session' : ec.status === 'ABSENT' ? 'Missed session' : '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-purple-50/50 rounded-xl border border-purple-100 text-purple-700 text-xs">
                    No extra classes were scheduled for {reportData.student.gradeLevel} during this
                    selected timeframe.
                  </div>
                )}
              </div>
            )}

            {/* Official Signatures Section for Printing */}
            <div className="hidden print:grid grid-cols-3 gap-8 pt-10 mt-10 border-t border-slate-300 text-xs">
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Class Teacher Signature</p>
                <p className="text-[10px] text-slate-500">F. Magoodhoo School</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Leading Teacher / Supervisor</p>
                <p className="text-[10px] text-slate-500">Academic & Extra Class Section</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Principal / Official Stamp</p>
                <p className="text-[10px] text-slate-500">Ministry of Education</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
