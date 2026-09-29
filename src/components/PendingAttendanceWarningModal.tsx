import React from 'react';
import { AlertTriangle, ArrowRight, Calendar, Clock, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { PendingAttendanceSession, SessionType, GradeLevel } from '../types';

interface PendingAttendanceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSession: PendingAttendanceSession | null;
  currentDate: string;
  currentSession: SessionType;
  currentGrade: GradeLevel | 'ALL';
  onGoToPendingSession: (date: string, session: SessionType, grade: GradeLevel | 'ALL') => void;
}

export const PendingAttendanceWarningModal: React.FC<PendingAttendanceWarningModalProps> = ({
  isOpen,
  onClose,
  pendingSession,
  currentDate,
  currentSession,
  currentGrade,
  onGoToPendingSession,
}) => {
  const { t, isRTL } = useLanguage();

  if (!isOpen || !pendingSession) return null;

  const formatSessionLabel = (sessionType: SessionType) => {
    return sessionType === 'MORNING_BEFORE_BREAK'
      ? `${t.morningSessionShort} (07:45 – 10:15)`
      : `${t.postBreakSessionShort} (10:45 – 13:15)`;
  };

  const handleGoToPending = () => {
    onGoToPendingSession(
      pendingSession.date,
      pendingSession.sessionType,
      pendingSession.gradeLevel || currentGrade
    );
    onClose();
  };

  return (
    <div
      id="pending-attendance-warning-modal"
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-200 shadow-2xl overflow-hidden">
        {/* Modal Top Header with Amber Warning Strip */}
        <div className="bg-linear-to-r from-amber-500 via-amber-600 to-orange-600 px-6 py-5 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-amber-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase bg-amber-900/30 px-2 py-0.5 rounded text-amber-100">
                  {t.pendingAttendanceAlert}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold mt-0.5 leading-tight">
                {isRTL ? 'ކުރީގެ ހާޒިރީ ފުރަތަމަ ފުރަންޖެހޭނެ!' : 'Previous Attendance Must Be Marked First!'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Regulatory explanation notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">
                {isRTL
                  ? 'މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަންގެ ހާޒިރީ ޤަވާޢިދު'
                  : 'Ministry of Education Attendance Compliance Notice'}
              </p>
              <p className="text-amber-800/90 mt-1">
                {isRTL
                  ? 'ހާޒިރީގެ ސައްޙަކަން ހިފެހެއްޓުމަށްޓަކައި، ހާޒިރީ ފުރަންވާނީ ދުވަސްތަކާއި ސެޝަންތަކުގެ ތަރުތީބުންނެވެ. ފުރިހަމަނުވެ އޮތް ކުރީގެ ސެޝަންގެ ހާޒިރީ ފުރަތަމަ ފުރަންޖެހޭނެއެވެ.'
                  : 'To maintain attendance audit integrity, school attendance must be logged chronologically. You cannot jump ahead or mark this session until the earlier pending attendance session is completed.'}
              </p>
            </div>
          </div>

          {/* Pending Session vs Attempted Session Cards */}
          <div className="space-y-3">
            {/* The Pending Session Card (Highlighted in Amber/Orange) */}
            <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  {isRTL ? 'ފުރަތަމަ ފުރަންޖެހޭ ސެޝަން (ޕެންޑިންގް):' : 'Session Required First (Pending):'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                  {t.sessionPending}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-semibold bg-white p-2 rounded-lg border border-amber-200">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{isRTL ? 'ތާރީޚް:' : 'Date:'}</span>
                  <span className="font-mono font-bold text-slate-900">{pendingSession.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold bg-white p-2 rounded-lg border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{isRTL ? 'ސެޝަން:' : 'Session:'}</span>
                  <span className="font-bold text-amber-900">
                    {formatSessionLabel(pendingSession.sessionType)}
                  </span>
                </div>
              </div>

              {pendingSession.reason && (
                <p className="text-[11px] text-amber-900/90 font-medium italic pt-1">
                  {isRTL ? pendingSession.reasonDhivehi : pendingSession.reason}
                </p>
              )}
            </div>

            {/* Current Target Session Card (Locked) */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {isRTL ? 'އެދިލެއްވި ސެޝަން (މިވަގުތު ތަޅުލެވިފައި):' : 'Current Session (Temporarily Locked):'}
              </span>
              <div className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                <span className="font-mono font-semibold">{currentDate}</span>
                <span>•</span>
                <span>{formatSessionLabel(currentSession)}</span>
                <span>•</span>
                <span className="text-teal-800 font-bold">{currentGrade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer text-center"
          >
            {isRTL ? 'ފަސްކޮށްލާ (ބަލައިލުން)' : 'Review Only / Cancel'}
          </button>

          <button
            type="button"
            onClick={handleGoToPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-extrabold transition shadow-md hover:shadow-lg cursor-pointer text-center"
          >
            <span>{t.goToPendingAttendance}</span>
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
