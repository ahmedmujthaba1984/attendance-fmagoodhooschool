import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Building,
  BookOpen,
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Award,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { MoEGradeStat, DashboardTrendPoint, AttendanceReportMode } from '../types';

interface AnalyticsChartsProps {
  gradeStats: MoEGradeStat[];
  activeLeavesCount: number;
  notInIslandCount: number;
  sickLeaveCount: number;
  selectedDate?: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  gradeStats: propGradeStats,
  activeLeavesCount,
  notInIslandCount,
  sickLeaveCount,
  selectedDate = '2026-09-24',
}) => {
  const { t, isRTL } = useLanguage();
  const [reportMode, setReportMode] = useState<AttendanceReportMode>('BOTH');
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [barDisplayType, setBarDisplayType] = useState<'rates' | 'breakdown'>('rates');

  // Live data fetched from /api/analytics/dashboard
  const [dashboardData, setDashboardData] = useState<{
    trendDataWeek: DashboardTrendPoint[];
    trendDataMonth: DashboardTrendPoint[];
    gradeStats: MoEGradeStat[];
    extraClassSubjectDistribution: Array<{
      name: string;
      value: number;
      studentCount: number;
      color: string;
    }>;
    summary: {
      officialRate: number;
      extraClassRate: number;
      combinedRate: number;
      totalExtraClassesHeld: number;
      totalStudents: number;
      baseline: number;
    };
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics/dashboard?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setDashboardData(data);
          }
        }
      } catch (err) {
        console.warn('Could not load dashboard analytics from API, using fallback data', err);
      }
    };

    fetchDashboardAnalytics();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Fallback Trend Data if API is pending or offline
  const fallbackTrendMonth: DashboardTrendPoint[] = useMemo(
    () => [
      { date: 'Aug 24 (Sun)', fullDate: '2026-08-24', morning: 95.8, postBreak: 94.2, officialRate: 95.0, extraClassRate: 92.4, extraClassesCount: 1, combinedRate: 94.1, baseline: 90 },
      { date: 'Aug 25 (Mon)', fullDate: '2026-08-25', morning: 96.2, postBreak: 95.0, officialRate: 95.6, extraClassRate: 93.1, extraClassesCount: 2, combinedRate: 94.8, baseline: 90 },
      { date: 'Aug 26 (Tue)', fullDate: '2026-08-26', morning: 94.4, postBreak: 93.1, officialRate: 93.8, extraClassRate: 91.8, extraClassesCount: 1, combinedRate: 93.1, baseline: 90 },
      { date: 'Aug 27 (Wed)', fullDate: '2026-08-27', morning: 93.8, postBreak: 92.5, officialRate: 93.2, extraClassRate: 92.0, extraClassesCount: 2, combinedRate: 92.8, baseline: 90 },
      { date: 'Aug 28 (Thu)', fullDate: '2026-08-28', morning: 92.1, postBreak: 90.4, officialRate: 91.3, extraClassRate: 89.5, extraClassesCount: 1, combinedRate: 90.7, baseline: 90 },
      { date: 'Aug 31 (Sun)', fullDate: '2026-08-31', morning: 94.9, postBreak: 93.8, officialRate: 94.4, extraClassRate: 93.5, extraClassesCount: 1, combinedRate: 94.1, baseline: 90 },
      { date: 'Sep 01 (Mon)', fullDate: '2026-09-01', morning: 95.3, postBreak: 94.1, officialRate: 94.7, extraClassRate: 94.2, extraClassesCount: 2, combinedRate: 94.5, baseline: 90 },
      { date: 'Sep 02 (Tue)', fullDate: '2026-09-02', morning: 96.0, postBreak: 95.2, officialRate: 95.6, extraClassRate: 94.8, extraClassesCount: 2, combinedRate: 95.3, baseline: 90 },
      { date: 'Sep 03 (Wed)', fullDate: '2026-09-03', morning: 94.7, postBreak: 93.9, officialRate: 94.3, extraClassRate: 93.0, extraClassesCount: 1, combinedRate: 93.9, baseline: 90 },
      { date: 'Sep 04 (Thu)', fullDate: '2026-09-04', morning: 93.2, postBreak: 91.8, officialRate: 92.5, extraClassRate: 91.5, extraClassesCount: 1, combinedRate: 92.2, baseline: 90 },
      { date: 'Sep 07 (Mon)', fullDate: '2026-09-07', morning: 95.1, postBreak: 94.0, officialRate: 94.6, extraClassRate: 93.4, extraClassesCount: 2, combinedRate: 94.2, baseline: 90 },
      { date: 'Sep 08 (Tue)', fullDate: '2026-09-08', morning: 95.8, postBreak: 94.5, officialRate: 95.2, extraClassRate: 94.0, extraClassesCount: 2, combinedRate: 94.8, baseline: 90 },
      { date: 'Sep 09 (Wed)', fullDate: '2026-09-09', morning: 94.2, postBreak: 93.4, officialRate: 93.8, extraClassRate: 92.6, extraClassesCount: 1, combinedRate: 93.4, baseline: 90 },
      { date: 'Sep 10 (Thu)', fullDate: '2026-09-10', morning: 95.0, postBreak: 94.1, officialRate: 94.6, extraClassRate: 93.8, extraClassesCount: 2, combinedRate: 94.3, baseline: 90 },
      { date: 'Sep 11 (Thu)', fullDate: '2026-09-11', morning: 95.4, postBreak: 94.6, officialRate: 95.0, extraClassRate: 94.2, extraClassesCount: 2, combinedRate: 94.7, baseline: 90 },
    ],
    []
  );

  const fallbackTrendWeek: DashboardTrendPoint[] = useMemo(
    () => fallbackTrendMonth.slice(-5),
    [fallbackTrendMonth]
  );

  // Active trend series based on timeframe selection
  const activeTrendData = useMemo(() => {
    if (dashboardData) {
      return timeframe === 'week' ? dashboardData.trendDataWeek : dashboardData.trendDataMonth;
    }
    return timeframe === 'week' ? fallbackTrendWeek : fallbackTrendMonth;
  }, [dashboardData, timeframe, fallbackTrendWeek, fallbackTrendMonth]);

  // Active grade statistics
  const activeGradeStats = useMemo(() => {
    if (dashboardData?.gradeStats && dashboardData.gradeStats.length > 0) {
      return dashboardData.gradeStats;
    }
    return propGradeStats;
  }, [dashboardData, propGradeStats]);

  // Summary rates (real metrics, null if unrecorded)
  const morningRate = (dashboardData?.summary as any)?.morningRate ?? null;
  const afternoonRate = (dashboardData?.summary as any)?.afternoonRate ?? null;
  const officialRate = dashboardData?.summary?.officialRate ?? null;
  const extraClassRate = dashboardData?.summary?.extraClassRate ?? null;
  const combinedRate = dashboardData?.summary?.combinedRate ?? null;
  const totalExtraClasses = dashboardData?.summary?.totalExtraClassesHeld ?? 0;

  // Grade Bar Chart Data preparation
  const gradeChartData = useMemo(() => {
    return activeGradeStats.map((g) => {
      const offRate = g.officialRate ?? g.attendanceRate ?? null;

      const gradeExtraHeld = g.extraClassesHeld ?? 0;
      const gradeExtraAttended = g.extraClassAttended ?? 0;
      const gradeExtraLate = g.extraClassLate ?? 0;
      const gradeExtraAbsent = g.extraClassAbsent ?? 0;
      const gradeExtraLeave = g.extraClassLeave ?? 0;
      const gradeExtraTotal = gradeExtraAttended + gradeExtraLate + gradeExtraAbsent + gradeExtraLeave;
      const hasExtraClasses = gradeExtraHeld > 0 || gradeExtraTotal > 0;

      // Real extra class rate only if sessions exist for this grade, otherwise null
      const exRate = hasExtraClasses
        ? (g.extraClassRate ?? (gradeExtraTotal > 0 ? Math.round(((gradeExtraAttended + gradeExtraLate) / gradeExtraTotal) * 100) : null))
        : null;

      // Combined rate calculation
      let combRate: number | null = null;
      if (hasExtraClasses && exRate != null && offRate != null) {
        combRate = g.combinedRate ?? Math.round((offRate * 2 + exRate) / 3);
      } else if (hasExtraClasses && exRate != null) {
        combRate = exRate;
      } else if (offRate != null) {
        combRate = offRate;
      }

      return {
        grade: g.grade,
        // Official / Morning Stacked Breakdown
        Present: g.morningPresent ?? 0,
        Late: g.morningLate ?? 0,
        Leave: g.morningLeave ?? 0,
        Absent: g.morningAbsent ?? 0,
        morningRate: g.morningRate ?? (g.totalEnrolled > 0 && (g.morningPresent + g.morningLate) > 0 ? Math.round(((g.morningPresent + g.morningLate) / g.totalEnrolled) * 100) : null),
        // Afternoon Breakdown
        afternoonPresent: g.postBreakPresent ?? 0,
        afternoonAbsent: g.postBreakAbsent ?? 0,
        afternoonRate: g.afternoonRate ?? (g.totalEnrolled > 0 && g.postBreakPresent > 0 ? Math.round((g.postBreakPresent / g.totalEnrolled) * 100) : null),
        officialRate: offRate,
        // Extra Class Stacked Breakdown
        extraAttended: gradeExtraAttended,
        extraLate: gradeExtraLate,
        extraLeave: gradeExtraLeave,
        extraAbsent: gradeExtraAbsent,
        extraClassRate: exRate,
        // Combined comparison
        combinedRate: combRate,
        combinedPresent: (g.morningPresent ?? 0) + (g.postBreakPresent ?? 0),
        combinedLeave: (g.morningLeave ?? 0) + gradeExtraLeave,
        combinedAbsent: (g.morningAbsent ?? 0) + (g.postBreakAbsent ?? 0) + gradeExtraAbsent,
        // Enrolled
        enrolled: g.totalEnrolled,
      };
    });
  }, [activeGradeStats]);

  const hasAnyGradeData = useMemo(() => {
    return gradeChartData.some(
      (d) => d.officialRate != null || d.extraClassRate != null || d.combinedRate != null || (d.Present + d.Late + d.Absent + d.Leave) > 0
    );
  }, [gradeChartData]);

  // Distribution chart data depending on mode
  const officialLeaveData = useMemo(() => {
    const totalLeaves = activeLeavesCount || 0;
    if (totalLeaves === 0) {
      return [];
    }
    const sick = sickLeaveCount || 0;
    const notInIsland = notInIslandCount || 0;
    const other = Math.max(0, totalLeaves - sick - notInIsland);

    const items = [];
    if (sick > 0) {
      const normalSick = Math.ceil(sick / 2);
      const mcSick = sick - normalSick;
      if (normalSick > 0) {
        items.push({
          name: isRTL ? 'ބަލިވެގެން (އާދައިގެ)' : 'Sick Leave (Normal)',
          value: normalSick,
          color: '#0284c7',
        });
      }
      if (mcSick > 0) {
        items.push({
          name: isRTL ? 'މެޑިކަލް ސެޓްފިކެޓް (MC)' : 'Sick Leave (MC)',
          value: mcSick,
          color: '#0d9488',
        });
      }
    }
    if (notInIsland > 0) {
      items.push({
        name: isRTL ? 'ރަށުގައި ނެތް (ދަތުރު)' : 'Not in Island (Travel)',
        value: notInIsland,
        color: '#8b5cf6',
      });
    }
    if (other > 0) {
      items.push({
        name: isRTL ? 'އެހެނިހެން ހުއްދަ' : 'Other Approved Leaves',
        value: other,
        color: '#f59e0b',
      });
    }
    return items;
  }, [isRTL, sickLeaveCount, notInIslandCount, activeLeavesCount]);

  const extraClassSubjectData = useMemo(() => {
    if (dashboardData?.extraClassSubjectDistribution && dashboardData.extraClassSubjectDistribution.length > 0) {
      return dashboardData.extraClassSubjectDistribution.filter((d: any) => d.value > 0);
    }
    return [];
  }, [dashboardData]);

  const combinedCompositionData = useMemo(() => {
    let morningSessions = 0;
    let afternoonSessions = 0;
    let extraSessions = 0;
    let leaveSessions = 0;
    let absentSessions = 0;

    activeGradeStats.forEach((g) => {
      morningSessions += (g.morningPresent ?? 0) + (g.morningLate ?? 0);
      afternoonSessions += (g.postBreakPresent ?? 0);
      extraSessions += (g.extraClassAttended ?? 0) + (g.extraClassLate ?? 0);
      leaveSessions += (g.morningLeave ?? 0);
      absentSessions += (g.morningAbsent ?? 0) + (g.postBreakAbsent ?? 0) + (g.extraClassAbsent ?? 0);
    });

    if (leaveSessions === 0 && activeLeavesCount > 0) {
      leaveSessions = activeLeavesCount;
    }

    const total = morningSessions + afternoonSessions + extraSessions + leaveSessions + absentSessions;
    if (total === 0) {
      return [];
    }

    const items = [];
    if (morningSessions > 0) {
      items.push({
        name: isRTL ? 'ހެނދުނުގެ ރަސްމީ ސެޝަން' : 'Official Morning Sessions',
        value: morningSessions,
        color: '#0284c7',
      });
    }
    if (afternoonSessions > 0) {
      items.push({
        name: isRTL ? 'ބްރޭކަށްފަހު ރަސްމީ ސެޝަން' : 'Official Afternoon Sessions',
        value: afternoonSessions,
        color: '#0d9488',
      });
    }
    if (extraSessions > 0) {
      items.push({
        name: isRTL ? 'އިތުރު ކްލާސް / ރިމީޑިއަލް' : 'Extra Classes & Remedials',
        value: extraSessions,
        color: '#8b5cf6',
      });
    }
    if (leaveSessions > 0) {
      items.push({
        name: isRTL ? 'ހުއްދަ ދެވިފައިވާ ސަލާމް' : 'Authorized Leaves',
        value: leaveSessions,
        color: '#f59e0b',
      });
    }
    if (absentSessions > 0) {
      items.push({
        name: isRTL ? 'ޣައިރު ޙާޟިރު (ހުއްދަނޫން)' : 'Unexcused Absences',
        value: absentSessions,
        color: '#ef4444',
      });
    }

    return items;
  }, [activeGradeStats, isRTL, activeLeavesCount]);

  const currentDistributionData = useMemo(() => {
    if (reportMode === 'OFFICIAL') return officialLeaveData;
    if (reportMode === 'EXTRA_CLASS') return extraClassSubjectData;
    return combinedCompositionData;
  }, [reportMode, officialLeaveData, extraClassSubjectData, combinedCompositionData]);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* REPORT MODE SELECTOR & ANALYTICS KPI BANNER */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">
                {isRTL ? 'ހާޒިރީ އެނަލިޓިކްސް އަދި ޓްރެންޑްސް' : 'Attendance Analytics & Trends'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRTL
                ? 'ރަސްމީ ސެޝަންތައް، އިތުރު ކްލާސްތައް އަދި ދެބައި އެކުގައި ދައްކުވައިދޭ ޑޭޝްބޯޑް'
                : 'Comprehensive trends and breakdown for Official Sessions, Extra Classes, and Combined Attendance'}
            </p>
          </div>

          {/* Mode Toggle Button Group */}
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto gap-1">
            <button
              type="button"
              onClick={() => setReportMode('MORNING')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                reportMode === 'MORNING'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ހެނދުނު' : 'Morning'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('AFTERNOON')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                reportMode === 'AFTERNOON'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isRTL ? 'މެންދުރުފަސް' : 'Afternoon'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('EXTRA_CLASS')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                reportMode === 'EXTRA_CLASS'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRTL ? 'އިތުރު ކްލާސް' : 'Extra Class'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('BOTH')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                reportMode === 'BOTH'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ދެބައި އެކުގައި' : 'Both'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReportMode('OFFICIAL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                reportMode === 'OFFICIAL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ރަސްމީ (ހެނދުނު+މެންދުރު)' : 'Official (Both)'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Card 1: Morning Rate */}
          <div
            className={`p-3 rounded-xl border transition ${
              reportMode === 'MORNING'
                ? 'bg-sky-50/90 border-sky-300 ring-2 ring-sky-500/20'
                : 'bg-slate-50 border-slate-200/80 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" />
                {isRTL ? 'ހެނދުނުގެ ރޭޓް' : 'Morning Rate'}
              </span>
              {reportMode === 'MORNING' && (
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-sky-950">{morningRate != null ? `${morningRate}%` : '-'}</span>
              <span className="text-[10px] text-sky-600">am</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Before Break Arrival
            </span>
          </div>

          {/* Card 2: Afternoon Rate */}
          <div
            className={`p-3 rounded-xl border transition ${
              reportMode === 'AFTERNOON'
                ? 'bg-teal-50/90 border-teal-300 ring-2 ring-teal-500/20'
                : 'bg-slate-50 border-slate-200/80 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" />
                {isRTL ? 'މެންދުރުފަސް ރޭޓް' : 'Afternoon Rate'}
              </span>
              {reportMode === 'AFTERNOON' && (
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-teal-950">{afternoonRate != null ? `${afternoonRate}%` : '-'}</span>
              <span className="text-[10px] text-teal-600">pm</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Post-Break Session
            </span>
          </div>

          {/* Card 3: Extra Class Rate */}
          <div
            className={`p-3 rounded-xl border transition ${
              reportMode === 'EXTRA_CLASS'
                ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-slate-50 border-slate-200/80 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-600" />
                {isRTL ? 'އިތުރު ކްލާސް' : 'Extra Class'}
              </span>
              {reportMode === 'EXTRA_CLASS' && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-purple-950">
                {totalExtraClasses > 0 && extraClassRate != null ? `${extraClassRate}%` : '-'}
              </span>
              <span className="text-[10px] text-purple-600">clinics</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {totalExtraClasses} Sessions Held
            </span>
          </div>

          {/* Card 4: Combined Overall Rate */}
          <div
            className={`p-3 rounded-xl border transition ${
              reportMode === 'BOTH'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200/80 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {isRTL ? 'އެކުލެވޭ ރޭޓް' : 'Combined Rate'}
              </span>
              {reportMode === 'BOTH' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-950">
                {combinedRate != null ? `${combinedRate}%` : (officialRate != null ? `${officialRate}%` : '-')}
              </span>
              <span className="text-[10px] text-emerald-600">all</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Official + Extra Classes
            </span>
          </div>

          {/* Card 5: MoE Compliance Benchmark */}
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                {isRTL ? 'އެމް.އޯ.އީ' : 'MoE Target'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                &ge; 90%
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900">
                {reportMode === 'MORNING'
                  ? morningRate != null ? (morningRate >= 90 ? 'Exemplary' : 'Target <90%') : '-'
                  : reportMode === 'AFTERNOON'
                  ? afternoonRate != null ? (afternoonRate >= 90 ? 'Exemplary' : 'Target <90%') : '-'
                  : reportMode === 'OFFICIAL'
                  ? officialRate != null ? (officialRate >= 90 ? 'Exemplary' : 'Target <90%') : '-'
                  : reportMode === 'EXTRA_CLASS'
                  ? totalExtraClasses > 0 && extraClassRate != null ? (extraClassRate >= 90 ? 'Exemplary' : 'Satisfactory') : '-'
                  : combinedRate != null ? (combinedRate >= 90 ? 'Exemplary' : 'Target <90%') : (officialRate != null ? (officialRate >= 90 ? 'Exemplary' : 'Target <90%') : '-')}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Above 90% Target Floor
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHART 1: ATTENDANCE TRENDS (LINE CHART WITH 5 MODES) */}
      {/* ======================================================== */}
      <div id="analytics-trend-card" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {reportMode === 'MORNING' &&
                  (isRTL ? 'ހެނދުނުގެ ހާޒިރީގެ ޓްރެންޑްސް' : 'Morning Session Attendance Trends')}
                {reportMode === 'AFTERNOON' &&
                  (isRTL ? 'މެންދުރުފަހު ހާޒިރީގެ ޓްރެންޑްސް' : 'Afternoon Session (Post-Break) Trends')}
                {reportMode === 'OFFICIAL' &&
                  (isRTL
                    ? 'ރަސްމީ ހާޒިރީގެ ޓްރެންޑްތައް (ހެނދުނު އަދި ބްރޭކަށްފަހު)'
                    : 'Official Attendance Trends (Morning vs Post-Break)')}
                {reportMode === 'EXTRA_CLASS' &&
                  (isRTL
                    ? 'އިތުރު ކްލާސްތަކުގެ ހާޒިރީ ޓްރެންޑްސް'
                    : 'Extra Class & Remedial Attendance Trends')}
                {reportMode === 'BOTH' &&
                  (isRTL
                    ? 'އެކުލެވޭ ހާޒިރީ ޓްރެންޑްސް (ރަސްމީ، އިތުރު ކްލާސް އަދި އެކުގައި)'
                    : 'Comprehensive Attendance Trends (Official vs Extra Class vs Combined)')}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  reportMode === 'MORNING'
                    ? 'bg-sky-100 text-sky-800'
                    : reportMode === 'AFTERNOON'
                    ? 'bg-teal-100 text-teal-800'
                    : reportMode === 'OFFICIAL'
                    ? 'bg-slate-100 text-slate-800'
                    : reportMode === 'EXTRA_CLASS'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {reportMode === 'MORNING'
                  ? 'Morning Only'
                  : reportMode === 'AFTERNOON'
                  ? 'Afternoon Only'
                  : reportMode === 'OFFICIAL'
                  ? 'Official (Both Sessions)'
                  : reportMode === 'EXTRA_CLASS'
                  ? 'Extra Class Only'
                  : 'Combined'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {reportMode === 'MORNING' &&
                (isRTL
                  ? 'ކޮންމެ ދުވަހަކު ހެނދުނު ސްކޫލަށް އައުމުގެ ހާޒިރީ ރޭޓް'
                  : 'Tracking morning official arrival and gate attendance rate over time')}
              {reportMode === 'AFTERNOON' &&
                (isRTL
                  ? 'ހެނދުނުގެ ބްރޭކަށްފަހު ކުލާހުގައި ދަރިވަރުން ތިބި މިންވަރު'
                  : 'Tracking afternoon post-break retention and classroom attendance over time')}
              {reportMode === 'OFFICIAL' &&
                (isRTL
                  ? 'ހެނދުނުގެ ސެޝަނާއި ސައިބޯގަޑިއަށްފަހު ކުދިން އެނބުރި އަންނަ މިންވަރުގެ އަޅާކިޔުން'
                  : 'Tracking official morning arrival and post-break tea-time retention over time')}
              {reportMode === 'EXTRA_CLASS' &&
                (isRTL
                  ? 'އިތުރު ކްލާސްތަކާއި ރިމީޑިއަލް ކްލިނިކްތަކުގެ ހާޒިރީ ރޭޓް ދުވަހުން ދުވަހަށް'
                  : 'Tracking student participation and attendance in scheduled extra classes & subject tutorials')}
              {reportMode === 'BOTH' &&
                (isRTL
                  ? 'ރަސްމީ ދަންފަޅިތަކާއި އިތުރު ކްލާސްތަކުގެ ރޭޓް އަޅާކިޔައި އެކުލެވޭ ޖުމްލަ ހާޒިރީ ބެލުން'
                  : 'Side-by-side comparison of official school sessions, extra classes, and overall combined attendance')}
            </p>
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isRTL ? 'މި ހަފްތާ' : 'This Week'}
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isRTL ? 'މި މަސް (15 ދުވަސް)' : 'This Month'}
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(val: number | string | undefined, name: string | undefined) => [
                  `${Number(val ?? 0).toFixed(1)}%`,
                  name ?? '',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {/* MODE: MORNING ONLY */}
              {reportMode === 'MORNING' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="morning"
                    name={isRTL ? 'ހެނދުނުގެ ސެޝަން' : 'Morning Session Rate (%)'}
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0284c7' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {/* MODE: AFTERNOON ONLY */}
              {reportMode === 'AFTERNOON' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="postBreak"
                    name={isRTL ? 'މެންދުރުފަސް ސެޝަން' : 'Afternoon Session Rate (%)'}
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0d9488' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {/* MODE: OFFICIAL ONLY */}
              {reportMode === 'OFFICIAL' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="morning"
                    name={isRTL ? 'ހެނދުނުގެ ސެޝަން' : 'Morning Session (Before Break)'}
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0284c7' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="postBreak"
                    name={isRTL ? 'ބްރޭކަށްފަހު ސެޝަން' : 'Post-Break Session (After Tea-time)'}
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0d9488' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="officialRate"
                    name={isRTL ? 'ރަސްމީ އެވްރެޖް' : 'Official Daily Average'}
                    stroke="#1e293b"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </>
              )}

              {/* MODE: EXTRA CLASS ONLY */}
              {reportMode === 'EXTRA_CLASS' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="extraClassRate"
                    name={isRTL ? 'އިތުރު ކްލާހުގެ ހާޒިރީ ރޭޓް' : 'Extra Class Attendance Rate (%)'}
                    stroke="#9333ea"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#9333ea' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {/* MODE: BOTH (OFFICIAL & EXTRA CLASS) */}
              {reportMode === 'BOTH' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="officialRate"
                    name={isRTL ? 'ރަސްމީ ހާޒިރީ ރޭޓް' : 'Official Attendance Rate (%)'}
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0284c7' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="extraClassRate"
                    name={isRTL ? 'އިތުރު ކްލާސް ހާޒިރީ ރޭޓް' : 'Extra Class Attendance Rate (%)'}
                    stroke="#9333ea"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#9333ea' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="combinedRate"
                    name={isRTL ? 'އެކުލެވޭ ޖުމްލަ ރޭޓް' : 'Combined Overall Rate (%)'}
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#059669' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {/* Universal MoE 90% Benchmark Threshold */}
              <Line
                type="monotone"
                dataKey="baseline"
                name={isRTL ? 'އެމް.އޯ.އީ ޓާގެޓް (90%)' : 'MoE Target Threshold (90%)'}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRID: CHARTS 2 & 3 (GRADE BREAKDOWN & DISTRIBUTION) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 2: GRADE-WISE BREAKDOWN & COMPARISON */}
        <div id="analytics-grade-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {reportMode === 'MORNING' &&
                    (isRTL
                      ? 'ގްރޭޑްތަކުގެ ހެނދުނުގެ ހާޒިރީގެ ތަފްޞީލު'
                      : 'Grade-Wise Morning Attendance Breakdown')}
                  {reportMode === 'AFTERNOON' &&
                    (isRTL
                      ? 'ގްރޭޑްތަކުގެ މެންދުރުފަސް (ބްރޭކަށްފަހު) ހާޒިރީ'
                      : 'Grade-Wise Afternoon Session Breakdown')}
                  {reportMode === 'OFFICIAL' &&
                    (isRTL
                      ? 'ގްރޭޑްތަކުގެ ރަސްމީ ހާޒިރީގެ ތަފްޞީލު'
                      : 'Grade-Wise Official Attendance Breakdown')}
                  {reportMode === 'EXTRA_CLASS' &&
                    (isRTL
                      ? 'ގްރޭޑްތަކުގެ އިތުރު ކްލާސް ބައިވެރިވުން'
                      : 'Grade-Wise Extra Class Participation & Attendance')}
                  {reportMode === 'BOTH' &&
                    (isRTL
                      ? 'ގްރޭޑްތަކުގެ ހާޒިރީ އަޅާކިޔުން (ރަސްމީ، އިތުރު ކްލާސް އަދި އެކުގައި)'
                      : 'Grade-Wise Attendance Comparison (Official vs Extra Class vs Combined)')}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  12 Grades
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportMode === 'MORNING' &&
                  (isRTL
                    ? 'ކޮންމެ ގްރޭޑަކުން ހެނދުނު ހާޒިރުވި، ލަސްވި، ސަލާމް ބުނި އަދި ސަލާމް ނުބުނެ ކެނޑުނު އަދަދު'
                    : 'Morning session breakdown: present, late, excused leaves, and unexcused absences')}
                {reportMode === 'AFTERNOON' &&
                  (isRTL
                    ? 'ކޮންމެ ގްރޭޑަކުން މެންދުރުފަސް ސެޝަނަށް ހާޒިރުވި އަދި ޣައިރުޙާޟިރުވި އަދަދު'
                    : 'Post-break afternoon session breakdown: attended vs missed sessions')}
                {reportMode === 'OFFICIAL' &&
                  (isRTL
                    ? 'އެލްކޭޖީ، ޔޫކޭޖީ އަދި ގްރޭޑް 1 އިން 10 އަށް ހާޒިރު، ލަސްވި އަދި ސަލާމް ބެހިފައިވާ ގޮތް'
                    : 'Comparison of present, late, on leave, and absent across all 12 grades (LKG to Gr 10)')}
                {reportMode === 'EXTRA_CLASS' &&
                  (isRTL
                    ? 'ގްރޭޑްތަކުގައި އިތުރު ކްލާހަށް ހާޒިރުވި، ލަސްވި އަދި ޣައިރުޙާޟިރުވި ދަރިވަރުންގެ ނިސްބަތް'
                    : 'Extra class clinics attended, late arrivals, approved leaves, and missed sessions')}
                {reportMode === 'BOTH' &&
                  (isRTL
                    ? 'ރަސްމީ ހާޒިރީ ރޭޓާއި އިތުރު ކްލާހުގެ ރޭޓް އަދި އެކުލެވޭ ޖުމްލަ ރޭޓް ކޮންމެ ގްރޭޑަކަށް'
                    : 'Side-by-side rates comparison across all 12 grades')}
              </p>
            </div>

            {/* Display toggle for Both mode: Rates % vs Stacked Breakdown */}
            {reportMode === 'BOTH' && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBarDisplayType('rates')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    barDisplayType === 'rates'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isRTL ? 'ރޭޓްތައް (%)' : 'Rates (%)'}
                </button>
                <button
                  type="button"
                  onClick={() => setBarDisplayType('breakdown')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    barDisplayType === 'breakdown'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isRTL ? 'ސެޝަންތައް' : 'Sessions'}
                </button>
              </div>
            )}
          </div>

          {!hasAnyGradeData && (
            <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isRTL
                  ? 'މި ތާރީޚަށް ހާޒިރީ އަދި ރެކޯޑް ކުރެވިފައެއް ނުވޭ. ހާޒިރީ މެޓްރިކްސްއިން މިއަދުގެ ހާޒިރީ ނަންގަވާ.'
                  : `No attendance records marked yet for ${selectedDate}. Mark attendance in the Attendance Matrix to view live grade rates.`}
              </span>
            </div>
          )}

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* MODE 1: MORNING ONLY (STACKED BAR) */}
              {reportMode === 'MORNING' ? (
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      `${val ?? 0} students`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Present" name={t.present} stackId="am" fill="#0284c7" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Late" name={t.late} stackId="am" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Leave" name={t.leave} stackId="am" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Absent" name={t.absent} stackId="am" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : reportMode === 'AFTERNOON' ? (
                /* MODE 2: AFTERNOON ONLY (STACKED BAR) */
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      `${val ?? 0} students`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="afternoonPresent" name={isRTL ? 'މެންދުރުފަސް ހާޒިރު' : 'Afternoon Attended'} stackId="pm" fill="#0d9488" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="afternoonAbsent" name={isRTL ? 'މެންދުރުފަސް ޣައިރުޙާޟިރު' : 'Afternoon Absent'} stackId="pm" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : reportMode === 'OFFICIAL' ? (
                /* MODE 3: OFFICIAL (MORNING + AFTERNOON) */
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      `${val ?? 0} students`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Present" name={t.present} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Late" name={t.late} stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Leave" name={t.leave} stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Absent" name={t.absent} stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : reportMode === 'EXTRA_CLASS' ? (
                /* MODE 2: EXTRA CLASS ONLY (STACKED CLINICS PARTICIPATION) */
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      `${val ?? 0} student clinics`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="extraAttended"
                    name={isRTL ? 'ކްލިނިކަށް ހާޒިރުވި' : 'Clinics Attended'}
                    stackId="ec"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="extraLate"
                    name={isRTL ? 'ލަހުން އައި' : 'Late Arrival'}
                    stackId="ec"
                    fill="#f59e0b"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="extraLeave"
                    name={isRTL ? 'ސަލާމް' : 'Excused Leave'}
                    stackId="ec"
                    fill="#6366f1"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="extraAbsent"
                    name={isRTL ? 'ޣައިރުޙާޟިރު' : 'Missed / Absent'}
                    stackId="ec"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : barDisplayType === 'rates' ? (
                /* MODE 3A: BOTH (RATES COMPARISON SIDE-BY-SIDE) */
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      val != null ? `${val}%` : (isRTL ? 'ރެކޯޑެއް ނެތް / ބާއްވާފައި ނުވޭ' : 'None / Not Recorded'),
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="officialRate"
                    name={isRTL ? 'ރަސްމީ ރޭޓް (%)' : 'Official Rate (%)'}
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="extraClassRate"
                    name={isRTL ? 'އިތުރު ކްލާސް ރޭޓް (%)' : 'Extra Class Rate (%)'}
                    fill="#9333ea"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="combinedRate"
                    name={isRTL ? 'އެކުލެވޭ ޖުމްލަ ރޭޓް (%)' : 'Combined Rate (%)'}
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                /* MODE 3B: BOTH (STACKED SESSIONS) */
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      `${val ?? 0} sessions`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="combinedPresent"
                    name={isRTL ? 'ރަސްމީ ހާޒިރީ' : 'Official Present'}
                    stackId="comb"
                    fill="#0284c7"
                  />
                  <Bar
                    dataKey="extraAttended"
                    name={isRTL ? 'އިތުރު ކްލާސް ހާޒިރީ' : 'Extra Class Attended'}
                    stackId="comb"
                    fill="#9333ea"
                  />
                  <Bar
                    dataKey="combinedLeave"
                    name={isRTL ? 'ސަލާމް' : 'Leaves'}
                    stackId="comb"
                    fill="#6366f1"
                  />
                  <Bar
                    dataKey="combinedAbsent"
                    name={isRTL ? 'ޣައިރުޙާޟިރު' : 'Absences'}
                    stackId="comb"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: DISTRIBUTION (LEAVE REASONS / EXTRA CLASS SUBJECTS / COMBINED) */}
        <div id="analytics-leaves-card" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-slate-900">
                {reportMode === 'OFFICIAL' &&
                  (isRTL ? 'ސަލާމުގެ ސަބަބުތައް' : 'Leave Reasons Distribution')}
                {reportMode === 'EXTRA_CLASS' &&
                  (isRTL ? 'އިތުރު ކްލާސްތައް ބެހިފައިވާ މާއްދާތައް' : 'Extra Classes by Subject')}
                {reportMode === 'BOTH' &&
                  (isRTL ? 'ޖުމްލަ ސެޝަންތަކުގެ ނިސްބަތް' : 'Combined Session Composition')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {reportMode === 'OFFICIAL' &&
                (isRTL
                  ? 'ބަލިވެގެން، މެޑިކަލް ސެޓްފިކެޓް އަދި ރަށުން ބޭރަށް ދިޔުމުގެ ނިސްބަތް'
                  : 'Distribution of verified leaves, medical certificates, and island travel')}
              {reportMode === 'EXTRA_CLASS' &&
                (isRTL
                  ? 'މާއްދާތަކަށް ބަހާލައިގެން ހިންގޭ ރިމީޑިއަލް އަދި އިމްތިޙާނު ތައްޔާރީ ކްލާސްތައް'
                  : 'Remedial clinics and exam preparation sessions by curriculum subject')}
              {reportMode === 'BOTH' &&
                (isRTL
                  ? 'ރަސްމީ ހެނދުނާއި މެންދުރުފަސް އަދި އިތުރު ކްލާސް ސެޝަންތަކުގެ ބައިވެރިވުން'
                  : 'Breakdown of official instructional hours vs remedial clinics and approved leaves')}
            </p>
          </div>

          {currentDistributionData.length === 0 ? (
            <div className="h-56 w-full my-2 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {reportMode === 'EXTRA_CLASS'
                  ? (isRTL ? 'އެއްވެސް އިތުރު ކްލާހެއް ތާވަލުކުރެވިފައެއް ނެތް' : 'No Extra Classes Scheduled')
                  : reportMode === 'OFFICIAL'
                  ? (isRTL ? 'ރެކޯޑް ކުރެވިފައިވާ ސަލާމެއް ނެތް' : 'No Leaves Recorded')
                  : (isRTL ? 'އެއްވެސް ސެޝަނެއް އަދި ރެކޯޑް ނުކުރޭ' : 'No Sessions Recorded Yet')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {reportMode === 'EXTRA_CLASS'
                  ? (isRTL ? 'އައު ކްލާހެއް ތާވަލުކުރުމުން މިތަނުގައި ތަފާސްހިސާބު ފެންނާނެއެވެ' : 'Schedule classes to see subject breakdown')
                  : reportMode === 'OFFICIAL'
                  ? (isRTL ? 'މި ތާރީޚަށް ދަރިވަރަކު ސަލާމް ބުނެފައި ނުވޭ' : 'No student leave recorded for this date')
                  : (isRTL ? 'ހާޒިރީ މެޓްރިކްސްއިން ހާޒިރީ ނެގުމުން ސެޝަންތަކުގެ ނިސްބަތް ފެންނާނެއެވެ' : 'Mark attendance to see live session composition')}
              </p>
            </div>
          ) : (
            <div className="h-56 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {currentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number | string | undefined, name: string | undefined) => [
                      reportMode === 'EXTRA_CLASS'
                        ? `${val ?? 0} Sessions`
                        : reportMode === 'BOTH'
                        ? `${val ?? 0} Student Sessions`
                        : `${val ?? 0} Students`,
                      name ?? '',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {currentDistributionData.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {currentDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 font-mono">
                    {item.value}
                    {reportMode === 'EXTRA_CLASS' ? ' clinics' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
