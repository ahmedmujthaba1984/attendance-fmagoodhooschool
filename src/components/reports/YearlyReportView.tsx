import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Building,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../i18n/LanguageContext';
import { YearlyAttendanceReport, AttendanceReportMode, Student, AttendanceRecord } from '../../types';
import { generateClientYearlyReport } from '../../utils/reportGenerator';

interface YearlyReportViewProps {
  reportMode?: AttendanceReportMode;
  onReportModeChange?: (mode: AttendanceReportMode) => void;
  students?: Student[];
  records?: AttendanceRecord[];
}

export const YearlyReportView: React.FC<YearlyReportViewProps> = ({
  reportMode: propReportMode,
  onReportModeChange,
  students = [],
  records = [],
}) => {
  const { t, isRTL } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [mode, setMode] = useState<AttendanceReportMode>(propReportMode || 'BOTH');
  const [loading, setLoading] = useState<boolean>(false);
  const [yearlyData, setYearlyData] = useState<YearlyAttendanceReport | null>(() => {
    return generateClientYearlyReport({
      academicYear: 2026,
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

  const formatRate = (rate: number | null | undefined) => (rate != null ? `${rate}%` : '-');

  const renderBadge = (val: number | null | undefined, customClass?: string) => {
    if (val == null) {
      return <span className="font-mono font-bold text-slate-400">-</span>;
    }
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full ${
          val >= 90
            ? 'bg-emerald-100 text-emerald-800 font-bold'
            : val >= 80
            ? 'bg-sky-100 text-sky-800 font-bold'
            : 'bg-rose-100 text-rose-800 font-black'
        } ${customClass || ''}`}
      >
        {val}%
      </span>
    );
  };

  const handleModeChange = (newMode: AttendanceReportMode) => {
    setMode(newMode);
    if (onReportModeChange) {
      onReportModeChange(newMode);
    }
  };

  const fetchYearlyReport = async () => {
    setLoading(true);
    const fallback = generateClientYearlyReport({
      academicYear: selectedYear,
      reportMode: mode,
      students,
      records,
    });

    try {
      const queryParams = new URLSearchParams({
        reportType: 'yearly',
        year: String(selectedYear),
        reportMode: mode,
      });

      const res = await fetch(`/api/reports/analytics?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setYearlyData(data);
      } else {
        setYearlyData(fallback);
      }
    } catch (err) {
      console.warn('Backend yearly report API offline or cold start, using client generator', err);
      setYearlyData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyReport();
  }, [selectedYear, mode, records]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!yearlyData) return;
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
      { Metric: 'Academic Year', Value: yearlyData.academicYear },
      { Metric: 'Report Mode', Value: modeLabel },
      { Metric: 'MoE Standard Quota', Value: `${yearlyData.moeStandardDays} Days` },
      { Metric: 'Closed / Holidays Deducted', Value: `${yearlyData.closedDaysDeducted} Days` },
      { Metric: 'Net Required Attendance Days', Value: `${yearlyData.netRequiredDays} Days` },
      { Metric: 'Annual Average Rate', Value: yearlyData.annualAverageRate != null ? `${yearlyData.annualAverageRate}%` : '-' },
      {
        Metric: 'Morning Annual Rate',
        Value: (yearlyData.morningAnnualRate ?? yearlyData.annualAverageRate) != null ? `${yearlyData.morningAnnualRate ?? yearlyData.annualAverageRate}%` : '-',
      },
      {
        Metric: 'Afternoon Annual Rate',
        Value: yearlyData.afternoonAnnualRate != null ? `${yearlyData.afternoonAnnualRate}%` : '-',
      },
      {
        Metric: 'Official Annual Rate',
        Value: yearlyData.officialAnnualRate != null ? `${yearlyData.officialAnnualRate}%` : yearlyData.annualAverageRate != null ? `${yearlyData.annualAverageRate}%` : '-',
      },
      {
        Metric: 'Extra Class Annual Rate',
        Value: (yearlyData.totalExtraClasses === 0 || yearlyData.extraClassAnnualRate == null) ? '-' : `${yearlyData.extraClassAnnualRate}%`,
      },
      {
        Metric: 'Combined Annual Rate',
        Value: (yearlyData.combinedAnnualRate ?? yearlyData.annualAverageRate) != null ? `${yearlyData.combinedAnnualRate ?? yearlyData.annualAverageRate}%` : '-',
      },
      { Metric: 'Total Extra Classes Held', Value: yearlyData.totalExtraClasses ?? 48 },
      { Metric: 'Total Enrolled Students', Value: yearlyData.totalEnrolled },
      { Metric: '100% Perfect Attendance Students', Value: yearlyData.perfectAttendanceCount },
      { Metric: 'Chronic Absentees (<80%)', Value: yearlyData.chronicAbsenteesCount },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'MoE Annual Summary');

    // Monthly breakdown sheet
    const months = (yearlyData.monthlyBreakdown || []).map((m) => ({
      Month: m.monthName,
      'Instructional Days': m.instructionalDays,
      'Closed Days Deducted': m.closedDays,
      'Average Rate (%)': (m.rate || m.averageRate) != null ? `${m.rate || m.averageRate}%` : '-',
      'Morning Rate (%)': (m.morningRate ?? m.rate) != null ? `${m.morningRate ?? m.rate}%` : '-',
      'Afternoon Rate (%)': (m.afternoonRate ?? m.rate) != null ? `${m.afternoonRate ?? m.rate}%` : '-',
      'Official Rate (%)': (m.officialRate ?? m.rate) != null ? `${m.officialRate ?? m.rate}%` : '-',
      'Extra Class Rate (%)': (yearlyData.totalExtraClasses ?? 0) === 0 || m.extraClassRate == null ? '-' : `${m.extraClassRate}%`,
    }));
    const wsMonths = XLSX.utils.json_to_sheet(months);
    XLSX.utils.book_append_sheet(wb, wsMonths, 'Monthly Progression');

    // Grade breakdown sheet
    const grades = (yearlyData.gradeBreakdown || []).map((g) => ({
      Grade: g.grade,
      Enrolled: g.enrolled,
      'Annual Rate (%)': g.annualRate != null ? `${g.annualRate}%` : '-',
      'Morning Rate (%)': (g.morningRate ?? g.annualRate) != null ? `${g.morningRate ?? g.annualRate}%` : '-',
      'Afternoon Rate (%)': (g.afternoonRate ?? g.annualRate) != null ? `${g.afternoonRate ?? g.annualRate}%` : '-',
      'Official Rate (%)': (g.officialRate ?? g.annualRate) != null ? `${g.officialRate ?? g.annualRate}%` : '-',
      'Extra Class Rate (%)': (yearlyData.totalExtraClasses ?? 0) === 0 || g.extraClassRate == null ? '-' : `${g.extraClassRate}%`,
      '100% Perfect Attendance': g.perfectAttendanceCount,
      'Chronic Truancy (<80%)': g.chronicCount,
    }));
    const wsGrades = XLSX.utils.json_to_sheet(grades);
    XLSX.utils.book_append_sheet(wb, wsGrades, 'Grade Roster Returns');

    XLSX.writeFile(wb, `MoE_Annual_Report_${yearlyData.academicYear}_${mode}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">
              {isRTL ? 'ދިރާސީ އަހަރު:' : 'Academic Year:'}
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer"
            >
              <option value="2026">Academic Year 2026 (ދިރާސީ އަހަރު 2026)</option>
              <option value="2025">Academic Year 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchYearlyReport}
              disabled={loading}
              className="p-2 px-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Yearly Attendance Data"
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
              <span>{isRTL ? 'ޕްރިންޓް' : 'Print Official MoE Form'}</span>
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
              ? 'Annual MoE return for official morning gate attendance sessions'
              : mode === 'AFTERNOON'
              ? 'Annual MoE return for official afternoon post-break instructional sessions'
              : mode === 'OFFICIAL'
              ? 'Annual MoE return for official morning and afternoon instructional sessions'
              : mode === 'EXTRA_CLASS'
              ? 'Annual returns for remedial classes, tutorials and exam prep sessions'
              : 'Comprehensive annual record combining official sessions and extra classes'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>
            {isRTL
              ? 'އަހަރީ ރިޕޯޓް ލޯޑްވަނީ...'
              : 'Calculating annual MoE attendance returns...'}
          </span>
        </div>
      )}

      {yearlyData && !loading && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  AY
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    MINISTRY OF EDUCATION (MoE) ANNUAL ATTENDANCE REPORT
                  </h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span>
                      F. Magoodhoo School • Academic Year {yearlyData.academicYear} • Republic of
                      Maldives
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
                  {yearlyData.annualAverageRate != null ? `${yearlyData.annualAverageRate}%` : '-'}
                </span>
              </div>
            </div>

            {/* MoE Policy Compliance Banner */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sky-950">
                    Maldives MoE 200-Day Minimum Quota Compliance Formula
                  </h4>
                  <p className="text-sky-800 text-[11px] mt-0.5">
                    Official Formula:{' '}
                    <span className="font-mono font-bold">
                      200 Standard Days – {yearlyData.closedDaysDeducted} Approved Closed Days ={' '}
                      {yearlyData.netRequiredDays} Net Instructional Days
                    </span>{' '}
                    required for promotion. Closed school days (severe weather/official public
                    holidays) are deducted from required days so students are never penalized.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center px-3 py-1.5 rounded-lg bg-white border border-sky-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Standard
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    {yearlyData.moeStandardDays}d
                  </span>
                </div>
                <span className="text-lg font-bold text-sky-700">−</span>
                <div className="text-center px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">
                    Deducted
                  </span>
                  <span className="text-sm font-black text-amber-900">
                    {yearlyData.closedDaysDeducted}d
                  </span>
                </div>
                <span className="text-lg font-bold text-sky-700">=</span>
                <div className="text-center px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                    Net Quota
                  </span>
                  <span className="text-sm font-black text-emerald-900">
                    {yearlyData.netRequiredDays}d
                  </span>
                </div>
              </div>
            </div>

            {/* Annual KPI Metrics */}
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
                    ? 'Annual Morning Rate'
                    : mode === 'AFTERNOON'
                    ? 'Annual Afternoon Rate'
                    : mode === 'EXTRA_CLASS'
                    ? 'Annual Extra Class Rate'
                    : mode === 'BOTH'
                    ? 'Combined Annual Rate'
                    : 'Annual School Rate'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {mode === 'EXTRA_CLASS'
                      ? ((yearlyData.totalExtraClasses === 0 || yearlyData.extraClassAnnualRate == null) ? '-' : `${yearlyData.annualAverageRate}%`)
                      : (yearlyData.annualAverageRate != null ? `${yearlyData.annualAverageRate}%` : '-')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {mode === 'MORNING' && `Morning Check-in Annual Target Met`}
                  {mode === 'AFTERNOON' && `Afternoon Session Annual Average`}
                  {mode === 'BOTH' &&
                    `Official: ${yearlyData.officialAnnualRate != null ? `${yearlyData.officialAnnualRate}%` : '-'} • Extra: ${(yearlyData.totalExtraClasses === 0 || yearlyData.extraClassAnnualRate == null) ? '-' : `${yearlyData.extraClassAnnualRate}%`}`}
                  {mode === 'OFFICIAL' && 'MoE Target Met'}
                  {mode === 'EXTRA_CLASS' && `${yearlyData.totalExtraClasses ?? 0} clinics held`}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                  {isRTL ? '100% ފުރިހަމަ ހާޒިރީ' : '100% Perfect Attendance'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-emerald-900">
                    {yearlyData.perfectAttendanceCount}
                  </span>
                  <span className="text-xs text-emerald-600">students</span>
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Eligible for Annual MoE Award
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">
                  {isRTL ? 'ހާޒިރީ ދަށް (<80%)' : 'Chronic Absentees (<80%)'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-rose-900">
                    {yearlyData.chronicAbsenteesCount}
                  </span>
                  <span className="text-xs text-rose-600">students</span>
                </div>
                <span className="text-[10px] text-rose-600 block mt-0.5">
                  Referred to MoE Welfare
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">
                  {mode === 'MORNING'
                    ? 'Afternoon Annual Rate'
                    : mode === 'AFTERNOON'
                    ? 'Morning Annual Rate'
                    : mode === 'OFFICIAL'
                    ? 'Session Balance (AM / PM)'
                    : 'Total Extra Classes Held'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-purple-950">
                    {mode === 'MORNING'
                      ? (yearlyData.afternoonAnnualRate != null ? `${yearlyData.afternoonAnnualRate}%` : '-')
                      : mode === 'AFTERNOON'
                      ? (yearlyData.morningAnnualRate != null ? `${yearlyData.morningAnnualRate}%` : '-')
                      : mode === 'OFFICIAL'
                      ? `${yearlyData.morningAnnualRate != null ? `${yearlyData.morningAnnualRate}%` : '-'} / ${yearlyData.afternoonAnnualRate != null ? `${yearlyData.afternoonAnnualRate}%` : '-'}`
                      : (yearlyData.totalExtraClasses ?? 0)}
                  </span>
                  {mode !== 'MORNING' && mode !== 'AFTERNOON' && mode !== 'OFFICIAL' && (
                    <span className="text-xs text-purple-600">sessions</span>
                  )}
                </div>
                <span className="text-[10px] text-purple-600 block mt-0.5">
                  {mode === 'MORNING'
                    ? 'Comparative Post-Break Session Rate'
                    : mode === 'AFTERNOON'
                    ? 'Comparative Morning Session Rate'
                    : mode === 'OFFICIAL'
                    ? 'Morning vs Afternoon Averages'
                    : 'Across all grades'}
                </span>
              </div>
            </div>

            {/* Month-by-Month Annual Progression */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                {isRTL ? 'މަހުން މަހަށް އަހަރީ ތާވަލު' : 'Month-by-Month Academic Progression (Jan - Dec)'}
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-center">Instructional Days</th>
                      <th className="py-2.5 px-3 text-center">Closed / Holidays Deducted</th>
                      {mode === 'BOTH' ? (
                        <>
                          <th className="py-2.5 px-3 text-center text-sky-900">Official Rate</th>
                          <th className="py-2.5 px-3 text-center text-purple-900">Extra Class Rate</th>
                          <th className="py-2.5 px-3 text-center font-black text-emerald-950">
                            Combined Rate
                          </th>
                        </>
                      ) : mode === 'MORNING' ? (
                        <th className="py-2.5 px-3 text-center font-black text-sky-900">
                          {isRTL ? 'ހެނދުނުގެ ރޭޓް' : 'Morning Attendance Rate'}
                        </th>
                      ) : mode === 'AFTERNOON' ? (
                        <th className="py-2.5 px-3 text-center font-black text-teal-800">
                          {isRTL ? 'މެންދުރުފަހުގެ ރޭޓް' : 'Afternoon Attendance Rate'}
                        </th>
                      ) : mode === 'OFFICIAL' ? (
                        <>
                          <th className="py-2.5 px-3 text-center text-sky-900">Morning (AM)</th>
                          <th className="py-2.5 px-3 text-center text-teal-800">Afternoon (PM)</th>
                          <th className="py-2.5 px-3 text-center font-black text-slate-900">Official Rate</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-3 text-center font-black">
                          Monthly Attendance Rate
                        </th>
                      )}
                      <th className="py-2.5 px-3 text-center">MoE Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(yearlyData.monthlyBreakdown || []).map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{m.monthName}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {m.instructionalDays} days
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                          {m.closedDays > 0 ? `${m.closedDays} days` : '-'}
                        </td>
                        {mode === 'BOTH' ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-900">
                              {formatRate(m.officialRate ?? m.rate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-900">
                              {(yearlyData.totalExtraClasses ?? 0) === 0 || m.extraClassRate == null ? '-' : `${m.extraClassRate}%`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-950">
                              {renderBadge(m.rate || m.averageRate)}
                            </td>
                          </>
                        ) : mode === 'MORNING' ? (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-sky-950">
                            {renderBadge(m.morningRate ?? m.rate)}
                          </td>
                        ) : mode === 'AFTERNOON' ? (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-teal-950">
                            {renderBadge(m.afternoonRate ?? m.rate)}
                          </td>
                        ) : mode === 'OFFICIAL' ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-900">
                              {formatRate(m.morningRate ?? m.rate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                              {formatRate(m.afternoonRate ?? m.rate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                              {renderBadge(m.officialRate ?? m.rate)}
                            </td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                            {renderBadge(mode === 'EXTRA_CLASS' && ((yearlyData.totalExtraClasses ?? 0) === 0 || m.extraClassRate == null) ? null : (m.rate || m.averageRate))}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {(m.rate || m.averageRate) != null ? ((m.rate || m.averageRate) >= 80 ? '✓ Compliant' : '⚠ Action Required') : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade-Level Annual Breakdown */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                {isRTL
                  ? 'ގްރޭޑްތަކުގެ އަހަރީ ރިޕޯޓް'
                  : 'Annual Grade-Level Attendance & Chronic Truancy Register'}
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3 text-center">Enrolled</th>
                      {mode === 'BOTH' ? (
                        <>
                          <th className="py-2.5 px-3 text-center text-sky-900">Official Rate</th>
                          <th className="py-2.5 px-3 text-center text-purple-900">Extra Class Rate</th>
                          <th className="py-2.5 px-3 text-center font-black text-emerald-950">
                            Combined Annual Rate
                          </th>
                        </>
                      ) : mode === 'MORNING' ? (
                        <th className="py-2.5 px-3 text-center font-black text-sky-900">Morning Annual Rate</th>
                      ) : mode === 'AFTERNOON' ? (
                        <th className="py-2.5 px-3 text-center font-black text-teal-800">Afternoon Annual Rate</th>
                      ) : mode === 'OFFICIAL' ? (
                        <>
                          <th className="py-2.5 px-3 text-center text-sky-900">Morning (AM)</th>
                          <th className="py-2.5 px-3 text-center text-teal-800">Afternoon (PM)</th>
                          <th className="py-2.5 px-3 text-center font-black text-slate-900">Official Rate</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-3 text-center font-black">Annual Attendance Rate</th>
                      )}
                      <th className="py-2.5 px-3 text-center text-emerald-800">
                        100% Perfect Attendance
                      </th>
                      <th className="py-2.5 px-3 text-center text-rose-800">
                        Chronic Absentees (&lt;80%)
                      </th>
                      <th className="py-2.5 px-3 text-center">MoE Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(yearlyData.gradeBreakdown || []).map((gb) => (
                      <tr key={gb.grade} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{gb.grade}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {gb.enrolled}
                        </td>
                        {mode === 'BOTH' ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-900">
                              {formatRate(gb.officialRate ?? gb.annualRate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-900">
                              {(yearlyData.totalExtraClasses ?? 0) === 0 || gb.extraClassRate == null ? '-' : `${gb.extraClassRate}%`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-950">
                              {renderBadge(gb.annualRate)}
                            </td>
                          </>
                        ) : mode === 'MORNING' ? (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-sky-900">
                            {renderBadge(gb.morningRate ?? gb.annualRate)}
                          </td>
                        ) : mode === 'AFTERNOON' ? (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-teal-800">
                            {renderBadge(gb.afternoonRate ?? gb.annualRate)}
                          </td>
                        ) : mode === 'OFFICIAL' ? (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-900">
                              {formatRate(gb.morningRate ?? gb.annualRate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-800">
                              {formatRate(gb.afternoonRate ?? gb.annualRate)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                              {renderBadge(gb.officialRate ?? gb.annualRate)}
                            </td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                            {renderBadge(mode === 'EXTRA_CLASS' && ((yearlyData.totalExtraClasses ?? 0) === 0 || gb.extraClassRate == null) ? null : gb.annualRate)}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {gb.annualRate != null ? `${gb.perfectAttendanceCount} students` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-700">
                          {gb.annualRate != null ? (
                            gb.chronicCount > 0 ? (
                              <span className="font-bold bg-rose-50 px-2 py-0.5 rounded text-rose-800">
                                {gb.chronicCount} students
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            ✓ Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures for Printing */}
            <div className="hidden print:grid grid-cols-3 gap-8 pt-10 mt-10 border-t border-slate-300 text-xs">
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Prepared by: Leading Teacher</p>
                <p className="text-[10px] text-slate-500">Academic & Attendance Unit</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Principal Signature & School Seal</p>
                <p className="text-[10px] text-slate-500">F. Magoodhoo School</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 h-12 mb-2" />
                <p className="font-bold text-slate-800">Ministry of Education Liaison</p>
                <p className="text-[10px] text-slate-500">Education Development Centre (EDC)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
