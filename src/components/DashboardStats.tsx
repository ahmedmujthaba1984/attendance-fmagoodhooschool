import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  PlaneTakeoff,
  AlertCircle,
  Coffee,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { AttendanceStatsSummary } from '../types';

interface DashboardStatsProps {
  stats: AttendanceStatsSummary;
  onSelectMetric?: (metric: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { t, isRTL } = useLanguage();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const totalCalendarDays = stats.totalCalendarDays ?? 200;
  const closedDaysDeducted = stats.closedDaysDeducted ?? 9;
  const totalDaysNeedToPresent = stats.totalDaysNeedToPresent ?? Math.max(0, totalCalendarDays - closedDaysDeducted);

  const totalExtraClasses = stats.totalExtraClasses ?? 0;
  const officialVal = stats.officialAttendanceRate ?? stats.overallAttendanceRate ?? null;
  const extraVal = totalExtraClasses > 0 ? (stats.extraClassAttendanceRate ?? null) : null;
  const combinedVal = totalExtraClasses > 0
    ? (stats.combinedAttendanceRate ?? (officialVal != null && extraVal != null ? Math.round((officialVal * 2 + extraVal) / 3) : officialVal))
    : officialVal;

  const cards = [
    {
      id: 'total-students',
      label: t.statTotalStudents,
      value: stats.totalStudents,
      subValue: isRTL ? '12 ގްރޭޑް (އެލްކޭޖީ - 10)' : '12 Grades (LKG to Gr 10)',
      icon: Users,
      color: 'sky',
      badge: isRTL ? '215 ދަރިވަރުން' : 'Full Enrollment',
    },
    {
      id: 'official-attendance-rate',
      label: stats.isSchoolClosed ? (isRTL ? 'ސްކޫލް ބަންދު' : 'School Closed') : (isRTL ? 'ރަސްމީ ހާޒިރީ (2 ދަންފަޅި)' : 'Official Attendance'),
      value: stats.isSchoolClosed ? (isRTL ? 'ބަންދު' : 'Excused') : (officialVal != null ? `${officialVal}%` : '-'),
      subValue: stats.isSchoolClosed
        ? (isRTL ? 'ހާޒިރުވާންޖެހޭ ދުވަސްތަކުން އުނިކުރެވިފައި' : 'Deducted from required days')
        : isRTL
        ? `ހެނދުނު: ${stats.morningAttendanceRate != null ? `${stats.morningAttendanceRate}%` : '-'} | ބްރޭކަށްފަހު: ${stats.postBreakAttendanceRate != null ? `${stats.postBreakAttendanceRate}%` : '-'}`
        : `Morning: ${stats.morningAttendanceRate != null ? `${stats.morningAttendanceRate}%` : '-'} | Post-Break: ${stats.postBreakAttendanceRate != null ? `${stats.postBreakAttendanceRate}%` : '-'}`,
      icon: Building,
      color: stats.isSchoolClosed ? 'rose' : 'sky',
      badge: isRTL ? 'ރަސްމީ' : 'Official',
    },
    {
      id: 'extra-class-rate',
      label: isRTL ? 'އިތުރު ކްލާސް ރޭޓް' : 'Extra Class Rate',
      value: stats.isSchoolClosed
        ? (isRTL ? 'ބަންދު' : 'Excused')
        : totalExtraClasses > 0 && extraVal != null
        ? `${extraVal}%`
        : (isRTL ? 'ނެތް' : 'None'),
      subValue: isRTL
        ? (totalExtraClasses > 0 ? `${totalExtraClasses} ކްލާސް ހިންގުނު` : 'ތާވަލުކުރެވިފައި ނެތް')
        : (totalExtraClasses > 0 ? `${totalExtraClasses} Clinics Held` : 'None Scheduled'),
      icon: BookOpen,
      color: 'purple',
      badge: isRTL ? 'އިތުރު ކްލާސް' : 'Remedial',
    },
    {
      id: 'combined-rate',
      label: isRTL ? 'ދެބައި އެކުގައި' : 'Combined (Unified)',
      value: stats.isSchoolClosed ? (isRTL ? 'ބަންދު' : 'Excused') : (combinedVal != null ? `${combinedVal}%` : '-'),
      subValue: isRTL
        ? (totalExtraClasses > 0 ? 'ރަސްމީ + އިތުރު ކްލާސް' : 'ރަސްމީ ދަންފަޅިތައް')
        : (totalExtraClasses > 0 ? 'Official + Extra Class' : 'Official Sessions'),
      icon: Sparkles,
      color: 'emerald',
      badge: combinedVal != null ? (combinedVal >= 90 ? 'MoE Compliant' : 'Review') : (isRTL ? 'ރިވިއު' : 'Pending'),
    },
    {
      id: 'post-break-recovery',
      label: t.statPostBreakRecovery,
      value: stats.isSchoolClosed
        ? (isRTL ? 'ބަންދު' : 'Excused')
        : stats.postBreakRecoveryRate != null
        ? `${stats.postBreakRecoveryRate}%`
        : '-',
      subValue: stats.isSchoolClosed
        ? (isRTL ? 'ސަރުކާރު ބަންދު / ކުއްލި ޙާލަތު' : 'Official Emergency Closure')
        : stats.postBreakRecoveryRate != null
        ? (isRTL ? 'ސައިގަޑިއަށްފަހު އެނބުރި އައި ނިސްބަތް' : 'Tea-time break retention')
        : (isRTL ? 'ދެވަނަ ދަންފަޅި ނުނަގާ' : 'Pending session 2'),
      icon: Coffee,
      color: 'teal',
      badge: stats.isSchoolClosed
        ? (isRTL ? 'ބަންދު' : 'Closed')
        : stats.postBreakRecoveryRate != null
        ? (isRTL ? 'ރަށުގެ ނިސްބަތް' : 'Island Metric')
        : (isRTL ? 'އިންތިޒާރުގައި' : 'Pending'),
    },
    {
      id: 'active-leaves',
      label: t.statActiveLeaves,
      value: stats.activeLeavesCount,
      subValue: isRTL
        ? `ބަލިވެ: ${stats.sickLeaveCount} | ރަށުގައި ނެތް: ${stats.notInIslandCount}`
        : `Sick: ${stats.sickLeaveCount} | Out of Island: ${stats.notInIslandCount}`,
      icon: AlertCircle,
      color: 'indigo',
      badge: isRTL ? 'ސަލާމުގައި' : 'Documented',
    },
  ];

  const colorStyles: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
    sky: {
      bg: 'bg-white',
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
      text: 'text-sky-700',
      border: 'border-slate-200 hover:border-sky-300',
    },
    purple: {
      bg: 'bg-white',
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'text-purple-700',
      border: 'border-slate-200 hover:border-purple-300',
    },
    emerald: {
      bg: 'bg-white',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-700',
      border: 'border-slate-200 hover:border-emerald-300',
    },
    rose: {
      bg: 'bg-white',
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      text: 'text-rose-700',
      border: 'border-slate-200 hover:border-rose-300',
    },
    teal: {
      bg: 'bg-white',
      iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
      text: 'text-teal-700',
      border: 'border-slate-200 hover:border-teal-300',
    },
    indigo: {
      bg: 'bg-white',
      iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      text: 'text-indigo-700',
      border: 'border-slate-200 hover:border-indigo-300',
    },
    amber: {
      bg: 'bg-white',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      text: 'text-amber-700',
      border: 'border-slate-200 hover:border-amber-300',
    },
    violet: {
      bg: 'bg-white',
      iconBg: 'bg-violet-50 text-violet-700 border-violet-200',
      text: 'text-violet-700',
      border: 'border-slate-200 hover:border-violet-300',
    },
  };

  return (
    <div className="space-y-3">
      {/* Mobile-Only Compact KPI Strip */}
      <div className="block md:hidden bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg border shrink-0 ${stats.isSchoolClosed ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {stats.isSchoolClosed ? <Building className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900">
                  {stats.isSchoolClosed ? (isRTL ? 'ސްކޫލް ބަންދު' : 'Closed') : (stats.overallAttendanceRate != null ? `${stats.overallAttendanceRate}%` : (officialVal != null ? `${officialVal}%` : '-'))}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {stats.isSchoolClosed
                    ? (isRTL ? 'އުނިކުރެވިފައި' : 'Excused')
                    : (isRTL ? `${stats.totalStudents} ދަރިވަރުން` : `${stats.totalStudents} Students`)}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                <span>{isRTL ? `ސަލާމް: ${stats.activeLeavesCount}` : `Leaves: ${stats.activeLeavesCount}`}</span>
                <span>•</span>
                <span>{isRTL ? `ލަސްވި: ${stats.lateEntriesCount}` : `Late: ${stats.lateEntriesCount}`}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold shrink-0 cursor-pointer"
          >
            <span>{isMobileExpanded ? (isRTL ? 'ކުޑަކުރޭ' : 'Hide') : (isRTL ? 'ތަފާސްހިސާބު' : 'Stats')}</span>
            {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Full Stats View (Always on desktop md+, toggleable on mobile) */}
      <div className={`${isMobileExpanded ? 'block' : 'hidden md:block'} space-y-3`}>
        {/* MoE Instructional Days / Academic Quota Meter */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-bold text-slate-800">
              {isRTL ? 'ހާޒިރުވާންޖެހޭ ރަސްމީ ކިޔަވައިދޭ ދުވަސްތައް:' : 'MoE Required Instructional Days:'}
            </span>
            <span className="font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[11px] sm:text-xs">
              {totalDaysNeedToPresent} {isRTL ? 'ދުވަސް ހާޒިރުވާންޖެހޭ' : 'Days Need to Present'}
            </span>
            <span className="text-slate-500 text-[11px] sm:text-xs">
              ({closedDaysDeducted} {isRTL ? 'ދުވަސް ބަންދުވުމުން އުނިކުރެވިފައި' : 'Closed Days Deducted'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] sm:text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {isRTL ? 'ބަންދު ދުވަސްތައް ޣައިރުޙާޟިރެއް ނޫން' : 'Closed Days Excluded from Absences'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const style = colorStyles[card.color];

            return (
              <div
                key={card.id}
                id={`stat-card-${card.id}`}
                className={`p-3 sm:p-4 rounded-xl ${style.bg} border ${style.border} shadow-xs transition-all hover:shadow-md flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <div className={`p-1.5 sm:p-2 rounded-lg border ${style.iconBg}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 truncate">
                    {card.badge}
                  </span>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5 truncate">{card.label}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1 truncate">{card.subValue}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
