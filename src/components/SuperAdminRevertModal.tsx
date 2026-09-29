import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  ShieldAlert,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
  Info,
  Calendar,
  Layers,
  Sparkles,
  LockOpen,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LeaveReason, SessionType, Student, User as UserType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export interface SuperAdminRevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'RECORD' | 'SESSION';
  student?: Student;
  currentRecord?: AttendanceRecord;
  date: string;
  session: SessionType;
  currentUser?: UserType | null;
  onConfirmRecordRevert?: (params: {
    newStatus: AttendanceStatus;
    leaveReason?: LeaveReason;
    arrivalTime?: string;
    reason: string;
  }) => Promise<void>;
  onConfirmSessionRevert?: (reason: string) => Promise<void>;
}

export const SuperAdminRevertModal: React.FC<SuperAdminRevertModalProps> = ({
  isOpen,
  onClose,
  mode,
  student,
  currentRecord,
  date,
  session,
  currentUser,
  onConfirmRecordRevert,
  onConfirmSessionRevert,
}) => {
  const { t, isRTL } = useLanguage();

  const currentStatus = currentRecord?.status || 'ABSENT';
  const defaultNewStatus: AttendanceStatus = currentStatus === 'ABSENT' ? 'PRESENT' : 'ABSENT';

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(defaultNewStatus);
  const [leaveReason, setLeaveReason] = useState<LeaveReason>(currentRecord?.leaveReason || 'SICK_LEAVE');
  const [arrivalTime, setArrivalTime] = useState<string>(
    currentRecord?.arrivalTime || (session === 'MORNING_BEFORE_BREAK' ? '08:15' : '11:00')
  );
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened or changed
  useEffect(() => {
    if (mode === 'RECORD') {
      const initialNext = currentStatus === 'ABSENT' ? 'PRESENT' : 'ABSENT';
      setSelectedStatus(initialNext);
      setLeaveReason(currentRecord?.leaveReason || 'SICK_LEAVE');
      setArrivalTime(currentRecord?.arrivalTime || (session === 'MORNING_BEFORE_BREAK' ? '08:15' : '11:00'));
      if (currentStatus === 'ABSENT') {
        setReason('Teacher marked present student as absent by mistake');
      } else {
        setReason('Teacher marked attendance incorrectly; corrected by Super Admin');
      }
    } else {
      setReason('Teacher reported incorrect attendance entry; session reopened for homeroom correction');
    }
    setError(null);
  }, [isOpen, mode, currentStatus, currentRecord, session]);

  if (!isOpen) return null;

  const quickReasonsRecord = [
    'Teacher marked present student as absent by mistake',
    'Teacher marked absent student as present by mistake',
    'Student arrived late; verified present in class',
    'Official medical certificate / Leave letter submitted',
    'Homeroom teacher miscount during morning roll call',
  ];

  const quickReasonsSession = [
    'Teacher reported incorrect attendance entry in homeroom',
    'General roll call revision required before MoE sync',
    'Class teacher delegation / substitution handover correction',
  ];

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(isRTL ? 'ސަބަބު ލިޔުއްވުން ލާޒިމެވެ' : 'Please provide an official reason for this reversal');
      return;
    }
    if (!onConfirmRecordRevert) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmRecordRevert({
        newStatus: selectedStatus,
        leaveReason: selectedStatus === 'LEAVE' ? leaveReason : 'NONE',
        arrivalTime: selectedStatus === 'LATE' ? arrivalTime : undefined,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to revert attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onConfirmSessionRevert) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmSessionRevert(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to revert session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="super-admin-revert-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4 sm:p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-black bg-amber-900/50 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  {isRTL ? 'ސުޕަރ އެޑްމިން އިޚްތިޔާރު' : 'Super Admin Authority'}
                </span>
                <span className="text-[10px] text-amber-100 font-medium">
                  {currentUser?.fullName || 'Ahmed Mujthaba'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold mt-1">
                {mode === 'RECORD'
                  ? isRTL
                    ? 'ކުށަކުން ޖެހުނު ހާޒިރީ އިޞްލާޙުކޮށް ރުޖޫޢަކުރުން'
                    : 'Revert & Correct Marked Attendance'
                  : isRTL
                  ? 'ފައިނަލްކުރެވިފައިވާ ސެޝަން އަލުން ހުޅުވުން'
                  : 'Revert / Reopen Finalized Session'}
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                {mode === 'RECORD'
                  ? isRTL
                    ? 'ޓީޗަރު އޮޅިގެން ޖެހި ހާޒިރީ ސުޕަރ އެޑްމިންގެ ހުއްދައާއެކު ރަސްމީކޮށް ބަދަލުކުރުން'
                    : 'Officially reverse incorrectly marked attendance (e.g. Present student marked as Absent)'
                  : isRTL
                  ? 'މުދައްރިސުންނަށް އިޞްލާޙުކުރުމުގެ ފުރުޞަތު ދިނުމަށް ސެޝަން ހުޅުވާލުން'
                  : 'Unlock this session so class teachers can correct roll-call records'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'RECORD' && student && (
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              {/* Student Context Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center shrink-0 border border-teal-200">
                    {student.admissionNumber.slice(-3)}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 leading-tight">
                      {student.fullName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-teal-700">{student.gradeLevel}</span>
                      <span>•</span>
                      <span>Index: {student.admissionNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Current Status Pill */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {isRTL ? 'މިހާރު އޮތް ހާލަތު:' : 'Currently Recorded:'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                      currentStatus === 'PRESENT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : currentStatus === 'ABSENT'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : currentStatus === 'LATE'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    }`}
                  >
                    {currentStatus === 'PRESENT' && <CheckCircle className="w-3.5 h-3.5" />}
                    {currentStatus === 'ABSENT' && <XCircle className="w-3.5 h-3.5" />}
                    {currentStatus === 'LATE' && <Clock className="w-3.5 h-3.5" />}
                    {currentStatus === 'LEAVE' && <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{currentStatus}</span>
                  </span>
                  {currentRecord?.markedByUserName && (
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      By: {currentRecord.markedByUserName}
                    </span>
                  )}
                </div>
              </div>

              {/* Target / Reverted Status Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {isRTL ? 'ބަދަލުކުރަންވީ ޞައްޙަ ޙާލަތު:' : 'Select Correct / Reverted Attendance Status:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Present */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('PRESENT')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                      selectedStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.present}</span>
                  </button>

                  {/* Late */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('LATE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                      selectedStatus === 'LATE'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{t.late}</span>
                  </button>

                  {/* Leave */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('LEAVE')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                      selectedStatus === 'LEAVE'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{t.leave}</span>
                  </button>

                  {/* Absent */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('ABSENT')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                      selectedStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t.absent}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Context for Late / Leave */}
              {selectedStatus === 'LATE' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">
                      {isRTL ? 'އައި ގަޑި:' : 'Actual Arrival Time:'}
                    </span>
                  </div>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-900 focus:outline-none"
                  />
                </div>
              )}

              {selectedStatus === 'LEAVE' && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">
                      {isRTL ? 'ޗުއްޓީގެ ބާވަތް:' : 'Leave Category:'}
                    </span>
                  </div>
                  <select
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value as LeaveReason)}
                    className="bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none"
                  >
                    <option value="SICK_LEAVE">{t.reasonSick}</option>
                    <option value="SICK_LEAVE_MC">{t.reasonSickMC}</option>
                    <option value="NOT_IN_ISLAND">{t.reasonNotInIsland}</option>
                    <option value="OFFICIAL_DUTY">{t.reasonOfficialDuty}</option>
                    <option value="OTHER">{t.reasonOther}</option>
                  </select>
                </div>
              )}

              {/* Quick Select Common Reasons */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isRTL ? 'އާންމު ސަބަބުތައް (1-ކްލިކް):' : 'Quick Fill Reason:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickReasonsRecord.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setReason(qr)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                        reason === qr
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-medium'
                      }`}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Reason Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  {isRTL ? 'އޮޑިޓް ލޮގަށް ސަބަބު (ލާޒިމު):' : 'Official Reversal Reason (Audit Log):'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder={
                    isRTL
                      ? 'މިސާލު: ޓީޗަރު އޮޅިގެން ކުއްޖާ ޣައިރުޙާޟިރުކޮށްފައި ވަނިކޮށް، ކުއްޖާ ކްލާހުގައި އިންކަން ސާބިތުވުމުން ރުޖޫޢަކުރީ'
                      : 'e.g. Teacher marked present student as absent by mistake; verified present by homeroom'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none font-medium text-slate-800"
                  required
                />
              </div>

              {/* Audit Warning Note */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  {isRTL
                    ? 'މި އިޞްލާޙަކީ ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) ގެ ނަމުގައި ރަސްމީ އޮޑިޓް ލޮގްގައި ރައްކާކުރެވޭނެ ކަމެކެވެ. އަދި މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަންގެ ރިޕޯޓްތަކަށް ވަގުތުން ބަދަލު އަންނާނެއެވެ.'
                    : 'This reversal will be permanently attributed to Super Admin (Ahmed Mujthaba) in the official MoE audit logs, and statistics will be updated immediately.'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {isSubmitting
                      ? isRTL
                        ? 'ބަދަލުކުރެވެނީ...'
                        : 'Reverting...'
                      : isRTL
                      ? 'ޙާޟިރީ ރުޖޫޢަކުރުން ކަށަވަރުކުރޭ'
                      : 'Confirm Reversal & Update'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {mode === 'SESSION' && (
            <form onSubmit={handleSessionSubmit} className="space-y-4">
              {/* Session Overview Card */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                  <LockOpen className="w-4 h-4 text-amber-700" />
                  <span>{isRTL ? 'ސެޝަންގެ މަޢުލޫމާތު' : 'Session To Unlock'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{isRTL ? 'ތާރީޚް:' : 'Date:'} </span>
                    <span className="font-extrabold text-slate-800">{date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{isRTL ? 'ސެޝަން:' : 'Session:'} </span>
                    <span className="font-extrabold text-slate-800">
                      {session === 'MORNING_BEFORE_BREAK' ? t.morningSessionShort : t.postBreakSessionShort}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-amber-900/90 pt-1 border-t border-amber-200">
                  {isRTL
                    ? 'މި ސެޝަން އަލުން ހުޅުވާލުމުން، ހުރިހާ މުދައްރިސުންނަށްވެސް އެމީހުންގެ ކްލާސްތަކުގެ ހާޒިރީ އިޞްލާޙުކޮށް އަލުން ފައިނަލްކުރުމުގެ ހުއްދަ ލިބޭނެއެވެ.'
                    : 'Reopening this session will unlock attendance marking for all homeroom teachers, allowing them to correct marking mistakes and re-submit.'}
                </p>
              </div>

              {/* Quick Select Reasons */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isRTL ? 'އާންމު ސަބަބުތައް (1-ކްލިކް):' : 'Quick Fill Reason:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickReasonsSession.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setReason(qr)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                        reason === qr
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-medium'
                      }`}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  {isRTL ? 'ސެޝަން އަލުން ހުޅުވާ ސަބަބު (އޮޑިޓް ލޮގް):' : 'Reason for Unlocking Session (Audit Log):'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Homeroom teachers noticed marking errors; session reopened for correction"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none font-medium text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LockOpen className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {isSubmitting
                      ? isRTL
                        ? 'ހުޅުވެނީ...'
                        : 'Unlocking...'
                      : isRTL
                      ? 'ސެޝަން ހުޅުވުން ކަށަވަރުކުރޭ'
                      : 'Confirm Reopen Session'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
