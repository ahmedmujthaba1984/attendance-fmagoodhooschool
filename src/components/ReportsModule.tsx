import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  User as UserIcon,
  Users,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Clock,
  Building,
  BookOpen,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../i18n/LanguageContext';
import { MoEGradeStat, Student, AttendanceRecord, AttendanceReportMode, GradeLevel, User } from '../types';
import { StudentReportView } from './reports/StudentReportView';
import { ClassReportView } from './reports/ClassReportView';
import { WeeklyReportView } from './reports/WeeklyReportView';
import { MonthlyReportView } from './reports/MonthlyReportView';
import { YearlyReportView } from './reports/YearlyReportView';
import { ReportCardAttendanceView } from './reports/ReportCardAttendanceView';

interface ReportsModuleProps {
  gradeStats: MoEGradeStat[];
  students: Student[];
  records: AttendanceRecord[];
  selectedDate: string;
  overallRate: number;
  activeLeaves: number;
  lateEntries: number;
  notInIsland: number;
  totalDaysNeedToPresent?: number;
  closedDaysDeducted?: number;
  isSchoolClosed?: boolean;
  selectedGrade?: GradeLevel | 'ALL';
  currentUser?: User | null;
  onRefresh?: () => void;
}

type MainReportTab = 'reportCard' | 'student' | 'class' | 'weekly' | 'monthly' | 'yearly' | 'overview';

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  gradeStats,
  students,
  records,
  selectedDate,
  overallRate,
  activeLeaves,
  lateEntries,
  notInIsland,
  totalDaysNeedToPresent = 191,
  closedDaysDeducted = 9,
  isSchoolClosed = false,
  selectedGrade,
  currentUser,
  onRefresh,
}) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<MainReportTab>('overview');

  // Intelligent default student based on current user / selected grade
  const initialStudentId = useMemo(() => {
    if (records.length > 0) {
      const foundInRec = students.find((s) =>
        records.some((r) => r.studentId === s.id && r.status && r.status !== 'UNMARKED')
      );
      if (foundInRec) return foundInRec.id;
    }
    if (currentUser?.assignedGrade) {
      const gradeStudent = students.find((s) => s.gradeLevel === currentUser.assignedGrade);
      if (gradeStudent) return gradeStudent.id;
    }
    if (selectedGrade && selectedGrade !== 'ALL') {
      const gradeStudent = students.find((s) => s.gradeLevel === selectedGrade);
      if (gradeStudent) return gradeStudent.id;
    }
    return students[0]?.id || '';
  }, [records, students, currentUser, selectedGrade]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [reportMode, setReportMode] = useState<AttendanceReportMode>('BOTH');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn('Could not refresh reports', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (initialStudentId && (!selectedStudentId || !students.some((s) => s.id === selectedStudentId))) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId, students, selectedStudentId]);

  // Guaranteed grade-level statistics from client records if server stats are pending/offline
  const effectiveGradeStats = useMemo(() => {
    const hasPropsData = gradeStats && gradeStats.some((gs) =>
      gs.morningPresent > 0 || gs.morningLate > 0 || gs.morningAbsent > 0 ||
      gs.postBreakPresent > 0 || (gs.postBreakLate ?? 0) > 0 || (gs.postBreakAbsent ?? 0) > 0
    );
    if (hasPropsData) return gradeStats;

    const ALL_GRADES_LIST: GradeLevel[] = [
      'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    ];

    const todayMap = new Map<string, AttendanceRecord>();
    records.forEach((r) => {
      if (r.date === selectedDate) {
        todayMap.set(`${r.studentId}_${r.sessionType}`, r);
      }
    });

    return ALL_GRADES_LIST.map((grade) => {
      const gradeStudents = students.filter((s) => s.gradeLevel === grade);
      const totalEnrolled = gradeStudents.length || 1;

      let mPres = 0;
      let mLate = 0;
      let mLeave = 0;
      let mAbs = 0;
      let pPres = 0;
      let pLate = 0;
      let pLeave = 0;
      let pAbs = 0;
      let recCount = 0;
      let postRecCount = 0;

      gradeStudents.forEach((st) => {
        const mRec = todayMap.get(`${st.id}_MORNING_BEFORE_BREAK`);
        const pRec = todayMap.get(`${st.id}_POST_BREAK`);

        if (mRec && mRec.status) {
          recCount++;
          if (mRec.status === 'PRESENT') mPres++;
          else if (mRec.status === 'LATE') mLate++;
          else if (mRec.status === 'LEAVE') mLeave++;
          else if (mRec.status === 'ABSENT') mAbs++;
        }
        if (pRec && pRec.status) {
          postRecCount++;
          if (pRec.status === 'PRESENT') pPres++;
          else if (pRec.status === 'LATE') pLate++;
          else if (pRec.status === 'LEAVE') pLeave++;
          else if (pRec.status === 'ABSENT') pAbs++;
        }
      });

      const mRate = recCount > 0 ? Math.round(((mPres + mLate) / recCount) * 100) : null;
      const pRate = postRecCount > 0 ? Math.round(((pPres + pLate) / postRecCount) * 100) : null;
      const rate = mRate !== null && pRate !== null
        ? Math.round((mRate + pRate) / 2)
        : mRate !== null
        ? mRate
        : pRate;

      let gradeChronic = 0;
      gradeStudents.forEach((st) => {
        const mRec = todayMap.get(`${st.id}_MORNING_BEFORE_BREAK`);
        const pRec = todayMap.get(`${st.id}_POST_BREAK`);
        let stPres = 0;
        let stRec = 0;
        if (mRec && mRec.status) {
          stRec++;
          if (mRec.status === 'PRESENT' || mRec.status === 'LATE') stPres++;
        }
        if (pRec && pRec.status) {
          stRec++;
          if (pRec.status === 'PRESENT' || pRec.status === 'LATE') stPres++;
        }
        if (stRec > 0 && Math.round((stPres / stRec) * 100) < 80) {
          gradeChronic++;
        }
      });

      return {
        grade,
        totalEnrolled,
        morningPresent: mPres,
        morningAbsent: mAbs,
        morningLate: mLate,
        morningLeave: mLeave,
        postBreakPresent: pPres,
        postBreakLate: pLate,
        postBreakLeave: pLeave,
        postBreakAbsent: pAbs,
        attendanceRate: rate,
        chronicAbsenteesCount: gradeChronic,
        isSchoolClosed,
      };
    });
  }, [gradeStats, records, students, selectedDate, isSchoolClosed]);

  const computedOverallRate = useMemo(() => {
    if (overallRate != null && overallRate > 0) return overallRate;
    const recorded = effectiveGradeStats.filter((g) => g.attendanceRate != null);
    if (recorded.length > 0) {
      const sum = recorded.reduce((acc, g) => acc + (g.attendanceRate || 0), 0);
      return Math.round(sum / recorded.length);
    }
    return overallRate;
  }, [overallRate, effectiveGradeStats]);

  const handleSelectStudentFromClass = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('student');
  };

  const handleExportCSV = () => {
    const headers = [
      'Grade Level',
      'Total Enrolled',
      'Morning Present',
      'Morning Late',
      'Morning Leave',
      'Morning Absent',
      'Afternoon Present',
      'Afternoon Late',
      'Afternoon Leave',
      'Afternoon Absent',
      'Attendance Rate (%)',
    ];

    const rows = gradeStats.map((g) => [
      g.grade,
      g.totalEnrolled,
      g.morningPresent,
      g.morningLate,
      g.morningLeave,
      g.morningAbsent,
      g.postBreakPresent,
      g.postBreakLate ?? 0,
      g.postBreakLeave ?? 0,
      g.postBreakAbsent,
      `${g.attendanceRate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MoE_Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Grade Summary
    const summaryData = effectiveGradeStats.map((g) => ({
      'Grade Level': g.grade,
      'Total Students': g.totalEnrolled,
      'Morning Present': g.morningPresent,
      'Morning Late': g.morningLate,
      'Morning Leave': g.morningLeave,
      'Morning Absent': g.morningAbsent,
      'Afternoon Present': g.postBreakPresent,
      'Afternoon Late': g.postBreakLate ?? 0,
      'Afternoon Leave': g.postBreakLeave ?? 0,
      'Afternoon Absent': g.postBreakAbsent,
      'Attendance Rate': g.attendanceRate != null ? `${g.attendanceRate}%` : '-',
    }));
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'MoE Grade Breakdown');

    XLSX.writeFile(wb, `MoE_Compliance_F_Magoodhoo_${selectedDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation Bar: All Requested Report Types */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-700" />
              <span>{isRTL ? 'ހާޒިރީ ރިޕޯޓް އަދި ތަފާސްހިސާބު' : 'Attendance Reports & MoE Analytics'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRTL
                ? 'ދަރިވަރުން، ކްލާސްތައް، ހަފްތާ، މަހު އަދި އަހަރީ ރިޕޯޓްތައް ރަސްމީ މިންގަނޑުތަކާ އެއްގޮތަށް'
                : 'Comprehensive reporting suite for Individual Students, Classes, Weekly, Monthly, and Yearly returns'}
            </p>
          </div>

          {/* Quick Active Session Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">{isRTL ? 'ބާވަތް:' : 'Session:'}</span>
            </span>
            <button
              type="button"
              onClick={() => setReportMode('MORNING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                reportMode === 'MORNING'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isRTL ? 'ހެނދުނު' : 'Morning'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode('AFTERNOON')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                reportMode === 'AFTERNOON'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isRTL ? 'މެންދުރުފަސް' : 'Afternoon'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode('OFFICIAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                reportMode === 'OFFICIAL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>{isRTL ? 'ރަސްމީ' : 'Official'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode('EXTRA_CLASS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                reportMode === 'EXTRA_CLASS'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>{isRTL ? 'އިތުރު' : 'Extra'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode('BOTH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                reportMode === 'BOTH'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{isRTL ? 'ހުރިހާ' : 'All'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs active:scale-95 disabled:opacity-50 ml-1"
              title="Refresh all attendance reports data"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRTL ? 'އައުކުރޭ' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Primary Report Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Report Card Attendance (Term & Year) */}
          <button
            type="button"
            onClick={() => setActiveTab('reportCard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reportCard'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRTL ? 'ރިޕޯޓް ކާޑު ހާޒިރީ' : 'Report Card Attendance'}</span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
              Term / Year
            </span>
          </button>

          {/* Student Report Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ދަރިވަރުގެ ރިޕޯޓް' : 'Student Report'}</span>
          </button>

          {/* Class Report Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('class')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'class'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ކްލާހުގެ ރިޕޯޓް' : 'Class Report'}</span>
          </button>

          {/* Weekly Report Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ހަފްތާގެ ރިޕޯޓް' : 'Weekly Report'}</span>
          </button>

          {/* Monthly Report Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{isRTL ? 'މަހުގެ ރިޕޯޓް' : 'Monthly Report'}</span>
          </button>

          {/* Yearly Report Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'yearly'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{isRTL ? 'އަހަރީ ރިޕޯޓް' : 'Yearly Report'}</span>
          </button>

          {/* Daily MoE Overview Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-sky-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ދުވަހުގެ MoE ޚުލާޞާ' : 'Daily MoE Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Render Selected Report View */}
      {activeTab === 'reportCard' && (
        <ReportCardAttendanceView students={students} records={records} />
      )}

      {activeTab === 'student' && (
        <StudentReportView
          students={students}
          records={records}
          selectedDate={selectedDate}
          initialStudentId={selectedStudentId}
          reportMode={reportMode}
          onReportModeChange={setReportMode}
        />
      )}

      {activeTab === 'class' && (
        <ClassReportView
          onSelectStudent={handleSelectStudentFromClass}
          initialGrade={(selectedGrade && selectedGrade !== 'ALL') ? selectedGrade : (currentUser?.assignedGrade || 'Grade 7')}
          reportMode={reportMode}
          onReportModeChange={setReportMode}
          records={records}
          students={students}
        />
      )}

      {activeTab === 'weekly' && (
        <WeeklyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
          students={students}
          records={records}
        />
      )}

      {activeTab === 'monthly' && (
        <MonthlyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
          students={students}
          records={records}
        />
      )}

      {activeTab === 'yearly' && (
        <YearlyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
          students={students}
          records={records}
        />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Action Bar for MoE Daily Summary */}
          <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700">Daily Register for Date:</span>
              <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                {selectedDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print MoE Format</span>
              </button>
            </div>
          </div>

          {/* Printable MoE Document Container */}
          <div id="moe-print-container" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {/* Official Maldives Ministry Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center">
              <div className="text-xl font-black text-slate-950 tracking-tight">
                {isRTL ? 'މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަން • ދިވެހިރާއްޖެ' : 'MINISTRY OF EDUCATION • REPUBLIC OF MALDIVES'}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {isRTL ? 'ފ. މަގޫދޫ ސްކޫލް (ކޯޑް: SCH-F02)' : 'F. MAGOODHOO SCHOOL (CENTRE CODE: SCH-F02)'}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                Daily Attendance & Attendance Compliance Register • Date: {selectedDate}
              </div>
            </div>

            {/* High-Level Executive Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
              <div>
                <span className="text-slate-500 block">{isRTL ? 'ޖުމްލަ އެންރޯލްމަންޓް:' : 'Total Enrollment:'}</span>
                <span className="text-base font-black text-slate-900">
                  {isRTL
                    ? `${students.length || 215} ދަރިވަރުން`
                    : `${students.length || 215} Students`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{isRTL ? 'މިއަދުގެ ހާޒިރީ:' : 'Attendance Rate:'}</span>
                <span className="text-base font-black text-emerald-700">
                  {isSchoolClosed ? (isRTL ? 'ބަންދު (100%)' : 'Closed (Excused)') : (computedOverallRate != null ? `${computedOverallRate}%` : '-')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{isRTL ? 'ހުއްދަ ލިބިފައިވާ ސަލާމް:' : 'Documented Leaves:'}</span>
                <span className="text-base font-black text-indigo-700">{activeLeaves} Leaves</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isRTL ? 'ރަށުގައި ނެތް (ދަތުރު):' : 'Not In Island (Travel):'}</span>
                <span className="text-base font-black text-violet-700">{notInIsland} Students</span>
              </div>
            </div>

            {/* MoE Instructional Days Quota & Closed Days Deduction Metric */}
            <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 mb-6 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-950">
                  {isRTL ? 'ހާޒިރުވާންޖެހޭ ރަސްމީ ކިޔަވައިދޭ ދުވަސްތައް (MoE Standard):' : 'Official Instructional Days Required:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md font-black bg-sky-100 text-sky-900 border border-sky-300">
                  {totalDaysNeedToPresent} {isRTL ? 'ދުވަސް' : 'Days Need to Present'}
                </span>
                <span className="text-slate-600 font-medium">
                  ({closedDaysDeducted} {isRTL ? 'ދުވަސް ބަންދުވުމުން އުނިކުރެވިފައި' : 'Closed Days Deducted from 200 Annual Quota'})
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                ✓ {isRTL ? 'ބަންދު ދުވަސްތައް ޣައިރުޙާޟިރެއް ނޫން (Exempt)' : 'Closed Days are Deducted & Not Counted as Absent'}
              </div>
            </div>

            {isSchoolClosed && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-3">
                <div className="font-bold">
                  🏛️ {isRTL
                    ? 'މި ތާރީޚަކީ ރަސްމީކޮށް ސްކޫލް ބަންދު ދުވަހެކެވެ. ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ ވަނީ "School Closed (Excused)" ގޮތުގައި ރެކޯޑްކުރެވިފައެވެ. މި ދުވަސް ޣައިރުޙާޟިރެއްގެ ގޮތުގައި ނުގުނޭނެއެވެ.'
                    : 'Notice: School is officially designated as closed on this date. All student attendance is recorded as "School Closed" (Excused) and is excluded from absences. This day is deducted from the total required present days.'}
                </div>
                <span className="px-2.5 py-1 rounded-md bg-rose-200 font-black text-[10px] text-rose-900 shrink-0">
                  EXCUSED
                </span>
              </div>
            )}

            {/* Header for Grade-by-Grade MoE Matrix */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {isRTL ? 'ގްރޭޑްތަކުގެ ތަފްސީލު (LKG - 10)' : 'Grade-by-Grade MoE Matrix (12 Grades)'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {isRTL ? '12 ގްރޭޑް' : '12 Grade Levels (LKG to Grade 10)'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-t border-slate-200">
                    <th rowSpan={2} className="py-2.5 px-3 border-b border-r border-slate-200 align-middle">{t.gradeLevel}</th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center border-b border-r border-slate-200 align-middle">{t.enrolled}</th>
                    <th colSpan={4} className="py-2 px-3 text-center bg-sky-50/80 text-sky-900 border-b border-r border-slate-200 font-black">
                      {isRTL ? 'ހެނދުނު ދަންފަޅި (Morning Session)' : 'Morning Session'}
                    </th>
                    <th colSpan={4} className="py-2 px-3 text-center bg-teal-50/80 text-teal-900 border-b border-r border-slate-200 font-black">
                      {isRTL ? 'މެންދުރުފަސް ދަންފަޅި (Afternoon Session)' : 'Afternoon Session'}
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center border-b border-r border-slate-200 align-middle">{t.attendanceRate}</th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center border-b border-slate-200 align-middle">MoE Status</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    {/* Morning columns */}
                    <th className="py-2 px-2.5 text-center text-emerald-800 bg-sky-50/30">{isRTL ? 'ހާޒިރު' : 'Present'}</th>
                    <th className="py-2 px-2.5 text-center text-amber-800 bg-sky-50/30">{isRTL ? 'ލަސްވި' : 'Late'}</th>
                    <th className="py-2 px-2.5 text-center text-indigo-800 bg-sky-50/30">{isRTL ? 'ސަލާމް' : 'Leave'}</th>
                    <th className="py-2 px-2.5 text-center text-rose-800 bg-sky-50/30 border-r border-slate-200">{isRTL ? 'ޣައިރު' : 'Absent'}</th>
                    {/* Afternoon columns */}
                    <th className="py-2 px-2.5 text-center text-teal-800 bg-teal-50/30">{isRTL ? 'ހާޒިރު' : 'Present'}</th>
                    <th className="py-2 px-2.5 text-center text-amber-800 bg-teal-50/30">{isRTL ? 'ލަސްވި' : 'Late'}</th>
                    <th className="py-2 px-2.5 text-center text-indigo-800 bg-teal-50/30">{isRTL ? 'ސަލާމް' : 'Leave'}</th>
                    <th className="py-2 px-2.5 text-center text-rose-800 bg-teal-50/30 border-r border-slate-200">{isRTL ? 'ޣައިރު' : 'Absent'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveGradeStats.map((stat) => (
                    <tr key={stat.grade} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">{stat.grade}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-100">{stat.totalEnrolled}</td>
                      {/* Morning breakdown */}
                      <td className="py-2.5 px-2.5 text-center font-semibold text-emerald-700">{stat.morningPresent}</td>
                      <td className="py-2.5 px-2.5 text-center text-amber-700">{stat.morningLate}</td>
                      <td className="py-2.5 px-2.5 text-center text-indigo-700">{stat.morningLeave}</td>
                      <td className="py-2.5 px-2.5 text-center text-rose-700 font-semibold border-r border-slate-200/80">{stat.morningAbsent}</td>
                      {/* Afternoon breakdown */}
                      <td className="py-2.5 px-2.5 text-center font-semibold text-teal-700">{stat.postBreakPresent}</td>
                      <td className="py-2.5 px-2.5 text-center text-amber-700">{stat.postBreakLate ?? 0}</td>
                      <td className="py-2.5 px-2.5 text-center text-indigo-700">{stat.postBreakLeave ?? 0}</td>
                      <td className="py-2.5 px-2.5 text-center text-rose-700 font-semibold border-r border-slate-200/80">{stat.postBreakAbsent}</td>
                      {/* Rate & Status */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                        {stat.attendanceRate != null ? `${stat.attendanceRate}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {stat.attendanceRate != null ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stat.attendanceRate >= 90
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {stat.attendanceRate >= 90 ? 'Compliant' : 'Target <90%'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official MoE Signature Block for Prints */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              <div>
                <div className="border-b border-slate-400 pb-6 mb-1"></div>
                <span className="font-bold text-slate-900 block">Mohamed Fayaz</span>
                <span className="text-slate-600 text-[11px]">{isRTL ? 'ޕްރިންސިޕަލް' : 'Principal / Head of School'}</span>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-6 mb-1"></div>
                <span className="font-bold text-slate-900 block">Ahmed Mujthaba</span>
                <span className="text-slate-600 text-[11px]">{isRTL ? 'ޕޯޓަލް އެޑްމިނިސްޓްރޭޓަރ / ސީނިއަރ އެޑްމިން އޮފިސަރ' : 'Portal Administrator / Senior Admin Officer'}</span>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-6 mb-1"></div>
                <span className="font-bold text-slate-900 block">{isRTL ? 'އެފް. މަގޫދޫ ސްކޫލް ސިއްކަ' : 'Official School Stamp'}</span>
                <span className="text-slate-600 text-[11px]">F. Magoodhoo School Seal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
