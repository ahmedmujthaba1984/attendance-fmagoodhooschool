import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  RefreshCw,
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
import { WeeklyAttendanceReport, AttendanceReportMode, Student, AttendanceRecord } from '../../types';
import { ALL_ACADEMIC_WEEKS_2026, getCurrentOrLatestSchoolWeek } from '../../utils/academicWeeks';
import { generateClientWeeklyReport } from '../../utils/reportGenerator';

interface WeeklyReportViewProps {
  reportMode?: AttendanceReportMode;
  onReportModeChange?: (mode: AttendanceReportMode) => void;
  students?: Student[];
  records?: AttendanceRecord[];
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  reportMode: propReportMode,
  onReportModeChange,
  students = [],
  records = [],
}) => {
  const { t, isRTL } = useLanguage();
  const defaultWeek = getCurrentOrLatestSchoolWeek();
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(defaultWeek.startDate);
  const [mode, setMode] = useState<AttendanceReportMode>(propReportMode || 'BOTH');
  const [loading, setLoading] = useState<boolean>(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyAttendanceReport | null>(() => {
    return generateClientWeeklyReport({
      weekStart: defaultWeek.startDate,
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

  const fetchWeeklyReport = async () => {
    setLoading(true);
    const fallback = generateClientWeeklyReport({
      weekStart: selectedWeekStart,
      reportMode: mode,
      students,
      records,
    });

    try {
      const queryParams = new URLSearchParams({
        reportType: 'weekly',
        weekStart: selectedWeekStart,
        reportMode: mode,
      });

      const res = await fetch(`/api/reports/analytics?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setWeeklyData(data);
      } else {
        setWeeklyData(fallback);
      }
    } catch (err) {
      console.warn('Backend weekly reporting API offline or cold start, using client generator', err);
      setWeeklyData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyReport();
  }, [selectedWeekStart, mode, records]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!weeklyData) return;
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

    // Summary sheet
    const summary = [
      {
        Metric: 'Week Title',
        Value: weeklyData.weekTitle || `Week ${weeklyData.weekNumber || ''}`,
      },
      { Metric: 'Report Mode', Value: modeLabel },
      { Metric: 'Date Range', Value: `${weeklyData.startDate} to ${weeklyData.endDate} (Sun - Thu)` },
      {
        Metric: 'Weekly Average Rate',
        Value: weeklyData.weeklyAverageRate != null ? `${weeklyData.weeklyAverageRate}%` : '-',
      },
      {
        Metric: 'Morning Weekly Rate',
        Value: (weeklyData.morningWeeklyRate ?? weeklyData.weeklyAverageRate) != null ? `${weeklyData.morningWeeklyRate ?? weeklyData.weeklyAverageRate}%` : '-',
      },
      {
        Metric: 'Afternoon Weekly Rate',
        Value: weeklyData.afternoonWeeklyRate != null ? `${weeklyData.afternoonWeeklyRate}%` : '-',
      },
      {
        Metric: 'Official Weekly Rate',
        Value: (weeklyData.officialWeeklyRate ?? weeklyData.weeklyAverageRate) != null ? `${weeklyData.officialWeeklyRate ?? weeklyData.weeklyAverageRate}%` : '-',
      },
      {
        Metric: 'Extra Class Weekly Rate',
        Value: (weeklyData.totalExtraClasses === 0 || weeklyData.extraClassWeeklyRate == null) ? '-' : `${weeklyData.extraClassWeeklyRate}%`,
      },
      {
        Metric: 'Combined Weekly Rate',
        Value: (weeklyData.combinedWeeklyRate ?? weeklyData.weeklyAverageRate) != null ? `${weeklyData.combinedWeeklyRate ?? weeklyData.weeklyAverageRate}%` : '-',
      },
      { Metric: 'Total School Days', Value: weeklyData.totalSchoolDays },
      { Metric: 'Instructional Days', Value: weeklyData.instructionalDays },
      { Metric: 'Closed / Holidays', Value: weeklyData.closedDays },
      { Metric: 'Total Extra Classes Held', Value: weeklyData.totalExtraClasses ?? 0 },
      { Metric: 'Best Performing Class', Value: weeklyData.bestClass || 'Grade 4' },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Weekly Summary');

    // Daily breakdown sheet
    const dailyRows = (weeklyData.dailyStats || weeklyData.dailyBreakdown || []).map((d) => ({
      Date: d.date,
      Day: d.dayOfWeek,
      'School Closed': d.isClosed ? 'YES (Excused)' : 'NO',
      'Attendance Rate': (mode === 'EXTRA_CLASS' && (d.extraClassesCount ?? 0) === 0) ? '-' : (d.isClosed ? 'CLOSED' : (d.rate != null ? `${d.rate}%` : '-')),
      'Total Present': d.present,
      'Total Absent': d.absent,
      'Total Late': d.late,
      'Total Leave': d.leave,
      'Extra Classes Held': d.extraClassesCount ?? 0,
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Totals');

    // Grade matrix sheet
    const gradeRows = (weeklyData.gradeMatrix || []).map((g) => ({
      Grade: g.grade,
      'Sun (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.sundayRate == null)) ? '-' : `${g.sundayRate}%`,
      'Mon (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.mondayRate == null)) ? '-' : `${g.mondayRate}%`,
      'Tue (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.tuesdayRate == null)) ? '-' : `${g.tuesdayRate}%`,
      'Wed (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.wednesdayRate == null)) ? '-' : `${g.wednesdayRate}%`,
      'Thu (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.thursdayRate == null)) ? '-' : `${g.thursdayRate}%`,
      'Weekly Average (%)': (mode === 'EXTRA_CLASS' && (weeklyData.totalExtraClasses === 0 || g.weeklyAverageRate == null)) ? '-' : `${g.weeklyAverageRate}%`,
    }));
    const wsGrades = XLSX.utils.json_to_sheet(gradeRows);
    XLSX.utils.book_append_sheet(wb, wsGrades, 'Grade Matrix');

    XLSX.writeFile(wb, `Weekly_Attendance_${selectedWeekStart}_${mode}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">
              {isRTL
                ? 'ހަފްތާ ޚިޔާރުކުރައްވާ (އާދީއްތަ - ބުރާސްފަތި):'
                : 'Select School Week (Sunday - Thursday):'}
            </span>
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
            >
              {Array.from(new Set(ALL_ACADEMIC_WEEKS_2026.map((w) => w.monthName))).map((month) => {
                const monthWeeks = ALL_ACADEMIC_WEEKS_2026.filter((w) => w.monthName === month);
                return (
                  <optgroup key={month} label={`${month} 2026`}>
                    {monthWeeks.map((w) => (
                      <option key={w.startDate} value={w.startDate}>
                        {isRTL ? w.labelDhivehi : w.label} {w.isCurrent ? '★ Current Week' : ''}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchWeeklyReport}
              disabled={loading}
              className="p-2 px-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Weekly Attendance Data"
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
              ? 'Evaluating official morning gate check-in sessions'
              : mode === 'AFTERNOON'
              ? 'Evaluating official post-break afternoon class attendance'
              : mode === 'OFFICIAL'
              ? 'Evaluating official morning & afternoon school sessions'
              : mode === 'EXTRA_CLASS'
              ? 'Evaluating remedial clinics & subject revision sessions'
              : 'Unified weekly evaluation combining official sessions & extra classes'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>{isRTL ? 'ހަފްތާގެ ރިޕޯޓް ތައްޔާރުކުރެވެނީ...' : 'Generating weekly report analytics...'}</span>
        </div>
      )}

      {weeklyData && !loading && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {(weeklyData.weekTitle || `Week ${weeklyData.weekNumber || ''}`).toUpperCase()} • F. MAGOODHOO SCHOOL
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                  <span>
                    Instructional Week: <strong className="text-slate-800">{weeklyData.startDate}</strong> to{' '}
                    <strong className="text-slate-800">{weeklyData.endDate}</strong>
                  </span>
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
                  {weeklyData.weeklyAverageRate != null ? `${weeklyData.weeklyAverageRate}%` : '-'}
                </span>
              </div>
            </div>

            {/* Weekly KPI Highlights */}
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
                    ? 'Weekly Morning Rate'
                    : mode === 'AFTERNOON'
                    ? 'Weekly Afternoon Rate'
                    : mode === 'EXTRA_CLASS'
                    ? 'Weekly Extra Class Rate'
                    : mode === 'BOTH'
                    ? 'Combined Weekly Rate'
                    : 'Official Weekly Rate'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {mode === 'EXTRA_CLASS'
                      ? ((weeklyData.totalExtraClasses === 0 || weeklyData.extraClassWeeklyRate == null) ? '-' : `${weeklyData.weeklyAverageRate ?? weeklyData.extraClassWeeklyRate}%`)
                      : (weeklyData.weeklyAverageRate != null ? `${weeklyData.weeklyAverageRate}%` : '-')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {mode === 'MORNING' && `Gate Check-in Benchmark ≥80%`}
                  {mode === 'AFTERNOON' && `Post-break session average`}
                  {mode === 'BOTH' && `Official: ${weeklyData.officialWeeklyRate != null ? `${weeklyData.officialWeeklyRate}%` : '-'} • Extra: ${(weeklyData.totalExtraClasses === 0 || weeklyData.extraClassWeeklyRate == null) ? '-' : `${weeklyData.extraClassWeeklyRate}%`}`}
                  {mode === 'OFFICIAL' && 'MoE Benchmark ≥80%'}
                  {mode === 'EXTRA_CLASS' && `${weeklyData.totalExtraClasses ?? 0} sessions held`}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                  {isRTL ? 'އެންމެ ރަނގަޅު ކްލާސް' : 'Top Performing Class'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-emerald-950">
                    {weeklyData.bestClass || 'Grade 4'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Highest attendance rate
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {isRTL ? 'ކިޔަވައިދިން ދުވަސް' : 'Instructional Days'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">
                    {weeklyData.instructionalDays}
                  </span>
                  <span className="text-xs text-slate-400">/ {weeklyData.totalSchoolDays}</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {weeklyData.closedDays} days closed/holiday
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">
                  Extra Classes This Week
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-purple-950">
                    {weeklyData.totalExtraClasses ?? 0}
                  </span>
                  <span className="text-xs text-purple-600">sessions</span>
                </div>
                <span className="text-[10px] text-purple-600 block mt-0.5">
                  Clinics & Remedials
                </span>
              </div>
            </div>

            {/* 5-Day Weekly Breakdown Cards */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                {isRTL ? 'ދުވަހުން ދުވަހަށް ހަފްތާގެ ތަފާސްހިސާބު' : 'Daily Attendance Breakdown (Sunday - Thursday)'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {(weeklyData.dailyStats || weeklyData.dailyBreakdown || []).map((d) => (
                  <div
                    key={d.date}
                    className={`p-3.5 rounded-xl border transition ${
                      d.isClosed
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : d.rate >= 90
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{d.dayOfWeek}</span>
                      <span className="text-[10px] font-mono text-slate-400">{d.date.slice(5)}</span>
                    </div>

                    {d.isClosed ? (
                      <div className="mt-3 text-center py-2 bg-slate-100 rounded-lg">
                        <span className="text-xs font-bold text-slate-600 block">SCHOOL CLOSED</span>
                        <span className="text-[10px] text-slate-400">Excused</span>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-slate-500">Rate:</span>
                          <span className="text-lg font-black text-slate-900">
                            {mode === 'EXTRA_CLASS' && (d.extraClassesCount ?? 0) === 0 ? '-' : (d.rate != null ? `${d.rate}%` : '-')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-semibold">Present:</span>
                          <span className="font-mono font-bold text-emerald-800">{d.present}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-rose-600 font-semibold">Absent:</span>
                          <span className="font-mono font-bold text-rose-700">{d.absent}</span>
                        </div>
                        {(mode === 'EXTRA_CLASS' || mode === 'BOTH') && (d.extraClassesCount ?? 0) > 0 && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                            <span className="text-purple-700 font-semibold">Extra Classes:</span>
                            <span className="font-mono font-bold text-purple-800">
                              {d.extraClassesCount}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Grade-by-Grade Daily Comparison Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {isRTL ? 'ގްރޭޑްތަކުގެ ހަފްތާގެ މެޓްރިކްސް' : 'Grade-by-Grade Daily Comparison Matrix'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  All 12 Grades (LKG - Grade 10) • Mode: {mode}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3 text-center">Sun (އާދީއްތަ)</th>
                      <th className="py-2.5 px-3 text-center">Mon (ހޯމަ)</th>
                      <th className="py-2.5 px-3 text-center">Tue (އަންގާރަ)</th>
                      <th className="py-2.5 px-3 text-center">Wed (ބުދަ)</th>
                      <th className="py-2.5 px-3 text-center">Thu (ބުރާސްފަތި)</th>
                      <th className="py-2.5 px-3 text-center font-black bg-slate-200/60">
                        Weekly Average
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(weeklyData.gradeMatrix || []).map((gm) => {
                      const formatCell = (val: number | null | undefined) => {
                        if (val == null || (mode === 'EXTRA_CLASS' && ((weeklyData.totalExtraClasses || 0) === 0 || val === 0))) {
                          return <span className="text-slate-400 font-mono font-bold">-</span>;
                        }
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              val >= 90
                                ? 'bg-emerald-50 text-emerald-800'
                                : val >= 80
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-800 font-bold'
                            }`}
                          >
                            {val}%
                          </span>
                        );
                      };

                      return (
                        <tr key={gm.grade} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{gm.grade}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {formatCell(gm.sundayRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {formatCell(gm.mondayRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {formatCell(gm.tuesdayRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {formatCell(gm.wednesdayRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {formatCell(gm.thursdayRate)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-slate-100/50">
                            {formatCell(gm.weeklyAverageRate)}
                          </td>
                        </tr>
                      );
                    })}
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
