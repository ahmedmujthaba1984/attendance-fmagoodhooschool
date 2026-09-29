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
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../i18n/LanguageContext';
import { MoEGradeStat, Student, AttendanceRecord, AttendanceReportMode } from '../types';
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
}) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<MainReportTab>('student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [reportView, setReportView] = useState<'grade_summary' | 'chronic'>('grade_summary');
  const [reportMode, setReportMode] = useState<AttendanceReportMode>('BOTH');
  const [serverAtRisk, setServerAtRisk] = useState<Array<{
    adm: string;
    name: string;
    dv: string;
    grade: string;
    rate: number;
    missedDays: number;
    reason: string;
  }>>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAtRisk = async () => {
      try {
        const res = await fetch(`/api/reports/at-risk?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setServerAtRisk(data.atRiskStudents || []);
          }
        }
      } catch (e) {
        console.warn('Could not fetch at-risk students', e);
      }
    };
    fetchAtRisk();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Chronic absentees (<80% threshold) derived from real attendance records (no fake student generation)
  const chronicStudents = useMemo(() => {
    if (serverAtRisk.length > 0) {
      return serverAtRisk;
    }
    if (!students || students.length === 0) return [];

    // Tally attendance per student from records
    const studentStats = new Map<string, { total: number; present: number; absent: number; leave: number }>();
    records.forEach((r) => {
      const curr = studentStats.get(r.studentId) || { total: 0, present: 0, absent: 0, leave: 0 };
      curr.total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        curr.present++;
      } else if (r.status === 'ABSENT') {
        curr.absent++;
      } else if (r.status === 'LEAVE') {
        curr.leave++;
      }
      studentStats.set(r.studentId, curr);
    });

    const belowThreshold: Array<{
      adm: string;
      name: string;
      dv: string;
      grade: string;
      rate: number;
      missedDays: number;
      reason: string;
    }> = [];

    students.forEach((st) => {
      const stat = studentStats.get(st.id);
      if (stat && stat.total > 0) {
        const rate = Math.round((stat.present / stat.total) * 100);
        if (rate < 80) {
          belowThreshold.push({
            adm: st.admissionNumber,
            name: st.fullName,
            dv: st.fullNameDhivehi || st.fullName,
            grade: st.gradeLevel,
            rate,
            missedDays: stat.absent,
            reason:
              stat.leave > 0
                ? isRTL
                  ? 'މާލެއަށް ބޭސްފަރުވާއަށް ފުރުން'
                  : 'Specialist Medical Referral'
                : isRTL
                ? 'ސަބަބު ބަޔާންނުކޮށް ޣައިރުޙާޟިރުވުން'
                : 'Unexcused Absences / Post-Weekend Spikes',
          });
        }
      }
    });

    return belowThreshold.sort((a, b) => a.rate - b.rate);
  }, [serverAtRisk, students, records, isRTL]);

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
      'Post-Break Present',
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

    // Sheet 1: Grade Summary
    const summaryData = gradeStats.map((g) => ({
      'Grade Level': g.grade,
      'Total Students': g.totalEnrolled,
      'Morning Present': g.morningPresent,
      'Late (Recorded)': g.morningLate,
      'Authorized Leaves': g.morningLeave,
      'Unexcused Absent': g.morningAbsent,
      'Post-Break Present': g.postBreakPresent,
      'Attendance Rate': `${g.attendanceRate}%`,
    }));
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'MoE Grade Breakdown');

    // Sheet 2: Chronic Absentees
    const chronicData = chronicStudents.map((s) => ({
      'Admission No': s.adm,
      'Student Name': s.name,
      Grade: s.grade,
      'Attendance Rate': `${s.rate}%`,
      'Missed Sessions': s.missedDays,
      'Primary Pattern/Reason': s.reason,
    }));
    const ws2 = XLSX.utils.json_to_sheet(chronicData);
    XLSX.utils.book_append_sheet(wb, ws2, 'MoE Chronic Risk (<80%)');

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
        <ReportCardAttendanceView students={students} />
      )}

      {activeTab === 'student' && (
        <StudentReportView
          students={students}
          initialStudentId={selectedStudentId}
          reportMode={reportMode}
          onReportModeChange={setReportMode}
        />
      )}

      {activeTab === 'class' && (
        <ClassReportView
          onSelectStudent={handleSelectStudentFromClass}
          reportMode={reportMode}
          onReportModeChange={setReportMode}
        />
      )}

      {activeTab === 'weekly' && (
        <WeeklyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
        />
      )}

      {activeTab === 'monthly' && (
        <MonthlyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
        />
      )}

      {activeTab === 'yearly' && (
        <YearlyReportView
          reportMode={reportMode}
          onReportModeChange={setReportMode}
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
                  {isSchoolClosed ? (isRTL ? 'ބަންދު (100%)' : 'Closed (Excused)') : (overallRate != null ? `${overallRate}%` : '-')}
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

            {/* Sub-tabs for Reports */}
            <div className="no-print flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setReportView('grade_summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportView === 'grade_summary'
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isRTL ? 'ގްރޭޑްތަކުގެ ތަފްސީލު (LKG - 10)' : 'Grade-by-Grade MoE Matrix (12 Grades)'}
              </button>
              <button
                type="button"
                onClick={() => setReportView('chronic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  reportView === 'chronic'
                    ? chronicStudents.length > 0
                      ? 'bg-rose-700 text-white'
                      : 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {chronicStudents.length > 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span>{isRTL ? 'ހާޒިރީ ދަށް ދަރިވަރުން (<80%)' : 'MoE At-Risk Register (<80%)'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    chronicStudents.length > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {chronicStudents.length}
                </span>
              </button>
            </div>

            {reportView === 'grade_summary' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
                      <th className="py-2.5 px-3">{t.gradeLevel}</th>
                      <th className="py-2.5 px-3 text-center">{t.enrolled}</th>
                      <th className="py-2.5 px-3 text-center">{t.morningPresent}</th>
                      <th className="py-2.5 px-3 text-center">{t.morningLate}</th>
                      <th className="py-2.5 px-3 text-center">{t.morningLeave}</th>
                      <th className="py-2.5 px-3 text-center">{t.morningAbsent}</th>
                      <th className="py-2.5 px-3 text-center">{t.postBreakPresent}</th>
                      <th className="py-2.5 px-3 text-center">{t.attendanceRate}</th>
                      <th className="py-2.5 px-3 text-center">MoE Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradeStats.map((stat) => (
                      <tr key={stat.grade} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{stat.grade}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{stat.totalEnrolled}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{stat.morningPresent}</td>
                        <td className="py-2.5 px-3 text-center text-amber-700">{stat.morningLate}</td>
                        <td className="py-2.5 px-3 text-center text-indigo-700">{stat.morningLeave}</td>
                        <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">{stat.morningAbsent}</td>
                        <td className="py-2.5 px-3 text-center text-teal-700">{stat.postBreakPresent}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
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
            )}

            {reportView === 'chronic' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {isRTL
                      ? 'މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަންގެ މިންގަނޑުން 80% އަށްވުރެ ދަށުގައިވާ ދަރިވަރުން. މި ދަރިވަރުންނާ ބެހޭގޮތުން ޚާއްޞަ ފިޔަވަޅު އަޅަންޖެހެއެވެ.'
                      : 'Students below the 80% threshold required by Ministry of Education for Cambridge O-Level exam registrations and term promotion.'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
                        <th className="py-2.5 px-3">Admission No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3 text-center">Current Rate</th>
                        <th className="py-2.5 px-3 text-center">Missed Sessions</th>
                        <th className="py-2.5 px-3">Identified Pattern / Factor</th>
                        <th className="py-2.5 px-3">Action Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chronicStudents.length > 0 ? (
                        chronicStudents.map((s) => (
                          <tr key={s.adm} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{s.adm}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {isRTL ? s.dv : s.name}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{s.grade}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-rose-700">{s.rate}%</td>
                            <td className="py-2.5 px-3 text-center font-bold">{s.missedDays}</td>
                            <td className="py-2.5 px-3 text-slate-600">{s.reason}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {isRTL ? 'ބެލެނިވެރިޔާ ހާޒިރުކުރުން' : 'Guardian Case Conference'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <CheckCircle className="w-8 h-8 text-emerald-500" />
                              <span className="font-bold text-emerald-800 text-sm">
                                {isRTL ? 'ހާޒިރީ 80% އަށްވުރެ ދަށް އެއްވެސް ދަރިވަރަކު ނެތް' : 'No Students Below 80% Threshold'}
                              </span>
                              <p className="text-xs text-slate-500 max-w-md">
                                {isRTL
                                  ? 'ހުރިހާ ދަރިވަރުންގެ ހާޒިރީ ވެސް ހުރީ މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަންގެ ކަނޑައެޅިފައިވާ މިންގަނޑަށްވުރެ މަތީގައެވެ.'
                                  : 'All enrolled students currently meet or exceed Ministry of Education (MoE) attendance compliance standards.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
