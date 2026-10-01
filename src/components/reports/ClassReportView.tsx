import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  RefreshCw,
  Search,
  Building,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  GradeLevel,
  ClassAttendanceReport,
  ReportPeriodType,
  AttendanceReportMode,
  AttendanceRecord,
  Student,
} from '../../types';
import { ALL_ACADEMIC_WEEKS_2026, getCurrentOrLatestSchoolWeek } from '../../utils/academicWeeks';
import { generateClientClassReport } from '../../utils/reportGenerator';

interface ClassReportViewProps {
  onSelectStudent: (studentId: string) => void;
  reportMode?: AttendanceReportMode;
  onReportModeChange?: (mode: AttendanceReportMode) => void;
  initialGrade?: GradeLevel | 'ALL';
  records?: AttendanceRecord[];
  students?: Student[];
}

const ALL_GRADES: GradeLevel[] = [
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

export const ClassReportView: React.FC<ClassReportViewProps> = ({
  onSelectStudent,
  reportMode: propReportMode,
  onReportModeChange,
  initialGrade,
  records,
  students,
}) => {
  const { t, isRTL } = useLanguage();
  const defaultWeek = getCurrentOrLatestSchoolWeek();
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'ALL'>(initialGrade || 'Grade 7');
  const [mode, setMode] = useState<AttendanceReportMode>(propReportMode || 'BOTH');
  const [period, setPeriod] = useState<ReportPeriodType>('monthly');
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [weekStart, setWeekStart] = useState<string>(defaultWeek.startDate);
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [classData, setClassData] = useState<ClassAttendanceReport | null>(() => {
    if (!students || students.length === 0) return null;
    return generateClientClassReport({
      grade: selectedGrade,
      students,
      period,
      year,
      month,
      weekStart,
      startDate: customStartDate,
      endDate: customEndDate,
      reportMode: mode,
      records,
    });
  });

  // Synchronize initial grade
  useEffect(() => {
    if (initialGrade && initialGrade !== selectedGrade) {
      setSelectedGrade(initialGrade);
    }
  }, [initialGrade]);

  // Synchronize prop report mode
  useEffect(() => {
    if (propReportMode && propReportMode !== mode) {
      setMode(propReportMode);
    }
  }, [propReportMode]);

  const handleModeChange = (newMode: AttendanceReportMode) => {
    setMode(newMode);
    if (onReportModeChange) {
      onReportModeChange(newMode);
    }
  };

  const fetchClassReport = async () => {
    setLoading(true);
    const fallbackReport = students && students.length > 0
      ? generateClientClassReport({
          grade: selectedGrade,
          students,
          period,
          year,
          month,
          weekStart,
          startDate: customStartDate,
          endDate: customEndDate,
          reportMode: mode,
          records,
        })
      : null;

    try {
      const queryParams = new URLSearchParams({
        reportType: 'class',
        grade: selectedGrade,
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
        // If client records are present, ensure any newly marked students are counted
        if (records && records.length > 0 && Array.isArray(data.students)) {
          data.students = data.students.map((st: any) => {
            const clientRec = records.find((r) => r.studentId === st.id && (r.status === 'PRESENT' || r.status === 'LATE'));
            if (clientRec && st.presentCount === 0) {
              const presentCount = Math.max(1, st.presentCount);
              const totalDays = st.instructionalDays || st.totalDays || 21;
              const rate = Math.min(100, Math.round((presentCount / totalDays) * 100));
              return {
                ...st,
                presentCount,
                morningPresent: Math.max(1, st.morningPresent || 0),
                morningRate: rate,
                attendanceRate: rate,
                officialRate: rate,
                combinedRate: rate,
              };
            }
            return st;
          });
        }
        setClassData(data);
      } else if (fallbackReport) {
        setClassData(fallbackReport);
      }
    } catch (err) {
      console.warn('Backend reporting API offline or warm-up, utilizing instant client generator', err);
      if (fallbackReport) setClassData(fallbackReport);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassReport();
  }, [selectedGrade, mode, period, year, month, weekStart, customStartDate, customEndDate, records]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!classData) return;
    const wb = XLSX.utils.book_new();

    const modeLabel =
      mode === 'MORNING'
        ? 'Morning Only (Gate Entry)'
        : mode === 'AFTERNOON'
        ? 'Afternoon Only (Post-Break)'
        : mode === 'OFFICIAL'
        ? 'Official (Both Sessions)'
        : mode === 'EXTRA_CLASS'
        ? 'Extra Class Only'
        : 'Combined (Official & Extra)';

    // Summary Sheet
    const summary = [
      { Metric: 'Grade / Class', Value: classData.grade },
      { Metric: 'Report Mode', Value: modeLabel },
      { Metric: 'Class Lead Teacher', Value: classData.classTeacher },
      { Metric: 'Total Enrolled', Value: classData.totalEnrolled },
      { Metric: 'Boys', Value: classData.boysCount },
      { Metric: 'Girls', Value: classData.girlsCount },
      {
        Metric: 'Morning Attendance Rate',
        Value: classData.morningOverallRate != null ? `${classData.morningOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-',
      },
      {
        Metric: 'Afternoon Attendance Rate',
        Value: classData.afternoonOverallRate != null ? `${classData.afternoonOverallRate}%` : '-',
      },
      {
        Metric: 'Official Attendance Rate',
        Value: classData.officialOverallRate != null ? `${classData.officialOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-',
      },
      {
        Metric: 'Extra Class Attendance Rate',
        Value: (classData.totalExtraClasses || 0) > 0 && classData.extraClassOverallRate != null ? `${classData.extraClassOverallRate}%` : '-',
      },
      {
        Metric: 'Combined Attendance Rate',
        Value: classData.combinedOverallRate != null ? `${classData.combinedOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-',
      },
      { Metric: 'Total Extra Classes Held', Value: classData.totalExtraClasses ?? 0 },
      { Metric: 'Instructional Days', Value: classData.instructionalDays },
      { Metric: 'Chronic Absentees (<80%)', Value: classData.chronicCount },
      { Metric: '100% Perfect Attendance', Value: classData.perfectAttendanceCount },
      { Metric: 'Date Range', Value: `${classData.startDate} to ${classData.endDate}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Class Overview');

    // Roster Sheet tailored to Mode
    if (mode === 'MORNING') {
      const roster = (classData.students || []).map((st, idx) => ({
        '#': idx + 1,
        'Admission No': st.admissionNumber,
        'Full Name': st.fullName,
        'Dhivehi Name': st.fullNameDhivehi || '',
        Gender: st.gender,
        'Grade Level': st.gradeLevel,
        'Days Present': st.morningPresentCount ?? st.presentCount,
        'Late Entries': st.lateCount,
        'Authorized Leaves': st.leaveCount,
        'Unexcused Absences': st.absentCount,
        'Morning Attendance Rate': `${st.morningRate ?? st.attendanceRate}%`,
        'MoE Status': st.moeStatus,
      }));
      const wsRoster = XLSX.utils.json_to_sheet(roster);
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Morning Attendance Roster');
    } else if (mode === 'AFTERNOON') {
      const roster = (classData.students || []).map((st, idx) => ({
        '#': idx + 1,
        'Admission No': st.admissionNumber,
        'Full Name': st.fullName,
        'Dhivehi Name': st.fullNameDhivehi || '',
        Gender: st.gender,
        'Grade Level': st.gradeLevel,
        'Afternoon Attended': st.afternoonPresent ?? st.afternoonPresentCount ?? 0,
        'Afternoon Missed': st.afternoonAbsent ?? st.afternoonAbsentCount ?? 0,
        'Afternoon Attendance Rate': st.afternoonRate != null ? `${st.afternoonRate}%` : '-',
        'MoE Status': st.moeStatus,
      }));
      const wsRoster = XLSX.utils.json_to_sheet(roster);
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Afternoon Attendance Roster');
    } else if (mode === 'OFFICIAL') {
      const roster = (classData.students || []).map((st, idx) => ({
        '#': idx + 1,
        'Admission No': st.admissionNumber,
        'Full Name': st.fullName,
        'Dhivehi Name': st.fullNameDhivehi || '',
        Gender: st.gender,
        'Grade Level': st.gradeLevel,
        'Days Present': st.presentCount,
        'Late Entries': st.lateCount,
        'Authorized Leaves': st.leaveCount,
        'Unexcused Absences': st.absentCount,
        'Official Attendance Rate': `${st.officialRate ?? st.attendanceRate}%`,
        'MoE Status': st.moeStatus,
      }));
      const wsRoster = XLSX.utils.json_to_sheet(roster);
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Official Attendance Roster');
    } else if (mode === 'EXTRA_CLASS') {
      const roster = (classData.students || []).map((st, idx) => ({
        '#': idx + 1,
        'Admission No': st.admissionNumber,
        'Full Name': st.fullName,
        'Dhivehi Name': st.fullNameDhivehi || '',
        Gender: st.gender,
        'Grade Level': st.gradeLevel,
        'Total Extra Classes Held': st.extraClassCount ?? (classData.totalExtraClasses || 0),
        'Extra Classes Attended': st.extraClassAttended ?? 0,
        'Missed Sessions':
          (st.extraClassCount ?? (classData.totalExtraClasses || 0)) - (st.extraClassAttended ?? 0),
        'Extra Class Attendance Rate':
          (st.extraClassCount ?? (classData.totalExtraClasses || 0)) === 0 || st.extraClassRate == null
            ? '-'
            : `${st.extraClassRate}%`,
      }));
      const wsRoster = XLSX.utils.json_to_sheet(roster);
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Extra Class Roster');
    } else {
      const roster = (classData.students || []).map((st, idx) => ({
        '#': idx + 1,
        'Admission No': st.admissionNumber,
        'Full Name': st.fullName,
        'Dhivehi Name': st.fullNameDhivehi || '',
        Gender: st.gender,
        'Grade Level': st.gradeLevel,
        'Official Rate (%)': `${st.officialRate ?? st.attendanceRate}%`,
        'Extra Classes Attended': `${st.extraClassAttended ?? 0} / ${
          st.extraClassCount ?? (classData.totalExtraClasses || 0)
        }`,
        'Extra Class Rate (%)':
          (st.extraClassCount ?? (classData.totalExtraClasses || 0)) === 0 || st.extraClassRate == null
            ? '-'
            : `${st.extraClassRate}%`,
        'Combined Total Rate (%)': `${st.combinedRate ?? st.attendanceRate}%`,
        'MoE Status': st.moeStatus,
      }));
      const wsRoster = XLSX.utils.json_to_sheet(roster);
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Combined Student Matrix');
    }

    // Extra classes held sheet
    if (classData.extraClassesHeld && classData.extraClassesHeld.length > 0) {
      const ecSheetData = classData.extraClassesHeld.map((ec) => ({
        Date: ec.date,
        Subject: ec.subject,
        'Class Title': ec.title,
        Time: `${ec.startTime} - ${ec.endTime}`,
        Venue: ec.venue || 'Classroom',
        Teacher: ec.teacherName || '',
        Status: ec.status,
      }));
      const wsEc = XLSX.utils.json_to_sheet(ecSheetData);
      XLSX.utils.book_append_sheet(wb, wsEc, 'Extra Classes Conducted');
    }

    XLSX.writeFile(
      wb,
      `Class_Report_${(classData.grade || 'ALL').replace(/\s+/g, '_')}_${mode}_${period || 'all'}.xlsx`
    );
  };

  const filteredStudents =
    classData?.students.filter((s) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.fullNameDhivehi && s.fullNameDhivehi.includes(q)) ||
        s.admissionNumber.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <div className="space-y-6">
      {/* Filters & Selector Bar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Grade Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>{isRTL ? 'ކްލާސް / ގްރޭޑް ޚިޔާރުކުރައްވާ' : 'Select Class / Grade Level'}</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedGrade('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedGrade === 'ALL'
                    ? 'bg-sky-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Grades'}
              </button>
              {ALL_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="w-full md:w-64">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? 'ކްލާހުގެ ދަރިވަރުން ފިލްޓަރ' : 'Filter Roster'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={isRTL ? 'ދަރިވަރުގެ ނަން...' : 'Search student...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* REPORT MODE TOGGLE BAR */}
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

          <span className="text-[11px] font-medium text-slate-500">
            {mode === 'MORNING'
              ? 'Morning gate check-in session'
              : mode === 'AFTERNOON'
              ? 'Post-break afternoon retention session'
              : mode === 'OFFICIAL'
              ? 'Morning & afternoon instructional sessions'
              : mode === 'EXTRA_CLASS'
              ? 'Remedial tutorials & exam prep sessions'
              : 'Unified view of official hours & extra classes'}
          </span>
        </div>

        {/* Period Selector & Action Buttons */}
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
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                />
                <span>-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                />
              </div>
            )}

            <button
              type="button"
              onClick={fetchClassReport}
              disabled={loading}
              className="p-1.5 px-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Class Attendance Data"
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
              <span>{isRTL ? 'ޕްރިންޓް' : 'Print Register'}</span>
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
              ? 'ކްލާހުގެ ތަފާސްހިސާބު ލޯޑްވަނީ...'
              : 'Calculating class attendance statistics...'}
          </span>
        </div>
      )}

      {classData && !loading && (
        <div className="space-y-6">
          {/* Main Register Container */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {classData.grade?.startsWith('Grade')
                    ? classData.grade.replace('Grade ', 'G')
                    : classData.grade || 'ALL'}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    {classData.grade === 'ALL'
                      ? 'WHOLE SCHOOL ATTENDANCE REGISTER'
                      : `${(classData.grade || '').toUpperCase()} ATTENDANCE REGISTER`}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span>
                      F. Magoodhoo School • Homeroom Teacher:{' '}
                      <strong className="text-slate-800">{classData.classTeacher}</strong>
                    </span>
                    <span className="font-bold text-sky-900">
                      •{' '}
                      {mode === 'MORNING'
                        ? 'Morning Sessions Only'
                        : mode === 'AFTERNOON'
                        ? 'Afternoon Sessions Only'
                        : mode === 'OFFICIAL'
                        ? 'Official Sessions Only'
                        : mode === 'EXTRA_CLASS'
                        ? 'Extra Class Only'
                        : 'Combined (Official & Extra)'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    mode === 'MORNING'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : mode === 'AFTERNOON'
                      ? 'bg-teal-100 text-teal-800 border border-teal-300'
                      : mode === 'OFFICIAL'
                      ? 'bg-slate-100 text-slate-800 border border-slate-300'
                      : mode === 'EXTRA_CLASS'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {mode === 'MORNING' && <Clock className="w-3 h-3" />}
                  {mode === 'AFTERNOON' && <Clock className="w-3 h-3" />}
                  {mode === 'OFFICIAL' && <Building className="w-3 h-3" />}
                  {mode === 'EXTRA_CLASS' && <BookOpen className="w-3 h-3" />}
                  {mode === 'BOTH' && <Sparkles className="w-3 h-3" />}
                  <span>{mode} MODE</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {classData.startDate} → {classData.endDate}
                </p>
              </div>
            </div>

            {/* KPI Cards tailored to selected mode */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Primary Rate Card */}
              <div
                className={`p-3.5 rounded-xl border ${
                  mode === 'MORNING'
                    ? 'bg-sky-50/90 border-sky-200'
                    : mode === 'AFTERNOON'
                    ? 'bg-teal-50/90 border-teal-200'
                    : mode === 'EXTRA_CLASS'
                    ? 'bg-purple-50/90 border-purple-200'
                    : mode === 'BOTH'
                    ? 'bg-emerald-50/90 border-emerald-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    mode === 'MORNING'
                      ? 'text-sky-700'
                      : mode === 'AFTERNOON'
                      ? 'text-teal-700'
                      : mode === 'EXTRA_CLASS'
                      ? 'text-purple-700'
                      : mode === 'BOTH'
                      ? 'text-emerald-800'
                      : 'text-slate-700'
                  }`}
                >
                  {mode === 'MORNING'
                    ? 'Morning Rate'
                    : mode === 'AFTERNOON'
                    ? 'Afternoon Rate'
                    : mode === 'EXTRA_CLASS'
                    ? 'Extra Class Rate'
                    : mode === 'BOTH'
                    ? 'Combined Rate'
                    : 'Official Rate'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className={`text-2xl font-black ${
                      mode === 'MORNING'
                        ? 'text-sky-950'
                        : mode === 'AFTERNOON'
                        ? 'text-teal-950'
                        : mode === 'EXTRA_CLASS'
                        ? 'text-purple-950'
                        : mode === 'BOTH'
                        ? 'text-emerald-950'
                        : 'text-slate-950'
                    }`}
                  >
                    {mode === 'MORNING'
                      ? (classData.morningOverallRate != null ? `${classData.morningOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-')
                      : mode === 'AFTERNOON'
                      ? (classData.afternoonOverallRate != null ? `${classData.afternoonOverallRate}%` : '-')
                      : mode === 'EXTRA_CLASS'
                      ? ((classData.totalExtraClasses || 0) === 0 || classData.extraClassOverallRate == null ? '-' : `${classData.extraClassOverallRate}%`)
                      : mode === 'BOTH'
                      ? (classData.combinedOverallRate != null ? `${classData.combinedOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-')
                      : (classData.officialOverallRate != null ? `${classData.officialOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {mode === 'MORNING' && 'Gate Check-in MoE Min: ≥80.0%'}
                  {mode === 'AFTERNOON' && 'Post-break retention rate'}
                  {mode === 'BOTH' && `Official: ${classData.officialOverallRate != null ? `${classData.officialOverallRate}%` : classData.overallRate != null ? `${classData.overallRate}%` : '-'}`}
                  {mode === 'OFFICIAL' && 'MoE Target: ≥80.0%'}
                  {mode === 'EXTRA_CLASS' && `${classData.totalExtraClasses ?? 0} sessions held`}
                </span>
              </div>

              {/* Enrolled Students */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {isRTL ? 'ދަރިވަރުންގެ އަދަދު' : 'Total Enrolled'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">{classData.totalEnrolled}</span>
                  <span className="text-xs text-slate-400">students</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {classData.boysCount} Boys • {classData.girlsCount} Girls
                </span>
              </div>

              {/* Instructional Days / Sessions Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {mode === 'EXTRA_CLASS' ? 'Extra Classes Held' : 'Instructional Days'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">
                    {mode === 'EXTRA_CLASS'
                      ? classData.totalExtraClasses ?? 0
                      : classData.instructionalDays}
                  </span>
                  <span className="text-xs text-slate-400">
                    {mode === 'EXTRA_CLASS' ? 'classes' : 'days'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  {mode === 'EXTRA_CLASS'
                    ? 'Remedial & Clinics'
                    : `${classData.closedDaysDeducted ?? 0} closed days deducted`}
                </span>
              </div>

              {/* Secondary Rate or Perfect Attendance */}
              {mode === 'BOTH' ? (
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">
                    Extra Class Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-purple-950">
                      {classData.extraClassOverallRate ?? 100}%
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600 block mt-0.5">
                    {classData.totalExtraClasses ?? 0} classes held
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                    100% Perfect Attendance
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-900">
                      {classData.perfectAttendanceCount}
                    </span>
                    <span className="text-xs text-emerald-600">students</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {Math.round(
                      (classData.perfectAttendanceCount / (classData.totalEnrolled || 1)) * 100
                    )}
                    % of class
                  </span>
                </div>
              )}

              {/* Chronic Absentees */}
              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">
                  Chronic Absentees (&lt;80%)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-rose-900">{classData.chronicCount}</span>
                  <span className="text-xs text-rose-600">students</span>
                </div>
                <span className="text-[10px] text-rose-600 block mt-0.5">
                  {classData.chronicCount > 0 ? 'Requires parent counseling' : 'No at-risk students'}
                </span>
              </div>
            </div>

            {/* STUDENT ROSTER TABLE (ADAPTED TO MODE) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-sky-700" />
                  <span>
                    {mode === 'MORNING'
                      ? 'Morning Gate Check-in Attendance Register'
                      : mode === 'AFTERNOON'
                      ? 'Afternoon Post-Break Session Attendance Register'
                      : mode === 'OFFICIAL'
                      ? 'Student Attendance Register (Official Morning & Afternoon)'
                      : mode === 'EXTRA_CLASS'
                      ? 'Student Extra Class Attendance Matrix'
                      : 'Comprehensive Student Matrix (Official + Extra Classes)'}
                  </span>
                  <span className="text-slate-400 font-normal">
                    ({filteredStudents.length} students)
                  </span>
                </h3>

                <span className="text-[11px] text-slate-400">
                  Tip: Click on any student row or button to view individual report
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Adm No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">Gender</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>

                      {/* Columns based on mode */}
                      {mode === 'MORNING' && (
                        <>
                          <th className="py-2.5 px-3 text-center font-bold text-emerald-800">Present (AM)</th>
                          <th className="py-2.5 px-3 text-center text-amber-800">Late</th>
                          <th className="py-2.5 px-3 text-center text-indigo-800">Leave</th>
                          <th className="py-2.5 px-3 text-center font-bold text-rose-800">Absent (AM)</th>
                          <th className="py-2.5 px-3 text-center font-black">Morning Rate %</th>
                        </>
                      )}

                      {mode === 'AFTERNOON' && (
                        <>
                          <th className="py-2.5 px-3 text-center font-bold text-teal-800">Attended (PM)</th>
                          <th className="py-2.5 px-3 text-center font-bold text-rose-800">Missed (PM)</th>
                          <th className="py-2.5 px-3 text-center font-black text-teal-900">Afternoon Rate %</th>
                        </>
                      )}

                      {mode === 'OFFICIAL' && (
                        <>
                          <th className="py-2.5 px-3 text-center font-bold text-emerald-800">Present</th>
                          <th className="py-2.5 px-3 text-center text-amber-800">Late</th>
                          <th className="py-2.5 px-3 text-center text-indigo-800">Leave</th>
                          <th className="py-2.5 px-3 text-center font-bold text-rose-800">Absent</th>
                          <th className="py-2.5 px-3 text-center font-black">Official Rate %</th>
                        </>
                      )}

                      {mode === 'EXTRA_CLASS' && (
                        <>
                          <th className="py-2.5 px-3 text-center font-bold text-purple-900">
                            Extra Classes Held
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-emerald-800">
                            Attended
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-rose-800">Missed</th>
                          <th className="py-2.5 px-3 text-center font-black text-purple-900">
                            Extra Class Rate %
                          </th>
                        </>
                      )}

                      {mode === 'BOTH' && (
                        <>
                          <th className="py-2.5 px-3 text-center font-bold text-sky-800">
                            Official Rate %
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-purple-800">
                            Extra Attended
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-purple-800">
                            Extra Rate %
                          </th>
                          <th className="py-2.5 px-3 text-center font-black text-emerald-900">
                            Combined Total %
                          </th>
                        </>
                      )}

                      <th className="py-2.5 px-3 text-center">MoE Status</th>
                      <th className="py-2.5 px-3 text-right no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st, idx) => (
                      <tr
                        key={st.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                        onClick={() => onSelectStudent(st.id)}
                      >
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {st.admissionNumber}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{st.fullName}</div>
                          {st.fullNameDhivehi && (
                            <div className="text-[11px] text-slate-500 font-thaana">
                              {st.fullNameDhivehi}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              st.gender === 'MALE'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {st.gender === 'MALE' ? 'M' : 'F'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600 font-semibold">
                          {st.gradeLevel}
                        </td>

                        {/* Mode MORNING values */}
                        {mode === 'MORNING' && (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-emerald-700 font-mono">
                              {st.morningPresentCount ?? st.presentCount}
                            </td>
                            <td className="py-2 px-3 text-center text-amber-700 font-mono">
                              {st.lateCount}
                            </td>
                            <td className="py-2 px-3 text-center text-indigo-700 font-mono">
                              {st.leaveCount}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-rose-700 font-mono">
                              {st.absentCount}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                              {st.morningRate ?? st.attendanceRate}%
                            </td>
                          </>
                        )}

                        {/* Mode AFTERNOON values */}
                        {mode === 'AFTERNOON' && (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-teal-700 font-mono">
                              {st.afternoonPresent ?? st.afternoonPresentCount ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-rose-700 font-mono">
                              {st.afternoonAbsent ?? st.afternoonAbsentCount ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-teal-900">
                              {st.afternoonRate != null ? `${st.afternoonRate}%` : '-'}
                            </td>
                          </>
                        )}

                        {/* Mode OFFICIAL values */}
                        {mode === 'OFFICIAL' && (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-emerald-700 font-mono">
                              {st.presentCount}
                            </td>
                            <td className="py-2 px-3 text-center text-amber-700 font-mono">
                              {st.lateCount}
                            </td>
                            <td className="py-2 px-3 text-center text-indigo-700 font-mono">
                              {st.leaveCount}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-rose-700 font-mono">
                              {st.absentCount}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                              {st.officialRate ?? st.attendanceRate}%
                            </td>
                          </>
                        )}

                        {/* Mode EXTRA_CLASS values */}
                        {mode === 'EXTRA_CLASS' && (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-purple-900 font-mono">
                              {st.extraClassCount ?? (classData.totalExtraClasses || 0)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-700 font-mono">
                              {st.extraClassAttended ?? 0}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-rose-700 font-mono">
                              {(st.extraClassCount ?? (classData.totalExtraClasses || 0)) -
                                (st.extraClassAttended ?? 0)}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-purple-900">
                              {(st.extraClassCount ?? (classData.totalExtraClasses || 0)) === 0 || st.extraClassRate == null ? '-' : `${st.extraClassRate}%`}
                            </td>
                          </>
                        )}

                        {/* Mode BOTH values */}
                        {mode === 'BOTH' && (
                          <>
                            <td className="py-2 px-3 text-center font-mono font-bold text-sky-800">
                              {st.officialRate ?? st.attendanceRate}%
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-purple-900">
                              {st.extraClassAttended ?? 0} /{' '}
                              {st.extraClassCount ?? (classData.totalExtraClasses || 0)}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-purple-800">
                              {(st.extraClassCount ?? (classData.totalExtraClasses || 0)) === 0 || st.extraClassRate == null ? '-' : `${st.extraClassRate}%`}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-emerald-950 bg-emerald-50/50">
                              {st.combinedRate ?? st.attendanceRate}%
                            </td>
                          </>
                        )}

                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.moeStatus === 'EXEMPLARY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.moeStatus === 'SATISFACTORY'
                                ? 'bg-sky-100 text-sky-800'
                                : st.moeStatus === 'AT_RISK'
                                ? 'bg-rose-100 text-rose-800 font-black'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {st.moeStatus}
                          </span>
                        </td>
                        <td
                          className="py-2 px-3 text-right no-print"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectStudent(st.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] transition cursor-pointer"
                          >
                            <span>Report</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extra Classes Conducted Section for Class */}
            {(mode === 'EXTRA_CLASS' || mode === 'BOTH') &&
              classData.extraClassesHeld &&
              classData.extraClassesHeld.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                    <span>Extra Classes & Remedial Clinics Scheduled for {classData.grade}</span>
                    <span className="text-slate-400 font-normal">
                      ({classData.extraClassesHeld.length} sessions)
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {classData.extraClassesHeld.map((ec) => (
                      <div
                        key={ec.id}
                        className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">
                            {ec.subject}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">{ec.date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{ec.title}</p>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>
                            {ec.startTime} - {ec.endTime} • {ec.venue || 'Classroom'}
                          </span>
                          <span className="text-purple-800 font-semibold">
                            {ec.teacherName || 'Teacher'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Print Signatures */}
            <div className="hidden print:grid grid-cols-2 gap-12 pt-10 mt-10 border-t border-slate-300 text-xs">
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Class Lead Teacher Signature</p>
                <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Principal Signature & Stamp</p>
                <p className="text-[10px] text-slate-500">F. Magoodhoo School</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
