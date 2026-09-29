import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  Copy,
  Check,
  Settings,
  X,
  FileText,
  User as UserIcon,
  RefreshCw,
  ExternalLink,
  Sliders,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Student,
  GradeLevel,
  TermDurationConfig,
  StudentReportCardAttendance,
  ReportCardAttendanceResponse,
} from '../../types';

interface ReportCardAttendanceViewProps {
  students: Student[];
}

const ALL_GRADES_LIST: (GradeLevel | 'ALL')[] = [
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

export const ReportCardAttendanceView: React.FC<ReportCardAttendanceViewProps> = ({ students }) => {
  const { t, isRTL } = useLanguage();

  // Selected Term: 'term1' | 'term2' | 'yearly' | 'custom'
  const [selectedTerm, setSelectedTerm] = useState<string>('term1');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-01-11');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-06-25');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [loading, setLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportCardAttendanceResponse | null>(null);

  // Term Configurations
  const [termConfigs, setTermConfigs] = useState<TermDurationConfig[]>([
    {
      id: 'term1',
      name: 'Term 1',
      nameDhivehi: 'ފުރަތަމަ ޓާމް',
      startDate: '2026-01-11',
      endDate: '2026-06-25',
      isCurrent: true,
    },
    {
      id: 'term2',
      name: 'Term 2',
      nameDhivehi: 'ދެވަނަ ޓާމް',
      startDate: '2026-08-09',
      endDate: '2026-12-17',
      isCurrent: false,
    },
    {
      id: 'yearly',
      name: 'Full Academic Year',
      nameDhivehi: 'އަހަރީ ޖުމްލަ',
      startDate: '2026-01-11',
      endDate: '2026-12-17',
      isCurrent: false,
    },
  ]);

  // Modal States
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [editTermConfigs, setEditTermConfigs] = useState<TermDurationConfig[]>(termConfigs);
  const [savingConfigs, setSavingConfigs] = useState<boolean>(false);

  // Preview Box Modal for Single Student (Matching User's Screenshot)
  const [previewStudent, setPreviewStudent] = useState<StudentReportCardAttendance | null>(null);

  // Copy Feedback Tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Term Configurations from Server
  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/terms');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.terms && Array.isArray(data.terms)) {
          setTermConfigs(data.terms);
          setEditTermConfigs(data.terms);
        }
      }
    } catch (e) {
      console.warn('Could not load term configurations:', e);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  // Fetch Report Card Attendance Data
  const fetchReportCardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        term: selectedTerm,
        grade: selectedGrade,
      });

      if (selectedTerm === 'custom') {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      } else {
        const cfg = termConfigs.find((c) => c.id === selectedTerm);
        if (cfg) {
          params.append('startDate', cfg.startDate);
          params.append('endDate', cfg.endDate);
        }
      }

      const res = await fetch(`/api/reports/report-card-attendance?${params.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report card attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportCardData();
  }, [selectedTerm, customStartDate, customEndDate, selectedGrade, termConfigs]);

  // Handle Save Term Configurations
  const handleSaveTermConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfigs(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: editTermConfigs }),
      });
      if (res.ok) {
        setTermConfigs(editTermConfigs);
        setShowConfigModal(false);
        showToast(isRTL ? 'ޓާމްގެ ތާރީޚްތައް ރައްކާކުރެވިއްޖެ' : 'Term duration dates saved successfully');
      }
    } catch (err) {
      console.error('Failed to save term dates:', err);
    } finally {
      setSavingConfigs(false);
    }
  };

  // Reset Term Configurations to Default Maldives Academic Calendar
  const handleResetToMoEDefaults = () => {
    const defaults: TermDurationConfig[] = [
      {
        id: 'term1',
        name: 'Term 1',
        nameDhivehi: 'ފުރަތަމަ ޓާމް',
        startDate: '2026-01-11',
        endDate: '2026-06-25',
        isCurrent: true,
      },
      {
        id: 'term2',
        name: 'Term 2',
        nameDhivehi: 'ދެވަނަ ޓާމް',
        startDate: '2026-08-09',
        endDate: '2026-12-17',
        isCurrent: false,
      },
      {
        id: 'yearly',
        name: 'Full Academic Year',
        nameDhivehi: 'އަހަރީ ޖުމްލަ',
        startDate: '2026-01-11',
        endDate: '2026-12-17',
        isCurrent: false,
      },
    ];
    setEditTermConfigs(defaults);
  };

  // Copy 3 Values to Clipboard for Report Card Entry
  const handleCopyThreeValues = (st: StudentReportCardAttendance) => {
    // Tab-separated string: DaysToBeAttended \t DaysAttended \t DaysLate
    const textToCopy = `${st.daysToBeAttended}\t${st.daysAttended}\t${st.daysLate}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(st.studentId);
    showToast(
      isRTL
        ? `ކޮޕީވެއްޖެ: ހާޒިރުވާންޖެހޭ: ${st.daysToBeAttended} | ހާޒިރުވި: ${st.daysAttended} | ލަސްވި: ${st.daysLate}`
        : `Copied for ${st.fullName}: Attended: ${st.daysAttended} / Expected: ${st.daysToBeAttended} / Late: ${st.daysLate}`
    );
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Filtered Students in Current View
  const filteredStudents = useMemo(() => {
    if (!reportData?.students) return [];
    return reportData.students.filter((st) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        st.fullName.toLowerCase().includes(q) ||
        (st.fullNameDhivehi && st.fullNameDhivehi.includes(q)) ||
        st.admissionNumber.toLowerCase().includes(q) ||
        st.gradeLevel.toLowerCase().includes(q)
      );
    });
  }, [reportData?.students, searchQuery]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!reportData) return;

    const exportRows = filteredStudents.map((st, idx) => ({
      '#': idx + 1,
      'Admission No': st.admissionNumber,
      'Student Full Name': st.fullName,
      'Student Name (Dhivehi)': st.fullNameDhivehi || '',
      'Grade Level': st.gradeLevel,
      'Gender': st.gender,
      'No of Days to be Attended': st.daysToBeAttended,
      'No of Days Attended': st.daysAttended,
      'No of Days Late': st.daysLate,
      'Attendance Rate %': `${st.attendanceRate}%`,
      'Absent Days': st.daysAbsent,
      'Leave Days': st.daysLeave,
      'Notes': st.customNotes || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Meta Summary
    const summarySheet = [
      { Parameter: 'School Center', Value: 'SCH-F02 - F. Magoodhoo School' },
      { Parameter: 'Selected Period / Term', Value: reportData.termName },
      { Parameter: 'Period Start Date', Value: reportData.startDate },
      { Parameter: 'Period End Date', Value: reportData.endDate },
      { Parameter: 'Total Instructional Days', Value: reportData.totalInstructionalDays },
      { Parameter: 'Enrolled Students', Value: reportData.totalEnrolled },
      { Parameter: 'Average Attendance Rate', Value: `${reportData.averageRate}%` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summarySheet);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws, 'Report Card Attendance');

    const fileName = `Report_Card_Attendance_${reportData.term}_${reportData.startDate}_to_${reportData.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(isRTL ? 'އެކްސެލް ފައިލް ޑައުންލޯޑް ކުރެވިއްޖެ' : 'Excel file exported successfully');
  };

  // Active dates text
  const currentDurationLabel = useMemo(() => {
    if (selectedTerm === 'custom') {
      return `${customStartDate} ➔ ${customEndDate}`;
    }
    const cfg = termConfigs.find((c) => c.id === selectedTerm);
    if (!cfg) return '';
    return `${cfg.startDate} ➔ ${cfg.endDate}`;
  }, [selectedTerm, customStartDate, customEndDate, termConfigs]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl bg-slate-900 text-white text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isRTL ? 'ރިޕޯޓް ކާޑު ހާޒިރީ (ޓާމް އަދި އަހަރީ)' : 'Student Report Card Attendance'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL
                  ? 'ރިޕޯޓް ކާޑަށް އަޅަން ބޭނުންވާ 3 އަދަދު: ހާޒިރުވާންޖެހޭ ދުވަސް، ހާޒިރުވި ދުވަސް، އަދި ލަސްވި ދުވަސް'
                  : 'Official Attendance Figures for Report Cards: Days to be attended, Days attended, and Days late'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shadow-2xs active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-700" />
            <span>{isRTL ? 'ޓާމްގެ މުއްދަތު ބަދަލުކުރޭ' : 'Term Duration Settings'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || !reportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRTL ? 'އެކްސެލް (.xlsx)' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ޕްރިންޓް' : 'Print Roster'}</span>
          </button>
        </div>
      </div>

      {/* Term Duration & Custom Range Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Term Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-sky-700" />
              <span>{isRTL ? 'މުއްދަތު / ޓާމް:' : 'Report Period:'}</span>
            </span>

            {/* Term 1 */}
            <button
              type="button"
              onClick={() => setSelectedTerm('term1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTerm === 'term1'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{isRTL ? 'ފުރަތަމަ ޓާމް' : 'Term 1'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${selectedTerm === 'term1' ? 'bg-sky-900 text-sky-200' : 'bg-slate-200 text-slate-600'}`}>
                {termConfigs.find((c) => c.id === 'term1')?.startDate.slice(5)} - {termConfigs.find((c) => c.id === 'term1')?.endDate.slice(5)}
              </span>
            </button>

            {/* Term 2 */}
            <button
              type="button"
              onClick={() => setSelectedTerm('term2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTerm === 'term2'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{isRTL ? 'ދެވަނަ ޓާމް' : 'Term 2'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${selectedTerm === 'term2' ? 'bg-sky-900 text-sky-200' : 'bg-slate-200 text-slate-600'}`}>
                {termConfigs.find((c) => c.id === 'term2')?.startDate.slice(5)} - {termConfigs.find((c) => c.id === 'term2')?.endDate.slice(5)}
              </span>
            </button>

            {/* Full Year */}
            <button
              type="button"
              onClick={() => setSelectedTerm('yearly')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTerm === 'yearly'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{isRTL ? 'އަހަރީ ޖުމްލަ' : 'Full Academic Year'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${selectedTerm === 'yearly' ? 'bg-sky-900 text-sky-200' : 'bg-slate-200 text-slate-600'}`}>
                2026
              </span>
            </button>

            {/* Custom Range */}
            <button
              type="button"
              onClick={() => setSelectedTerm('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTerm === 'custom'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isRTL ? 'އަމިއްލަ މުއްދަތު' : 'Custom Duration'}</span>
            </button>
          </div>

          {/* Current Working Days Info Pill */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
            <span className="font-semibold text-slate-700">{currentDurationLabel}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-sky-800">
              {reportData?.totalInstructionalDays ?? '-'} {isRTL ? 'ކިޔަވައިދިން ދުވަސް' : 'Instructional Days'}
            </span>
          </div>
        </div>

        {/* Custom Duration Date Pickers (Shown only when 'custom' is active) */}
        {selectedTerm === 'custom' && (
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-teal-900">{isRTL ? 'ފެށޭ ތާރީޚް:' : 'Start Date:'}</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-teal-900">{isRTL ? 'ނިމޭ ތާރީޚް:' : 'End Date:'}</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <span className="text-[11px] text-teal-700 font-medium">
              {isRTL
                ? 'ހުކުރު އަދި ހޮނިހިރު ހަފްތާ ބަންދުތަކާއި ސަރުކާރު ބަންދު ދުވަސްތައް އަމިއްލައަށް އުނިކުރެވޭނެއެވެ.'
                : 'Friday/Saturday weekends and official closed days are automatically deducted.'}
            </span>
          </div>
        )}

        {/* Grade Filter and Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>{isRTL ? 'ގްރޭޑް:' : 'Grade:'}</span>
            </span>
            {ALL_GRADES_LIST.map((gr) => (
              <button
                key={gr}
                type="button"
                onClick={() => setSelectedGrade(gr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {gr === 'ALL' ? (isRTL ? 'ހުރިހާ' : 'All') : gr}
              </button>
            ))}
          </div>

          {/* Student Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ދަރިވަރުގެ ނަން ނުވަތަ އެޑްމިޝަން...' : 'Search student or index #...'}
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Days to be Attended */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {isRTL ? 'ހާޒިރުވާންޖެހޭ ދުވަސް' : 'Days To Be Attended'}
          </div>
          <div className="text-2xl font-black text-slate-900">
            {reportData?.totalInstructionalDays ?? '-'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isRTL ? 'ރަސްމީ ކިޔަވައިދޭ ދުވަސްތައް' : 'Teaching days in term'}
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {isRTL ? 'ދަރިވަރުންގެ އަދަދު' : 'Students In View'}
          </div>
          <div className="text-2xl font-black text-sky-800">
            {filteredStudents.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {selectedGrade === 'ALL' ? (isRTL ? 'ސްކޫލްގެ ޖުމްލަ' : 'School total (215)') : `${selectedGrade}`}
          </div>
        </div>

        {/* Average Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {isRTL ? 'އެވްރެޖް ހާޒިރީ' : 'Term Average Rate'}
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {reportData?.averageRate != null ? `${reportData.averageRate}%` : '-'}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
            {reportData?.averageRate != null && reportData.averageRate >= 90 ? 'MoE Standard (>90%)' : 'Needs Review'}
          </div>
        </div>

        {/* Quick Copy Helper */}
        <div className="bg-sky-50/60 rounded-2xl border border-sky-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
            {isRTL ? 'ރިޕޯޓް ކާޑު އެޅުމަށް' : 'Report Card Input'}
          </div>
          <div className="text-xs text-sky-950 font-semibold leading-relaxed mt-1">
            {isRTL
              ? 'ކޮންމެ ދަރިވަރެއްގެ "3 އަދަދު ކޮޕީކުރޭ" ފިތުމުން ޑޭޓާ ފަސޭހައިން ކޮޕީވާނެއެވެ.'
              : 'Click "Copy 3 Values" to instantly copy Days to be attended, Attended & Late!'}
          </div>
        </div>
      </div>

      {/* Main Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-sky-700" />
            <h3 className="text-sm font-bold text-slate-900">
              {isRTL ? 'ދަރިވަރުންގެ ރިޕޯޓް ކާޑު ހާޒިރީ ލިސްޓް' : 'Student Report Card Attendance Roster'}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {filteredStudents.length}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {reportData?.termName} ({currentDurationLabel})
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-sky-600" />
            <p className="text-xs font-semibold">{isRTL ? 'ހާޒިރީ ތަފާސްހިސާބު އެއްކުރަނީ...' : 'Calculating student attendance for term duration...'}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">{isRTL ? 'އެއްވެސް ދަރިވަރަކު ނުފެނުނު' : 'No students matched your search criteria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold select-none">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-24">Index</th>
                  <th className="py-3 px-4 min-w-44">Student Name</th>
                  <th className="py-3 px-3 w-24">Grade</th>

                  {/* THREE CORE REPORT CARD NUMBERS */}
                  <th className="py-3 px-3 text-center bg-sky-50/70 border-x border-sky-100 font-extrabold text-sky-900">
                    <div>No of days to be attended</div>
                    <div className="text-[10px] font-normal text-sky-700">ހާޒިރުވާން ޖެހޭ ދުވަހުގެ އަދަދު</div>
                  </th>
                  <th className="py-3 px-3 text-center bg-emerald-50/70 border-r border-emerald-100 font-extrabold text-emerald-900">
                    <div>No of days attended</div>
                    <div className="text-[10px] font-normal text-emerald-700">ހާޒިރުވި ދުވަހުގެ އަދަދު</div>
                  </th>
                  <th className="py-3 px-3 text-center bg-amber-50/70 border-r border-amber-100 font-extrabold text-amber-900">
                    <div>No of days late</div>
                    <div className="text-[10px] font-normal text-amber-700">ގަޑިއަށް ނުދެވޭ ދުވަހުގެ އަދަދު</div>
                  </th>

                  <th className="py-3 px-3 text-center">Rate %</th>
                  <th className="py-3 px-3 text-center">Absent / Leave</th>
                  <th className="py-3 px-4 text-center">Report Card Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, idx) => {
                  const isCopied = copiedId === st.studentId;
                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px]">
                        {st.admissionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{st.fullName}</div>
                        {st.fullNameDhivehi && (
                          <div className="text-[10px] text-slate-500 font-medium">{st.fullNameDhivehi}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {st.gradeLevel}
                        </span>
                      </td>

                      {/* 1. Days to be attended */}
                      <td className="py-3 px-3 text-center bg-sky-50/40 border-x border-sky-100">
                        <span className="font-black text-slate-900 text-sm">
                          {st.daysToBeAttended}
                        </span>
                      </td>

                      {/* 2. Days attended */}
                      <td className="py-3 px-3 text-center bg-emerald-50/40 border-r border-emerald-100">
                        <span className="font-black text-emerald-800 text-sm px-2 py-0.5 rounded-md bg-emerald-100/60">
                          {st.daysAttended}
                        </span>
                      </td>

                      {/* 3. Days late */}
                      <td className="py-3 px-3 text-center bg-amber-50/40 border-r border-amber-100">
                        <span className={`font-black text-sm ${st.daysLate > 0 ? 'text-amber-800 px-2 py-0.5 rounded-md bg-amber-100/60' : 'text-slate-400'}`}>
                          {st.daysLate}
                        </span>
                      </td>

                      {/* Attendance Rate */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            st.attendanceRate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.attendanceRate >= 80
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {st.attendanceRate}%
                        </span>
                      </td>

                      {/* Absent / Leave */}
                      <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                        <span>{st.daysAbsent} abs</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span>{st.daysLeave} lve</span>
                      </td>

                      {/* Report Card Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Copy 3 Values Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyThreeValues(st)}
                            title="Copy Days Attended, Expected & Late"
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-sky-700" />}
                            <span>{isCopied ? (isRTL ? 'ކޮޕީވެއްޖެ!' : 'Copied!') : (isRTL ? '3 އަދަދު' : 'Copy 3')}</span>
                          </button>

                          {/* Preview Card Box Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewStudent(st)}
                            title="View Report Card Attendance Box"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">{isRTL ? 'ގޮޅި' : 'Box'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PREVIEW SINGLE STUDENT REPORT CARD BOX MODAL (MATCHES USER SCREENSHOT!)    */}
      {/* ========================================================================= */}
      {previewStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>{isRTL ? 'ރިޕޯޓް ކާޑު ހާޒިރީ ގޮޅި' : 'Report Card Attendance Box'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                    {previewStudent.gradeLevel}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewStudent.fullName} ({previewStudent.admissionNumber}) • {reportData?.termName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* THE EXACT TABLE AS SHOWN IN USER SCREENSHOT */}
            <div className="border border-slate-400/90 rounded-none shadow-xs overflow-hidden font-sans">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#DCE9F6] border-b border-slate-400 text-slate-900 font-bold">
                    <th className="py-2.5 px-4 text-left font-bold text-xs sm:text-sm">Attendance</th>
                    <th className="py-2.5 px-4 text-center w-24 sm:w-32"></th>
                    <th className="py-2.5 px-4 text-right font-bold text-xs sm:text-sm">ހާޒިރީ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400 text-slate-900 font-medium text-xs sm:text-sm bg-white">
                  {/* Row 1: Days to be attended */}
                  <tr>
                    <td className="py-2 px-4 text-left border-r border-slate-400">
                      No of days to be attended
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-sm border-r border-slate-400 font-mono">
                      {previewStudent.daysToBeAttended}
                    </td>
                    <td className="py-2 px-4 text-right font-semibold">
                      ހާޒިރުވާން ޖެހޭ ދުވަހުގެ އަދަދު
                    </td>
                  </tr>

                  {/* Row 2: Days attended */}
                  <tr>
                    <td className="py-2 px-4 text-left border-r border-slate-400">
                      No of days attended
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-sm border-r border-slate-400 font-mono text-emerald-800">
                      {previewStudent.daysAttended}
                    </td>
                    <td className="py-2 px-4 text-right font-semibold">
                      ހާޒިރުވި ދުވަހުގެ އަދަދު
                    </td>
                  </tr>

                  {/* Row 3: Days late */}
                  <tr>
                    <td className="py-2 px-4 text-left border-r border-slate-400">
                      No of days late
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-sm border-r border-slate-400 font-mono">
                      {previewStudent.daysLate}
                    </td>
                    <td className="py-2 px-4 text-right font-semibold">
                      ގަޑިއަށް ނުދެވޭ ދުވަހުގެ އަދަދު
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Guidance for manual entry */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between gap-3">
              <span className="text-[11px] leading-relaxed">
                {isRTL
                  ? 'ރިޕޯޓް ކާޑު ތައްޔާރުކުރާއިރު މި އަދަދުތައް ސީދާ ރިޕޯޓް ކާޑުގެ ހާޒިރީ ބަޔަށް އަޅާށެވެ.'
                  : 'Enter these exact values into the student report card attendance box.'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyThreeValues(previewStudent)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isRTL ? '3 އަދަދު ކޮޕީކުރޭ' : 'Copy 3 Values'}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t.cancel || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TERM DURATION CONFIGURATION MODAL (START - END DATES)                     */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {isRTL ? 'ޓާމްގެ މުއްދަތުތައް ކަނޑައެޅުން' : 'Configure Term Durations (Start - End Dates)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isRTL
                      ? 'ރިޕޯޓް ކާޑުތަކަށް ހާޒިރުވާންޖެހޭ ދުވަސްތައް ގުނުމަށް ފުރަތަމަ އަދި ދެވަނަ ޓާމް ފެށޭ/ނިމޭ ތާރީޚް'
                      : 'Set official start and end dates for Term 1, Term 2, and the full Academic Year'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTermConfigs} className="space-y-4">
              <div className="space-y-4">
                {editTermConfigs.map((cfg, i) => (
                  <div key={cfg.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                      <span>{cfg.name}</span>
                      <span className="text-slate-500 font-medium">{cfg.nameDhivehi}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {isRTL ? 'ފެށޭ ތާރީޚް:' : 'Start Date:'}
                        </label>
                        <input
                          type="date"
                          value={cfg.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditTermConfigs((prev) =>
                              prev.map((c, idx) => (idx === i ? { ...c, startDate: val } : c))
                            );
                          }}
                          required
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {isRTL ? 'ނިމޭ ތާރީޚް:' : 'End Date:'}
                        </label>
                        <input
                          type="date"
                          value={cfg.endDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditTermConfigs((prev) =>
                              prev.map((c, idx) => (idx === i ? { ...c, endDate: val } : c))
                            );
                          }}
                          required
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetToMoEDefaults}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  {isRTL ? 'މޯއީ އަސްލު ތާރީޚްތަކަށް އަނބުރާ ގެންދޭ' : 'Reset to MoE Calendar Defaults'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingConfigs}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingConfigs ? (isRTL ? 'ރައްކާކުރަނީ...' : 'Saving...') : (isRTL ? 'ރައްކާކުރޭ' : 'Save Term Dates')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
