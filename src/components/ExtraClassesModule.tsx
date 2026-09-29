import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Users,
  MapPin,
  BookOpen,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Trash2,
  RefreshCw,
  Award,
  AlertTriangle,
  UserCheck,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ExtraClass,
  ExtraClassStatus,
  ExtraClassAttendanceRecord,
  GradeLevel,
  Student,
  User,
  AttendanceStatus,
} from '../types';
import {
  downloadExtraClassTemplate,
  parseExtraClassExcel,
  downloadExtraClassAttendanceSheet,
  parseExtraClassAttendanceExcel,
  VALID_GRADES,
  ParsedExtraClassRow,
} from '../utils/extraClassExcel';

interface ExtraClassesModuleProps {
  currentUser: User | null;
  staffList: User[];
  students: Student[];
  onOpenSyncModal?: () => void;
}

// Check if user is a Leading Teacher, Principal, or Admin (Ahmed Mujthaba)
export function isLeadingTeacherOrAdmin(user?: User | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.role === 'ADMIN') return true;
  const email = (user.email || '').toLowerCase();
  if (
    email.includes('ahmed.mujthaba') ||
    email.includes('ahmedmujthaba') ||
    email === 'ahmed.mujthaba@fmagoodhooschool.edu.mv' ||
    email === 'ahmedmujthaba@gmail.com'
  ) {
    return true;
  }
  const name = (user.fullName || '').toLowerCase();
  if (name.includes('ahmed mujthaba') || name.includes('އަޙްމަދު މުޖުތަބާ')) {
    return true;
  }
  const desig = (user.designation || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  if (
    desig.includes('leading teacher') ||
    desig.includes('leading') ||
    desig.includes('principal') ||
    dept.includes('leading') ||
    dept.includes('admin')
  ) {
    return true;
  }
  return false;
}

/**
 * Ensures venue display does not show Grade 11/12 since F. Magoodhoo School only offers LKG to Grade 10
 */
export function cleanDisplayVenue(venue?: string): string {
  if (!venue) return 'Classroom';
  if (venue.includes('Grade 11') || venue.includes('Grade 12')) {
    return venue.replace(/Grade\s*1[12]/gi, 'Classroom 10');
  }
  return venue;
}

/**
 * Sanitizes and formats date string to prevent invalid calendar dates (e.g. 2026-09-32)
 */
export function cleanDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const realY = dt.getFullYear();
    const realM = String(dt.getMonth() + 1).padStart(2, '0');
    const realD = String(dt.getDate()).padStart(2, '0');
    return `${realY}-${realM}-${realD}`;
  }
  return dateStr;
}

const POPULAR_SUBJECTS: Array<{ en: string; dv: string }> = [
  { en: 'Mathematics', dv: 'ހިސާބު' },
  { en: 'Dhivehi', dv: 'ދިވެހި' },
  { en: 'Islam', dv: 'އިސްލާމް' },
  { en: 'English', dv: 'އިނގިރޭސި' },
  { en: 'General Science', dv: 'ސައިންސް' },
  { en: 'Physics', dv: 'ފިޒިކްސް' },
  { en: 'Chemistry', dv: 'ކެމިސްޓްރީ' },
  { en: 'Biology', dv: 'ބަޔޮލޮޖީ' },
  { en: 'Accounting', dv: 'އެކައުންޓިންގ' },
  { en: 'Economics', dv: 'އިކޮނޮމިކްސް' },
  { en: 'Business Studies', dv: 'ބިޒްނަސް ސްޓަޑީޒް' },
  { en: 'Quran & Thajweed', dv: 'ޤުރުއާން' },
];

export const ExtraClassesModule: React.FC<ExtraClassesModuleProps> = ({
  currentUser,
  staffList,
  students,
}) => {
  const { t, isRTL } = useLanguage();

  const isApprover = useMemo(() => isLeadingTeacherOrAdmin(currentUser), [currentUser]);

  // Data states
  const [extraClasses, setExtraClasses] = useState<ExtraClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ExtraClassStatus | 'ALL'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState<boolean>(false);
  const [activeAttendanceClass, setActiveAttendanceClass] = useState<ExtraClass | null>(null);
  const [rejectionTargetClass, setRejectionTargetClass] = useState<ExtraClass | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [deleteTargetClass, setDeleteTargetClass] = useState<ExtraClass | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState<boolean>(false);
  const [isBulkApproving, setIsBulkApproving] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  // Load Extra Classes from server
  const fetchExtraClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/extra-classes');
      if (res.ok) {
        const data = await res.json();
        setExtraClasses(data.extraClasses || []);
      }
    } catch (err) {
      console.error('Failed to load extra classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraClasses();
  }, [refreshKey]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return extraClasses.filter((c) => {
      if (selectedGrade !== 'ALL' && c.gradeLevel !== selectedGrade && c.gradeLevel !== 'ALL') {
        return false;
      }
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
        return false;
      }
      if (selectedDate && c.date !== selectedDate) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q) || (c.titleDhivehi || '').includes(q);
        const matchSubject = c.subject.toLowerCase().includes(q) || (c.subjectDhivehi || '').includes(q);
        const matchTeacher = c.teacherName.toLowerCase().includes(q);
        const matchVenue = (c.venue || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchTeacher && !matchVenue) {
          return false;
        }
      }
      return true;
    });
  }, [extraClasses, selectedGrade, selectedStatus, selectedDate, searchQuery]);

  // Pending approval list
  const pendingApprovals = useMemo(() => {
    return extraClasses.filter((c) => c.status === 'PENDING_APPROVAL');
  }, [extraClasses]);

  // Handle single approval/rejection
  const handleApprovalAction = async (
    id: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    if (!isApprover) {
      console.warn('Approval rejected: not authorized');
      return;
    }

    try {
      const res = await fetch(`/api/extra-classes/${id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: reason,
          userId: currentUser?.id || 'admin',
          userName: currentUser?.fullName || 'Leading Teacher / Ahmed Mujthaba',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExtraClasses((prev) =>
          prev.map((c) => (c.id === id ? data.extraClass : c))
        );
        if (rejectionTargetClass?.id === id) {
          setRejectionTargetClass(null);
          setRejectionReason('');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to update approval:', errData);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // Bulk approve all pending classes
  const handleBulkApproveAll = () => {
    if (!isApprover || pendingApprovals.length === 0) return;
    setBulkApproveModalOpen(true);
  };

  const confirmBulkApprove = async () => {
    if (!isApprover || pendingApprovals.length === 0) return;
    setIsBulkApproving(true);
    try {
      for (const cls of pendingApprovals) {
        await handleApprovalAction(cls.id, 'APPROVE');
      }
      setBulkApproveModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Bulk approve failed:', err);
    } finally {
      setIsBulkApproving(false);
    }
  };

  // Delete extra class
  const handleDeleteClick = (cls: ExtraClass) => {
    setDeleteTargetClass(cls);
  };

  const confirmDeleteClass = async () => {
    if (!deleteTargetClass) return;
    setIsDeleting(true);
    try {
      const params = new URLSearchParams({
        userId: currentUser?.id || 'admin',
        userEmail: currentUser?.email || 'ahmedmujthaba@gmail.com',
        userName: currentUser?.fullName || 'Ahmed Mujthaba',
      });
      const res = await fetch(`/api/extra-classes/${deleteTargetClass.id}?${params.toString()}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExtraClasses((prev) => prev.filter((c) => c.id !== deleteTargetClass.id));
        setDeleteTargetClass(null);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to delete extra class:', err);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAll = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/extra-classes/clear-all', { method: 'POST' });
      if (res.ok) {
        setExtraClasses([]);
        setIsClearAllModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to clear extra classes:', err);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>{isRTL ? 'އިތުރު ކްލާސްތަކާއި ހާޒިރީ' : 'Extra Classes & Attendance'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                    {extraClasses.length} {isRTL ? 'ކްލާސް' : 'Classes'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isRTL
                    ? 'ކޮންމެ މުވައްޒަފަކަށްވެސް އިތުރު ކްލާސް ޝެޑިއުލް ކުރެވޭނެއެވެ. ލީޑިންގ ޓީޗަރުން ނުވަތަ އަޙްމަދު މުޖުތަބާގެ އެޕްރޫވަލްއަށްފަހު ހާޒިރީ ނެގޭނެއެވެ.'
                    : 'Any staff member can schedule or upload bulk extra classes. Leading Teachers or Admin (Ahmed Mujthaba) approve sessions for attendance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Download Template */}
            <button
              type="button"
              onClick={() => downloadExtraClassTemplate(staffList)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition flex items-center gap-2 shadow-2xs cursor-pointer min-h-[40px]"
              title={isRTL ? 'އެކްސެލް ޓެމްޕްލޭޓް ޑައުންލޯޑް ކުރައްވާ' : 'Download Excel Bulk Upload Template'}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{isRTL ? 'އެކްސެލް ޓެމްޕްލޭޓް' : 'Excel Template'}</span>
            </button>

            {/* Bulk Upload Excel */}
            <button
              type="button"
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 transition flex items-center gap-2 shadow-2xs cursor-pointer min-h-[40px]"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{isRTL ? 'އެކްސެލް އިން އަޕްލޯޑް' : 'Bulk Upload Excel'}</span>
            </button>

            {/* Schedule New Extra Class (Single) */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-2 shadow-xs cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>{isRTL ? 'އިތުރު ކްލާހެއް ތާވަލުކުރޭ' : 'Schedule Extra Class'}</span>
            </button>

            {/* Clear All Extra Classes (Admin / Approver) */}
            {isApprover && extraClasses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[40px]"
                title={isRTL ? 'ހުރިހާ އިތުރު ކްލާހެއް ފުހެލާ' : 'Clear All Extra Classes'}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{isRTL ? 'ހުރިހާ ކްލާސް ފުހެލާ' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {isRTL ? 'ޖުމްލަ އިތުރު ކްލާސް' : 'Total Extra Classes'}
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{extraClasses.length}</div>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              {isRTL ? 'ހުއްދަދެވިފައި (އެޕްރޫވްޑް)' : 'Approved & Active'}
            </span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">
              {extraClasses.filter((c) => c.status === 'APPROVED').length}
            </div>
          </div>

          <div
            className={`rounded-xl p-3 border transition ${
              pendingApprovals.length > 0
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              {isRTL ? 'އެޕްރޫވަލް އިންތިޒާރުގައި' : 'Pending Approvals'}
            </span>
            <div className="text-xl font-black text-amber-900 mt-0.5 flex items-center gap-2">
              <span>{pendingApprovals.length}</span>
              {pendingApprovals.length > 0 && isApprover && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold animate-pulse">
                  {isRTL ? 'ރިވިއުކުރައްވާ' : 'Needs Review'}
                </span>
              )}
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-200/80">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-600" />
              {isRTL ? 'ހާޒިރީ ނެގިފައި' : 'Attendance Taken'}
            </span>
            <div className="text-xl font-black text-indigo-900 mt-0.5">
              {extraClasses.filter((c) => c.attendanceSubmitted).length}
            </div>
          </div>
        </div>
      </div>

      {/* Leading Teacher & Ahmed Mujthaba Pending Approvals Action Deck */}
      {isApprover && pendingApprovals.length > 0 && (
        <div className="bg-linear-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300/80 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-amber-950">
                  {isRTL
                    ? `ލީޑިންގ ޓީޗަރުން އަދި އެޑްމިން އެޕްރޫވަލް (${pendingApprovals.length} ކްލާސް އިންތިޒާރުގައި)`
                    : `Leading Teacher & Admin Approvals (${pendingApprovals.length} Awaiting)`}
                </h2>
                <p className="text-xs text-amber-800">
                  {isRTL
                    ? 'މުވައްޒަފުން ތާވަލުކޮށްފައިވާ އިތުރު ކްލާސްތައް ފާސްކޮށްދެއްވާ. ފާސްކުރުމުން ހާޒިރީ މާކުކުރުމުގެ ފުރުސަތު ހުޅުވޭނެއެވެ.'
                    : 'Review extra classes scheduled by staff. Approving grants permission to take attendance.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBulkApproveAll}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[38px] self-start sm:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>{isRTL ? 'ހުރިހާ ކްލާހެއް އެއްފަހަރާ އެޕްރޫވް ކުރޭ' : 'Approve All Pending'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-900 text-white">
                        {cls.gradeLevel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {cls.subject}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      {cleanDisplayDate(cls.date)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                    {isRTL && cls.titleDhivehi ? cls.titleDhivehi : cls.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.startTime} – {cls.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cleanDisplayVenue(cls.venue)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>
                      {isRTL ? 'ކިޔަވައިދޭ ޓީޗަރު:' : 'Teacher:'}{' '}
                      <strong className="text-slate-700">{cls.teacherName}</strong>
                    </span>
                    <span>
                      {isRTL ? 'އެދިފައިވަނީ:' : 'Requested by:'}{' '}
                      <strong>{cls.createdByUserName}</strong>
                    </span>
                  </div>

                  {cls.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg mt-2 border border-slate-100 italic">
                      "{cls.notes}"
                    </p>
                  )}
                </div>

                {/* Approve / Reject / Delete Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(cls)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title={isRTL ? 'ކެންސަލް / ޑިލީޓް' : 'Delete / Cancel Class'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionTargetClass(cls);
                        setRejectionReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'ރިޖެކްޓް' : 'Reject'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprovalAction(cls.id, 'APPROVE')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'އެޕްރޫވް' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'ކްލާސް، މާއްދާ، ޓީޗަރުގެ ނަން ހޯއްދަވާ...' : 'Search extra class, subject, teacher, venue...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-teal-500 focus:outline-none transition min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Picker & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-transparent border-none text-slate-700 focus:outline-none"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
                  title="Clear date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-semibold focus:bg-white focus:outline-none min-h-[40px]"
            >
              <option value="ALL">{isRTL ? 'ހުރިހާ ސްޓޭޓަސްއެއް' : 'All Statuses'}</option>
              <option value="APPROVED">{isRTL ? 'ހުއްދަދެވިފައި (Approved)' : 'Approved'}</option>
              <option value="PENDING_APPROVAL">{isRTL ? 'އިންތިޒާރުގައި (Pending)' : 'Pending Approval'}</option>
              <option value="REJECTED">{isRTL ? 'ރިޖެކްޓް ކުރެވިފައި' : 'Rejected'}</option>
            </select>
          </div>
        </div>

        {/* Grade Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedGrade('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedGrade === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{isRTL ? 'ހުރިހާ ގްރޭޑެއް' : 'All Grades'}</span>
          </button>

          {VALID_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedGrade === g
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{g}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Extra Classes List / Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            {isRTL ? 'އިތުރު ކްލާސްތައް ލޯޑުވަނީ...' : 'Loading extra classes schedule...'}
          </p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {isRTL ? 'އެއްވެސް އިތުރު ކްލާހެއް ނުފެނުނު' : 'No Extra Classes Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {isRTL
              ? 'މި ފިލްޓަރަށް ފެތޭ އިތުރު ކްލާހެއް ނެތް. އައު ކްލާހެއް ތާވަލުކުރައްވާ ނުވަތަ އެކްސެލް މެދުވެރިކޮށް އަޕްލޯޑް ކުރައްވާ.'
              : 'There are no extra classes matching your filters. You can schedule a new class or upload an Excel file.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>{isRTL ? 'ކްލާހެއް ތާވަލުކުރޭ' : 'Schedule Extra Class'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isRTL ? 'އެކްސެލް އަޕްލޯޑް' : 'Upload Excel'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const isApproved = cls.status === 'APPROVED';
            const isPending = cls.status === 'PENDING_APPROVAL';
            const isRejected = cls.status === 'REJECTED';
            const hasAttendance = cls.attendanceSubmitted;
            const targetCount =
              cls.gradeLevel === 'ALL'
                ? students.length
                : students.filter((s) => s.gradeLevel === cls.gradeLevel).length;

            const presentCount = cls.attendanceRecords
              ? cls.attendanceRecords.filter((r) => r.status === 'PRESENT').length
              : 0;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/20'
                    : hasAttendance
                    ? 'border-teal-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white">
                        {cls.gradeLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {cls.subject}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isApproved && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>{isRTL ? 'ހުއްދަދެވިފައި' : 'Approved'}</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>{isRTL ? 'އެޕްރޫވަލް އިންތިޒާރުގައި' : 'Pending Approval'}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>{isRTL ? 'ރިޖެކްޓް' : 'Rejected'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-base font-black text-slate-900 mt-3 leading-snug">
                    {isRTL && cls.titleDhivehi ? cls.titleDhivehi : cls.title}
                  </h3>

                  {/* Date, Time & Venue */}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{cleanDisplayDate(cls.date)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.startTime} – {cls.endTime}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[150px]">{cleanDisplayVenue(cls.venue)}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{targetCount} {isRTL ? 'ދަރިވަރުން' : 'Students'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Teacher & Creator Info */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span>{isRTL ? 'ކިޔަވައިދޭ ޓީޗަރު:' : 'Teacher:'}</span>
                      <strong className="text-slate-800">{cls.teacherName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{isRTL ? 'ތާވަލުކުރީ:' : 'Created by:'}</span>
                      <span>{cls.createdByUserName}</span>
                    </div>
                    {cls.approvedByUserName && (
                      <div className="flex items-center justify-between text-emerald-700 font-medium">
                        <span>{isRTL ? 'އެޕްރޫވްކުރީ:' : 'Approved by:'}</span>
                        <span>{cls.approvedByUserName}</span>
                      </div>
                    )}
                    {cls.rejectionReason && (
                      <div className="text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 border border-rose-200">
                        <strong>{isRTL ? 'ރިޖެކްޓް ސަބަބު:' : 'Rejection Reason:'}</strong> {cls.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Attendance Summary Chip */}
                  {hasAttendance && (
                    <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                        <div>
                          <span className="text-xs font-bold text-teal-900 block leading-tight">
                            {isRTL ? 'ހާޒިރީ މާކުކުރެވިފައި' : 'Attendance Recorded'}
                          </span>
                          <span className="text-[10px] text-teal-700">
                            {cls.attendanceSubmittedBy}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-teal-950 px-2 py-0.5 rounded-lg bg-teal-100">
                        {presentCount}/{targetCount} {isRTL ? 'ޙާޟިރު' : 'Present'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Delete button (creator, approver, or admin) */}
                    {(isApprover || cls.createdByUserId === currentUser?.id || currentUser?.role === 'ADMIN' || cls.status === 'REJECTED') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={isRTL ? 'ކެންސަލް / ޑިލީޓް' : 'Delete / Cancel Class'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Download Attendance Sheet for this class */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => downloadExtraClassAttendanceSheet(cls, students)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title={isRTL ? 'ހާޒިރީ އެކްސެލް ޝީޓް ޑައުންލޯޑް' : 'Download Attendance Excel'}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  {isApproved ? (
                    <button
                      type="button"
                      onClick={() => setActiveAttendanceClass(cls)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[36px] ${
                        hasAttendance
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        {hasAttendance
                          ? (isRTL ? 'ހާޒިރީ ބަލާ / ބަދަލުކުރޭ' : 'Review / Edit Attendance')
                          : (isRTL ? 'ހާޒިރީ މާކުކުރޭ' : 'Mark Attendance')}
                      </span>
                    </button>
                  ) : isPending && isApprover ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectionTargetClass(cls);
                          setRejectionReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                      >
                        {isRTL ? 'ރިޖެކްޓް' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprovalAction(cls.id, 'APPROVE')}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'އެޕްރޫވް' : 'Approve'}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 italic">
                      {isPending
                        ? (isRTL ? 'އެޕްރޫވަލް އިންތިޒާރުގައި' : 'Waiting approval')
                        : (isRTL ? 'ކްލާސް ބާތިލް' : 'Cancelled')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: SCHEDULE EXTRA CLASS (Available to ANY staff member) */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <CreateExtraClassModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          currentUser={currentUser}
          staffList={staffList}
          isApprover={isApprover}
          onSuccess={(newClass) => {
            setExtraClasses((prev) => [newClass, ...prev]);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: BULK EXCEL UPLOAD */}
      {/* ==================================================================== */}
      {isBulkUploadModalOpen && (
        <BulkUploadExtraClassesModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          currentUser={currentUser}
          staffList={staffList}
          isApprover={isApprover}
          onSuccess={() => {
            setIsBulkUploadModalOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: MARK ATTENDANCE MODAL */}
      {/* ==================================================================== */}
      {activeAttendanceClass && (
        <ExtraClassAttendanceModal
          extraClass={activeAttendanceClass}
          students={students}
          currentUser={currentUser}
          onClose={() => setActiveAttendanceClass(null)}
          onSuccess={(updatedClass) => {
            setExtraClasses((prev) =>
              prev.map((c) => (c.id === updatedClass.id ? updatedClass : c))
            );
            setActiveAttendanceClass(null);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: REJECTION REASON MODAL (Leading Teacher / Ahmed Mujthaba) */}
      {/* ==================================================================== */}
      {rejectionTargetClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900">
                {isRTL ? 'އިތުރު ކްލާސް ރިޖެކްޓް ކުރެއްވުން' : 'Reject Extra Class'}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              {isRTL
                ? `"${rejectionTargetClass.title}" ރިޖެކްޓް ކުރައްވަން ބޭނުންފުޅުވާ ސަބަބު ބަޔާންކުރައްވާ:`
                : `Please provide a reason for rejecting "${rejectionTargetClass.title}":`}
            </p>

            <textarea
              rows={3}
              placeholder={isRTL ? 'ސަބަބު ލިޔުއްވާ (މިސާލު: ހޯލް އެހެން ހަރަކާތަކަށް ބޭނުންކުރާތީ)...' : 'Reason (e.g. Hall occupied by another school event)...'}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionTargetClass(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isRTL ? 'ކެންސަލް' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApprovalAction(rejectionTargetClass.id, 'REJECT', rejectionReason)
                }
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{isRTL ? 'ރިޖެކްޓް ކަށަވަރުކުރޭ' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: DELETE EXTRA CLASS CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {deleteTargetClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isRTL ? 'އިތުރު ކްލާސް ޑިލީޓް ކުރެއްވުން' : 'Delete Extra Class'}
                </h3>
                <span className="text-xs text-slate-500 block">
                  {isRTL ? 'މި އަމަލު އަނބުރާ ނުގެނެވޭނެއެވެ' : 'This action cannot be undone'}
                </span>
              </div>
            </div>

            {/* Target Class Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 line-clamp-1">
                  {isRTL && deleteTargetClass.titleDhivehi ? deleteTargetClass.titleDhivehi : deleteTargetClass.title}
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-800 text-white shrink-0">
                  {deleteTargetClass.gradeLevel}
                </span>
              </div>
              <div className="text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                <span>📅 {cleanDisplayDate(deleteTargetClass.date)}</span>
                <span>⏰ {deleteTargetClass.startTime} - {deleteTargetClass.endTime}</span>
                <span>📍 {cleanDisplayVenue(deleteTargetClass.venue)}</span>
              </div>
              <div className="text-slate-500 text-[11px] pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span>{isRTL ? 'ކިޔަވައިދޭ ޓީޗަރު:' : 'Teacher:'} <strong className="text-slate-700">{deleteTargetClass.teacherName}</strong></span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {deleteTargetClass.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isRTL
                ? 'މި އިތުރު ކްލާސް ސިސްޓަމުން އެއްކޮށް ޑިލީޓްކޮށްލަން ބޭނުންފުޅުތޯ ޔަގީންކުރައްވާ.'
                : 'Are you sure you want to permanently delete this extra class and remove it from the schedule?'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isRTL ? 'ކެންސަލް' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteClass}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isRTL ? 'ޑިލީޓްކުރަނީ...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'ޑިލީޓް ކުރޭ' : 'Delete Class'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5B: CLEAR ALL EXTRA CLASSES CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isRTL ? 'ހުރިހާ އިތުރު ކްލާހެއް ފުހެލުން' : 'Clear All Extra Classes'}
                </h3>
                <span className="text-xs text-slate-500 block">
                  {isRTL ? 'މި އަމަލު އަނބުރާ ނުގެނެވޭނެއެވެ' : 'This action cannot be undone'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isRTL
                ? `ތާވަލުގައިވާ ހުރިހާ (${extraClasses.length}) އިތުރު ކްލާސް ސިސްޓަމުން އެއްކޮށް ފުހެލަން ބޭނުންފުޅުތޯ ޔަގީންކުރައްވާ. އައު ކްލާސްތައް ފަހުން ތާވަލުކުރެވޭނެއެވެ.`
                : `Are you sure you want to permanently delete all ${extraClasses.length} extra classes from the system? You will have a clean schedule and can schedule or upload new classes whenever needed.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isRTL ? 'ކެންސަލް' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={confirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isRTL ? 'ފުހެވެނީ...' : 'Clearing...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'އާނ، ހުރިހާ ކްލާސް ފުހެލާ' : 'Yes, Clear All'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: BULK APPROVE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {bulkApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isRTL ? 'ހުރިހާ ކްލާހެއް އެޕްރޫވް ކުރެއްވުން' : 'Approve All Pending Classes'}
                </h3>
                <span className="text-xs text-slate-500 block">
                  {pendingApprovals.length} {isRTL ? 'ކްލާސް އިންތިޒާރުގައި' : 'classes awaiting approval'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isRTL
                ? `އިންތިޒާރުގައިވާ ހުރިހާ (${pendingApprovals.length}) އިތުރު ކްލާސްތަކެއް އެއްފަހަރާ އެޕްރޫވް ކުރައްވަން ބޭނުންފުޅުތޯ؟ މި ކްލާސްތައް އެޕްރޫވް ވުމުން ޓީޗަރުންނަށް ހާޒިރީ ނެގުމުގެ ފުރުސަތު ލިބޭނެއެވެ.`
                : `Are you sure you want to approve all ${pendingApprovals.length} pending extra classes? Once approved, teachers will be able to take attendance.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isBulkApproving}
                onClick={() => setBulkApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isRTL ? 'ކެންސަލް' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isBulkApproving}
                onClick={confirmBulkApprove}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isBulkApproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isRTL ? 'އެޕްރޫވްކުރަނީ...' : 'Approving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'ހުރިހާ ކްލާހެއް އެޕްރޫވް ކުރޭ' : 'Approve All'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// SUBCOMPONENT: Create Extra Class Form Modal
// ==========================================================================
interface CreateExtraClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  staffList: User[];
  isApprover: boolean;
  onSuccess: (newClass: ExtraClass) => void;
}

const CreateExtraClassModal: React.FC<CreateExtraClassModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  staffList,
  isApprover,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('Grade 10');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [subjectDhivehi, setSubjectDhivehi] = useState<string>('ހިސާބު');
  const [title, setTitle] = useState<string>('Grade 10 Mathematics Revision & Past Papers');
  const [titleDhivehi, setTitleDhivehi] = useState<string>('ގްރޭޑް 10 ހިސާބު އިތުރު ކްލާސް');
  const [teacherId, setTeacherId] = useState<string>(currentUser?.id || staffList[0]?.id || '');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('14:30');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [venue, setVenue] = useState<string>('Classroom 10A');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubjectSelect = (sub: { en: string; dv: string }) => {
    setSubject(sub.en);
    setSubjectDhivehi(sub.dv);
    setTitle(`${gradeLevel} ${sub.en} Extra Class`);
    setTitleDhivehi(`${gradeLevel} ${sub.dv} އިތުރު ކްލާސް`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedTeacher = staffList.find((s) => s.id === teacherId);

    try {
      const res = await fetch('/api/extra-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          titleDhivehi,
          subject,
          subjectDhivehi,
          gradeLevel,
          date,
          startTime,
          endTime,
          venue,
          teacherId,
          teacherName: selectedTeacher?.fullName || 'Teacher',
          teacherNameDhivehi: selectedTeacher?.fullNameDhivehi,
          createdByUserId: currentUser?.id || 'staff',
          createdByUserName: currentUser?.fullName || 'Staff Member',
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.extraClass);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create extra class');
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isRTL ? 'އައު އިތުރު ކްލާހެއް ތާވަލުކުރައްވާ' : 'Schedule New Extra Class'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRTL ? 'ހުރިހާ މުވައްޒަފުންނަށްވެސް އިތުރު ކްލާސް ޝެޑިއުލް ކުރެވޭނެއެވެ' : 'Open to all academic staff members'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Authorization Notice */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isApprover
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {isApprover ? (
                <span>
                  <strong>{isRTL ? 'އޮޓޯ-އެޕްރޫވަލް:' : 'Auto-Approval:'}</strong>{' '}
                  {isRTL
                    ? 'ތިޔައީ ލީޑިންގ ޓީޗަރެއް ނުވަތަ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) ކަމަށްވާތީ، މި ކްލާސް ވަގުތުން ފާސްވެ ހާޒިރީ މާކުކުރެވޭނެއެވެ.'
                    : 'As a Leading Teacher or Admin (Ahmed Mujthaba), this class will be immediately approved and ready for attendance.'}
                </span>
              ) : (
                <span>
                  <strong>{isRTL ? 'އެޕްރޫވަލް ޕްރޮސެސް:' : 'Approval Workflow:'}</strong>{' '}
                  {isRTL
                    ? 'މި އިތުރު ކްލާސް ސަބްމިޓް ވުމުން ލީޑިންގ ޓީޗަރުން ނުވަތަ އަޙްމަދު މުޖުތަބާ އެޕްރޫވް ކުރެއްވުމަށްފަހު ހާޒިރީ މާކުކުރެވޭނެއެވެ.'
                    : 'This extra class will be submitted for approval by a Leading Teacher or Admin (Ahmed Mujthaba) before attendance marking opens.'}
                </span>
              )}
            </div>
          </div>

          {/* Grade & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'ގްރޭޑް / ކްލާސް' : 'Grade Level'} *
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => {
                  setGradeLevel(e.target.value as GradeLevel);
                  setTitle(`${e.target.value} ${subject} Extra Class`);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[40px]"
              >
                {VALID_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'ތާރީޚް' : 'Date'} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[40px]"
              />
            </div>
          </div>

          {/* Quick Subject Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? 'މާއްދާ ޚިޔާރުކުރައްވާ (ނުވަތަ ތިރީގައި ލިޔުއްވާ):' : 'Select Subject (or type below):'}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              {POPULAR_SUBJECTS.map((sub) => (
                <button
                  key={sub.en}
                  type="button"
                  onClick={() => handleSubjectSelect(sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    subject === sub.en
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{isRTL ? sub.dv : sub.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Subject Dhivehi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'މާއްދާ (އިނގިރޭސި)' : 'Subject Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'މާއްދާ (ދިވެހި)' : 'Subject Name (Dhivehi)'}
              </label>
              <input
                type="text"
                value={subjectDhivehi}
                onChange={(e) => setSubjectDhivehi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none min-h-[40px] font-thaana"
              />
            </div>
          </div>

          {/* Class Title / Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRTL ? 'ކްލާހުގެ ނަން / މަޤްޞަދު' : 'Class Title / Objective'} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grade 10 Past Paper Revision / Clinic"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none min-h-[40px]"
            />
          </div>

          {/* Teacher In Charge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRTL ? 'ކިޔަވައިދެއްވާ ޓީޗަރު' : 'Teacher In Charge'} *
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[40px]"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.designation || 'Teacher'})
                </option>
              ))}
            </select>
          </div>

          {/* Time & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'ފެށޭ ގަޑި' : 'Start Time'} *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'ނިމޭ ގަޑި' : 'End Time'} *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRTL ? 'ތަން / ކޮޓަރި' : 'Venue / Room'}
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Hall / Room 10"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none min-h-[40px]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRTL ? 'އިތުރު ނޯޓް / އިރުޝާދު' : 'Instructions / Notes for Students'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'ދަރިވަރުން ގެންނަންޖެހޭ ތަކެތި...' : 'Materials students need to bring (e.g. calculator, past papers)...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {isRTL ? 'ކެންސަލް' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              ) : (
                <Check className="w-4 h-4 text-teal-400" />
              )}
              <span>
                {isApprover
                  ? (isRTL ? 'ތާވަލުކޮށް ފާސްކުރޭ' : 'Schedule & Approve Class')
                  : (isRTL ? 'އެޕްރޫވަލްއަށް ސަބްމިޓްކުރޭ' : 'Submit for Approval')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================================================
// SUBCOMPONENT: Bulk Upload Extra Classes Modal
// ==========================================================================
interface BulkUploadExtraClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  staffList: User[];
  isApprover: boolean;
  onSuccess: () => void;
}

const BulkUploadExtraClassesModal: React.FC<BulkUploadExtraClassesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  staffList,
  isApprover,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();

  const [parsedRows, setParsedRows] = useState<ParsedExtraClassRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setFileName(file.name);
    try {
      const { classes, errors } = await parseExtraClassExcel(file, staffList);
      setParsedRows(classes);
      setParseErrors(errors);
    } catch (err: any) {
      setParseErrors([err.message || 'Failed to read file']);
      setParsedRows([]);
    }
  };

  const handleConfirmUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsUploading(true);

    try {
      const res = await fetch('/api/extra-classes/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classes: parsedRows,
          uploadedByUserId: currentUser?.id || 'staff',
          uploadedByUserName: currentUser?.fullName || 'Staff Member',
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to bulk upload extra classes');
      }
    } catch (err) {
      console.error('Bulk upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isRTL ? 'އެކްސެލް މެދުވެރިކޮށް އިތުރު ކްލާސްތައް އަޕްލޯޑްކުރައްވާ' : 'Bulk Upload Extra Classes via Excel'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRTL ? 'އޮފިޝަލް ޓެމްޕްލޭޓް ފުރިހަމަކޮށް އެއްފަހަރާ ގިނަ ކްލާސްތައް ޝެޑިއުލް ކުރޭ' : 'Upload formatted spreadsheet to schedule multiple extra classes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {/* Download Template helper */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isRTL ? 'އެކްސެލް ޓެމްޕްލޭޓް ނެތްނަމަ މިތަނުން ޑައުންލޯޑް ކުރައްވާ' : 'Download official pre-formatted Excel template'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isRTL ? 'މަގޫދޫ ސްކޫލުގެ ހުރިހާ ގްރޭޑްތަކާއި ސްޓާފުންގެ ލިސްޓް ހިމެނޭ' : 'Includes reference sheets for all 12 grades and current staff'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadExtraClassTemplate(staffList)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRTL ? 'ޓެމްޕްލޭޓް ޑައުންލޯޑް' : 'Download Template'}</span>
            </button>
          </div>

          {/* File Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileChange(file);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
            onClick={() => document.getElementById('extra-class-excel-input')?.click()}
          >
            <input
              id="extra-class-excel-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
            <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-800 block">
              {fileName ? fileName : (isRTL ? 'އެކްސެލް ފައިލް މިތަނަށް ދަމާލައްވާ ނުވަތަ ފައިލް ނަންގަވާ' : 'Click to select or drop your .xlsx file here')}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {isRTL ? '.xlsx ނުވަތަ .xls ފޯމެޓް' : 'Accepts Microsoft Excel (.xlsx, .xls)'}
            </span>
          </div>

          {/* Error messages if any */}
          {parseErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isRTL ? 'ފައިލުގައި ބައެއް މައްސަލަތައް ހުރިކަން ފާހަގަކުރެވުނު:' : 'Validation Warnings:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li>...and {parseErrors.length - 5} more issues.</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview of Parsed Classes */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    {parsedRows.length} {isRTL ? 'ކްލާސް ތާވަލުކުރަން ތައްޔާރު' : 'Valid Extra Classes Detected'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {isApprover
                    ? (isRTL ? '⚡ ވަގުތުން އެޕްރޫވް ވާނެ' : '⚡ Will be Auto-Approved')
                    : (isRTL ? '📋 އެޕްރޫވަލްއަށް ފޮނުވޭނެ' : '📋 Will await approval')}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Subject & Title</th>
                      <th className="p-2">Teacher</th>
                      <th className="p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-[11px]">{r.date}</td>
                        <td className="p-2 font-bold">{r.gradeLevel}</td>
                        <td className="p-2 truncate max-w-[200px]">{r.title}</td>
                        <td className="p-2">{r.teacherName}</td>
                        <td className="p-2 font-mono text-[11px]">{r.startTime}–{r.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {isRTL ? 'ކެންސަލް' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={isUploading || parsedRows.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4 text-white" />
            )}
            <span>
              {isRTL
                ? `${parsedRows.length} ކްލާސް ސަބްމިޓްކުރޭ`
                : `Upload ${parsedRows.length} Classes`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// SUBCOMPONENT: Mark Attendance for Extra Class Modal
// ==========================================================================
interface ExtraClassAttendanceModalProps {
  extraClass: ExtraClass;
  students: Student[];
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (updatedClass: ExtraClass) => void;
}

const ExtraClassAttendanceModal: React.FC<ExtraClassAttendanceModalProps> = ({
  extraClass,
  students,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();

  // Target students enrolled in this grade
  const targetStudents = useMemo(() => {
    if (extraClass.gradeLevel === 'ALL') return students;
    return students.filter((s) => s.gradeLevel === extraClass.gradeLevel);
  }, [extraClass, students]);

  // Attendance state dictionary: studentId -> record
  const [attendanceMap, setAttendanceMap] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        arrivalTime?: string;
        remarks?: string;
      }
    >
  >(() => {
    const map: Record<string, { status: AttendanceStatus; arrivalTime?: string; remarks?: string }> = {};

    // Pre-populate with existing records if already marked
    if (extraClass.attendanceRecords && extraClass.attendanceRecords.length > 0) {
      extraClass.attendanceRecords.forEach((r) => {
        map[r.studentId] = {
          status: r.status,
          arrivalTime: r.arrivalTime,
          remarks: r.remarks,
        };
      });
    } else {
      // Default all to PRESENT for rapid 1-click completion
      targetStudents.forEach((st) => {
        map[st.id] = { status: 'PRESENT' };
      });
    }

    return map;
  });

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Status counters
  const counters = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;

    targetStudents.forEach((st) => {
      const rec = attendanceMap[st.id];
      const stStatus = rec?.status || 'PRESENT';
      if (stStatus === 'PRESENT') present++;
      else if (stStatus === 'LATE') late++;
      else if (stStatus === 'ABSENT') absent++;
      else if (stStatus === 'LEAVE') leave++;
    });

    return { total: targetStudents.length, present, late, absent, leave };
  }, [targetStudents, attendanceMap]);

  // Bulk set all to PRESENT
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    targetStudents.forEach((st) => {
      updated[st.id] = { status: 'PRESENT' };
    });
    setAttendanceMap(updated);
  };

  // Toggle individual student status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrivalTime: status === 'LATE' ? prev[studentId]?.arrivalTime || extraClass.startTime : undefined,
      },
    }));
  };

  // Handle Excel attendance upload for this class
  const handleExcelAttendanceUpload = async (file: File) => {
    try {
      const { records, errors } = await parseExtraClassAttendanceExcel(file, students);
      if (errors.length > 0) {
        alert(errors.join('\n'));
      }
      if (records.length > 0) {
        const updated = { ...attendanceMap };
        records.forEach((r) => {
          updated[r.studentId] = {
            status: r.status,
            arrivalTime: r.arrivalTime,
            remarks: r.remarks,
          };
        });
        setAttendanceMap(updated);
        alert(isRTL ? `${records.length} ދަރިވަރުންގެ ހާޒިރީ އަޕްޑޭޓް ކުރެވިއްޖެ!` : `Loaded ${records.length} attendance marks from Excel.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to read attendance file');
    }
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    setIsSaving(true);

    const records: ExtraClassAttendanceRecord[] = targetStudents.map((st) => {
      const rec = attendanceMap[st.id] || { status: 'PRESENT' };
      return {
        studentId: st.id,
        studentName: st.fullName,
        studentNameDhivehi: st.fullNameDhivehi,
        admissionNumber: st.admissionNumber,
        gradeLevel: st.gradeLevel,
        status: rec.status,
        arrivalTime: rec.arrivalTime,
        remarks: rec.remarks,
        markedAt: new Date().toISOString(),
        markedByUserId: currentUser?.id || 'staff',
        markedByUserName: currentUser?.fullName || 'Teacher',
      };
    });

    try {
      const res = await fetch(`/api/extra-classes/${extraClass.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecords: records,
          markedByUserId: currentUser?.id || 'staff',
          markedByUserName: currentUser?.fullName || 'Teacher',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.extraClass);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit attendance');
      }
    } catch (err) {
      console.error('Save attendance failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = targetStudents.filter((st) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      st.fullName.toLowerCase().includes(q) ||
      st.fullNameDhivehi.includes(q) ||
      st.admissionNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 border border-slate-200 shadow-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-slate-900 text-white">
                {extraClass.gradeLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {extraClass.subject}
              </span>
              <span className="text-xs font-mono text-slate-500">{cleanDisplayDate(extraClass.date)}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {isRTL && extraClass.titleDhivehi ? extraClass.titleDhivehi : extraClass.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{isRTL ? 'ގަޑި:' : 'Time:'} <strong>{extraClass.startTime} – {extraClass.endTime}</strong></span>
              <span>•</span>
              <span>{isRTL ? 'ތަން:' : 'Venue:'} <strong>{cleanDisplayVenue(extraClass.venue)}</strong></span>
              <span>•</span>
              <span>{isRTL ? 'ޓީޗަރު:' : 'Teacher:'} <strong>{extraClass.teacherName}</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Live Counters & Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 py-3 border-b border-slate-100">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'ޖުމްލަ' : 'Total'}</span>
            <div className="text-lg font-black text-slate-900">{counters.total}</div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">{isRTL ? 'ޙާޟިރު' : 'Present'}</span>
            <div className="text-lg font-black text-emerald-900">{counters.present}</div>
          </div>

          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase">{isRTL ? 'ލަސްވި' : 'Late'}</span>
            <div className="text-lg font-black text-amber-900">{counters.late}</div>
          </div>

          <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase">{isRTL ? 'ޣައިރުޙާޟިރު' : 'Absent'}</span>
            <div className="text-lg font-black text-rose-900">{counters.absent}</div>
          </div>

          <div className="bg-sky-50 rounded-xl p-2.5 border border-sky-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-sky-700 uppercase">{isRTL ? 'ސަލާމް' : 'Leave'}</span>
            <div className="text-lg font-black text-sky-900">{counters.leave}</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5">
          {/* Quick Mark All Present */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isRTL ? 'ހުރިހާ ދަރިވަރުން ޙާޟިރު' : 'Mark All Present'}</span>
            </button>

            {/* Excel Sheet Download */}
            <button
              type="button"
              onClick={() => downloadExtraClassAttendanceSheet(extraClass, students)}
              className="p-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
              title="Download Excel sheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Excel Sheet Upload */}
            <label className="p-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{isRTL ? 'އަޕްލޯޑް' : 'Upload'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleExcelAttendanceUpload(f);
                }}
              />
            </label>
          </div>

          {/* Student Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'ދަރިވަރު ހޯއްދަވާ...' : 'Search student...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Student Roll-Call List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {filteredStudents.map((st, idx) => {
            const currentRecord = attendanceMap[st.id] || { status: 'PRESENT' };
            const status = currentRecord.status;

            return (
              <div
                key={st.id}
                className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                  status === 'ABSENT'
                    ? 'bg-rose-50/50'
                    : status === 'LATE'
                    ? 'bg-amber-50/50'
                    : status === 'LEAVE'
                    ? 'bg-sky-50/50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{st.fullName}</span>
                      <span className="text-[11px] text-slate-500 font-thaana">{st.fullNameDhivehi}</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      {st.admissionNumber}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="grid grid-cols-4 sm:flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(st.id, 'PRESENT')}
                    className={`px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1 active:scale-95 touch-manipulation ${
                      status === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRTL ? 'ޙާޟިރު' : 'Present'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st.id, 'LATE')}
                    className={`px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1 active:scale-95 touch-manipulation ${
                      status === 'LATE'
                        ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRTL ? 'ލަސް' : 'Late'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st.id, 'ABSENT')}
                    className={`px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1 active:scale-95 touch-manipulation ${
                      status === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRTL ? 'ޣައިރު' : 'Absent'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st.id, 'LEAVE')}
                    className={`px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1 active:scale-95 touch-manipulation ${
                      status === 'LEAVE'
                        ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRTL ? 'ސަލާމް' : 'Leave'}</span>
                  </button>

                  {/* Late arrival time input if late */}
                  {status === 'LATE' && (
                    <div className="col-span-4 sm:col-span-auto flex items-center gap-1 mt-1 sm:mt-0">
                      <span className="text-[11px] font-bold text-amber-800">{isRTL ? 'ގަޑި:' : 'Time:'}</span>
                      <input
                        type="time"
                        value={currentRecord.arrivalTime || extraClass.startTime}
                        onChange={(e) => {
                          setAttendanceMap((prev) => ({
                            ...prev,
                            [st.id]: {
                              ...prev[st.id],
                              arrivalTime: e.target.value,
                            },
                          }));
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-mono border border-amber-300 bg-white min-h-[36px]"
                        title="Arrival Time"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-2">
          <span className="text-xs text-slate-500">
            {counters.present} / {counters.total} {isRTL ? 'ޙާޟިރު' : 'Present'} (
            {counters.total > 0 ? Math.round((counters.present / counters.total) * 100) : 0}%)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {isRTL ? 'ކެންސަލް' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAttendance}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-teal-300" />
              )}
              <span>{isRTL ? 'ހާޒިރީ ސަބްމިޓްކުރޭ' : 'Save & Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
