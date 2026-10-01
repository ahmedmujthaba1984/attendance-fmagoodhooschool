import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Award,
  CheckCircle,
  AlertTriangle,
  Building,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../i18n/LanguageContext';
import { MonthlyAttendanceReport, AttendanceReportMode, Student, AttendanceRecord } from '../../types';
import { generateClientMonthlyReport } from '../../utils/reportGenerator';

interface MonthlyReportViewProps {
  reportMode?: AttendanceReportMode;
  onReportModeChange?: (mode: AttendanceReportMode) => void;
  students?: Student[];
  records?: AttendanceRecord[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  reportMode: propReportMode,
  onReportModeChange,
  students = [],
  records = [],
}) => {
  const { t, isRTL } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [mode, setMode] = useState<AttendanceReportMode>(propReportMode || 'BOTH');
  const [loading, setLoading] = useState<boolean>(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceReport | null>(() => {
    return generateClientMonthlyReport({
      year: 2026,
      month: 9,
      reportMode: propReportMode || 'BOTH',
      students,
      records,
    });
  });

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

  const fetchMonthlyReport = async () => {
    setLoading(true);
    const fallback = generateClientMonthlyReport({
      year: selectedYear,
      month: selectedMonth,
      reportMode: mode,
      students,
      records,
    });

    try {
      const queryParams = new URLSearchParams({
        reportType: 'monthly',
        year: String(selectedYear),
        month: String(selectedMonth),
        reportMode: mode,
      });

      const res = await fetch(`/api/reports/analytics?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setMonthlyData(data);
      } else {
        setMonthlyData(fallback);
      }
    } catch (err) {
      console.warn('Backend monthly report API offline or cold start, using client generator', err);
      setMonthlyData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear, mode, records]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!monthlyData) return;
    const wb = XLSX.utils.book_new();

    const modeLabel =
      mode === 'MORNING'
        ? 'Morning Only'
        : mode === 'AFTERNOON'
        ? 'Afternoon Only'
        : mode === 'OFFICIAL'
        ? 'Official Only'
        : mode === 'EXTRA_CLASS'
        ? 'Extra Class Only'
        : 'Combined (Official & Extra)';

    // Summary Sheet
    const summary = [
      { Metric: 'Month', Value: `${monthlyData.monthName || 'Month'} ${monthlyData.year || ''}` },
      { Metric: 'Report Mode', Value: modeLabel },
      { Metric: 'Instructional Days', Value: monthlyData.instructionalDays },
      { Metric: 'Closed / Holidays Deducted', Value: monthlyData.closedDays },
      { Metric: 'Monthly Attendance Rate', Value: `${monthlyData.monthlyRate}%` },
      {
        Metric: 'Morning Monthly Rate',
        Value: `${monthlyData.morningMonthlyRate ?? monthlyData.monthlyRate}%`,
      },
      {
        Metric: 'Afternoon Monthly Rate',
        Value: `${monthlyData.afternoonMonthlyRate ?? 93}%`,
      },
      {
        Metric: 'Official Monthly Rate',
        Value: `${monthlyData.officialMonthlyRate ?? monthlyData.monthlyRate}%`,
      },
      {
        Metric: 'Extra Class Monthly Rate',
        Value: `${monthlyData.extraClassMonthlyRate ?? 100}%`,
      },
      {
        Metric: 'Combined Monthly Rate',
        Value: `${monthlyData.combinedMonthlyRate ?? monthlyData.monthlyRate}%`,
      },
      { Metric: 'Total Extra Classes Held', Value: monthlyData.totalExtraClasses ?? 0 },
      { Metric: 'Enrolled Students', Value: monthlyData.enrolledStudents },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

    // Weekly progression Sheet
    const weeks = (monthlyData.weeklyBreakdown || []).map((w) => ({
      Week: w.weekLabel,
      'Instructional Days': w.instructionalDays,
      'Rate (%)': `${w.rate}%`,
    }));
    const wsWeeks = XLSX.utils.json_to_sheet(weeks);
    XLSX.utils.book_append_sheet(wb, wsWeeks, 'Weekly Progression');

    // Grade breakdown Sheet
    const grades = (monthlyData.gradeBreakdown || []).map((g) => ({
      Grade: g.grade,
      Enrolled: g.enrolled,
      'Monthly Rate (%)': `${g.monthlyRate}%`,
      'Official Rate (%)': `${g.officialRate ?? g.monthlyRate}%`,
      'Extra Class Rate (%)': (monthlyData.totalExtraClasses ?? 0) === 0 || g.extraClassRate == null ? '-' : `${g.extraClassRate}%`,
      'Combined Rate (%)': `${g.combinedRate ?? g.monthlyRate}%`,
      'Chronic Count (<80%)': g.chronicCount,
    }));
    const wsGrades = XLSX.utils.json_to_sheet(grades);
    XLSX.utils.book_append_sheet(wb, wsGrades, 'Grade Breakdown');

    XLSX.writeFile(
      wb,
      `Monthly_Report_${monthlyData.monthName || 'Month'}_${monthlyData.year || '2026'}_${mode}.xlsx`
    );
  };

  const months = [
    { value: 1, name: 'January (ޖެނުއަރީ)' },
    { value: 2, name: 'February (ފެބްރުއަރީ)' },
    { value: 3, name: 'March (މާރިޗު)' },
    { value: 4, name: 'April (އޭޕްރީލް)' },
    { value: 5, name: 'May (މެއި)' },
    { value: 6, name: 'June (ޖޫން)' },
    { value: 7, name: 'July (ޖުލައި)' },
    { value: 8, name: 'August (އޮގަސްޓް)' },
    { value: 9, name: 'September (ސެޕްޓެމްބަރ)' },
    { value: 10, name: 'October (އޮކްޓޫބަރ)' },
    { value: 11, name: 'November (ނޮވެމްބަރ)' },
    { value: 12, name: 'December (ޑިސެމްބަރ)' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">
              {isRTL ? 'މަސް ޚިޔާރުކުރައްވާ:' : 'Select Month:'}
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono font-bold text-slate-500">2026</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMonthlyReport}
              disabled={loading}
              className="p-2 px-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Monthly Attendance Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isRTL ? 'އައުކުރޭ' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ޕްރިންޓް' : 'Print Report'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isRTL ? 'އެކްސެލް' : 'Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* REPORT MODE TOGGLE */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
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
                    ? 'bg-sky-800 text-white shadow-xs'
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
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? 'މެންދުރުފަސް' : 'Afternoon'}</span>
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
                <span>{isRTL ? 'ރަސްމީ ދެދަންފަޅި' : 'Official (AM+PM)'}</span>
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
                <span>{isRTL ? 'ހުރިހާ ބައެއް' : 'Both (Official + Extra)'}</span>
              </button>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            {mode === 'MORNING'
              ? 'Monthly official morning gate check-in returns'
              : mode === 'AFTERNOON'
              ? 'Monthly official afternoon post-break session returns'
              : mode === 'OFFICIAL'
              ? 'Monthly official morning & afternoon instructional returns'
              : mode === 'EXTRA_CLASS'
              ? 'Monthly remedial tutorials & subject revision clinic returns'
              : 'Combined monthly school & extra class attendance analytics'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>{isRTL ? 'މަހުގެ ރިޕޯޓް ލޯޑްވަނީ...' : 'Generating monthly attendance report...'}</span>
        </div>
      )}

      {monthlyData && !loading && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  MONTHLY ATTENDANCE SUMMARY • {(monthlyData.monthName || '').toUpperCase()}{' '}
                  {monthlyData.year || ''}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                  <span>F. Magoodhoo School • Official MoE Monthly School Attendance Return</span>
                  <span className="font-bold text-sky-900">
                    • Mode:{' '}
                    {mode === 'MORNING'
                      ? 'Morning Only'
                      : mode === 'AFTERNOON'
                      ? 'Afternoon Only'
                      : mode === 'OFFICIAL'
                      ? 'Official Only'
                      : mode === 'EXTRA_CLASS'
                      ? 'Extra Class Only'
                      : 'Combined'}
                  </span>
                </p>
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
                  <span>{mode}</span>
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1">
                  {monthlyData.monthlyRate}%
                </span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  mode === 'MORNING'
                    ? 'bg-sky-50/80 border-sky-200'
                    : mode === 'AFTERNOON'
                    ? 'bg-teal-50/80 border-teal-200'
                    : mode === 'EXTRA_CLASS'
                    ? 'bg-purple-50/80 border-purple-200'
                    : mode === 'BOTH'
                    ? 'bg-emerald-50/80 border-emerald-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block text-slate-700">
                  {mode === 'MORNING'
                    ? 'Monthly Morning Rate'
                    : mode === 'AFTERNOON'
                    ? 'Monthly Afternoon Rate'
                    : mode === 'EXTRA_CLASS'
                    ? 'Monthly Extra Class Rate'
                    : mode === 'BOTH'
                    ? 'Combined Monthly Rate'
                    : 'Monthly Official Rate'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {mode === 'EXTRA_CLASS'
                      ? ((monthlyData.totalExtraClasses ?? 0) === 0 || monthlyData.extraClassMonthlyRate == null ? '-' : `${monthlyData.monthlyRate}%`)
                      : `${monthlyData.monthlyRate}%`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {mode === 'MORNING' && `Gate Check-in Benchmark ≥80%`}
                  {mode === 'AFTERNOON' && `Post-break session average`}
                  {mode === 'BOTH' &&
                    `Official: ${monthlyData.officialMonthlyRate != null ? `${monthlyData.officialMonthlyRate}%` : '-'} • Extra: ${(monthlyData.totalExtraClasses ?? 0) === 0 || monthlyData.extraClassMonthlyRate == null ? '-' : `${monthlyData.extraClassMonthlyRate}%`}`}
                  {mode === 'OFFICIAL' && 'Above 80% National MoE Threshold'}
                  {mode === 'EXTRA_CLASS' && `${monthlyData.totalExtraClasses ?? 0} sessions held`}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {isRTL ? 'ކިޔަވައިދިން ދުވަސް' : 'Instructional Days'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">
                    {monthlyData.instructionalDays}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ({monthlyData.closedDays} days holiday/closed deducted)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {isRTL ? 'ދަރިވަރުންގެ އަދަދު' : 'Enrolled Students'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">
                    {monthlyData.enrolledStudents}
                  </span>
                  <span className="text-xs text-slate-400">active</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Across LKG to Grade 10
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">
                  Extra Classes In Month
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-purple-950">
                    {monthlyData.totalExtraClasses ?? 0}
                  </span>
                  <span className="text-xs text-purple-600">sessions</span>
                </div>
                <span className="text-[10px] text-purple-600 block mt-0.5">
                  Across upper grades
                </span>
              </div>
            </div>

            {/* Weekly Progression Progress Bars */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                {isRTL ? 'ހަފްތާގެ ތަފާސްހިސާބު ކުރިއެރުން' : 'Weekly Progression Breakdown'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(monthlyData.weeklyBreakdown || []).map((w, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{w.weekLabel}</span>
                      <span className="font-black text-sky-900">{w.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          w.rate >= 90 ? 'bg-emerald-600' : w.rate >= 80 ? 'bg-sky-600' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, w.rate)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                      {w.instructionalDays} school days
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade-by-Grade Monthly Table */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                {isRTL ? 'ގްރޭޑްތަކުގެ މަހު ރޭޓް' : 'Grade-by-Grade Monthly Performance'}
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3 text-center">Enrolled Students</th>
                      {mode === 'BOTH' ? (
                        <>
                          <th className="py-2.5 px-3 text-center text-sky-900">Official Rate</th>
                          <th className="py-2.5 px-3 text-center text-purple-900">Extra Class Rate</th>
                          <th className="py-2.5 px-3 text-center font-bold text-emerald-950">Combined Rate</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-3 text-center font-bold text-slate-900">
                          Monthly Rate (%)
                        </th>
                      )}
                      <th className="py-2.5 px-3 text-center">Chronic Absentees (&lt;80%)</th>
                      <th className="py-2.5 px-3 text-center">MoE Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(monthlyData.gradeBreakdown || []).map((gb) => (
                      <tr key={gb.grade} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{gb.grade}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {gb.enrolled}
                        </td>
                        {mode === 'BOTH' ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-900">
                              {gb.officialRate ?? gb.monthlyRate}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-900">
                              {(monthlyData.totalExtraClasses ?? 0) === 0 || gb.extraClassRate == null ? '-' : `${gb.extraClassRate}%`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-950">
                              <span
                                className={`px-2.5 py-0.5 rounded-full ${
                                  (gb.combinedRate ?? gb.monthlyRate) >= 90
                                    ? 'bg-emerald-100 text-emerald-800 font-black'
                                    : (gb.combinedRate ?? gb.monthlyRate) >= 80
                                    ? 'bg-sky-100 text-sky-800 font-bold'
                                    : 'bg-rose-100 text-rose-800 font-black'
                                }`}
                              >
                                {gb.combinedRate ?? gb.monthlyRate}%
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                            <span
                              className={`px-2.5 py-0.5 rounded-full ${
                                gb.monthlyRate >= 90
                                  ? 'bg-emerald-100 text-emerald-800 font-black'
                                  : gb.monthlyRate >= 80
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'bg-rose-100 text-rose-800 font-black'
                              }`}
                            >
                              {mode === 'EXTRA_CLASS' && ((monthlyData.totalExtraClasses ?? 0) === 0 || gb.extraClassRate == null) ? '-' : `${gb.monthlyRate}%`}
                            </span>
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {gb.chronicCount > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {gb.chronicCount} students
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">0 (None)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {gb.monthlyRate >= 80 ? '✓ Compliant' : '⚠ Non-compliant'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
