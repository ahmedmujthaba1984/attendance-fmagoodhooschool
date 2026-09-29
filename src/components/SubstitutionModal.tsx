import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  Plus,
  Check,
  Shield,
  AlertCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User, ClassDelegation, GradeLevel } from '../types';

interface SubstitutionModalProps {
  staffList: User[];
  delegations: ClassDelegation[];
  onAssignDelegation: (delegation: {
    date: string;
    originalTeacherId: string;
    substituteTeacherId: string;
    gradeLevel: GradeLevel;
    reason: string;
    notes?: string;
  }) => void | Promise<void>;
  onUpdateDelegation?: (id: string, delegation: Partial<ClassDelegation>) => void | Promise<void>;
  onDeleteDelegation?: (id: string) => void | Promise<void>;
  selectedDate: string;
}

const GRADES_LIST: GradeLevel[] = [
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

const REASON_PRESETS = [
  'Medical Leave / Doctor Visit to Malé',
  'Official Duty / MoE Training',
  'Casual Leave / Personal',
  'Exam Supervision Coverage',
  'Family / Paternity / Maternity Leave',
];

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  staffList,
  delegations,
  onAssignDelegation,
  onUpdateDelegation,
  onDeleteDelegation,
  selectedDate,
}) => {
  const { t, isRTL } = useLanguage();

  // Create form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignDate, setAssignDate] = useState(selectedDate);
  const [origTeacherId, setOrigTeacherId] = useState(staffList[3]?.id || staffList[0]?.id || '');
  const [subTeacherId, setSubTeacherId] = useState(staffList[4]?.id || staffList[1]?.id || '');
  const [targetGrade, setTargetGrade] = useState<GradeLevel>('Grade 4');
  const [reason, setReason] = useState('Medical Leave / Doctor Visit to Malé');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingDelegation, setEditingDelegation] = useState<ClassDelegation | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editOrigId, setEditOrigId] = useState('');
  const [editSubId, setEditSubId] = useState('');
  const [editGrade, setEditGrade] = useState<GradeLevel>('Grade 4');
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [deletingDelegation, setDeletingDelegation] = useState<ClassDelegation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Inline Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const getStaffName = (id: string) => {
    const s = staffList.find((st) => st.id === id);
    if (!s) return id;
    return isRTL ? s.fullNameDhivehi || s.fullName : s.fullName;
  };

  const getStaffDesignation = (id: string) => {
    const s = staffList.find((st) => st.id === id);
    return s?.designation || '';
  };

  // Handle Create Delegation
  const handleSubmitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origTeacherId || !subTeacherId) return;

    if (origTeacherId === subTeacherId) {
      showNotification(
        isRTL ? 'އަސްލު ޓީޗަރާއި ބަދަލު ޓީޗަރަކީ އެއް ބޭފުޅަކަށް ނުވެވޭނެއެވެ.' : 'Original teacher and substitute teacher cannot be the same person.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssignDelegation({
        date: assignDate || selectedDate,
        originalTeacherId: origTeacherId,
        substituteTeacherId: subTeacherId,
        gradeLevel: targetGrade,
        reason: reason.trim() || 'Leave / Official Duty Coverage',
        notes: notes.trim(),
      });
      setShowAssignForm(false);
      setNotes('');
      showNotification(
        isRTL ? 'ބަދަލު ޓީޗަރު ކާމިޔާބުކަމާއެކު ހަމަޖައްސައިފި' : 'Substitute teacher successfully assigned'
      );
    } catch (err) {
      showNotification(
        isRTL ? 'މަޢުލޫމާތު ރައްކާކުރުމުގައި މައްސަލައެއް ޖެހިއްޖެ' : 'Failed to save substitute assignment',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (del: ClassDelegation) => {
    setEditingDelegation(del);
    setEditDate(del.date);
    setEditOrigId(del.originalTeacherId);
    setEditSubId(del.substituteTeacherId);
    setEditGrade(del.gradeLevel);
    setEditReason(del.reason || '');
    setEditNotes(del.notes || '');
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelegation) return;

    if (!editOrigId || !editSubId) return;

    if (editOrigId === editSubId) {
      showNotification(
        isRTL ? 'އަސްލު ޓީޗަރާއި ބަދަލު ޓީޗަރަކީ އެއް ބޭފުޅަކަށް ނުވެވޭނެއެވެ.' : 'Original teacher and substitute teacher cannot be the same person.',
        'error'
      );
      return;
    }

    setIsUpdating(true);
    try {
      if (onUpdateDelegation) {
        await onUpdateDelegation(editingDelegation.id, {
          date: editDate || editingDelegation.date,
          originalTeacherId: editOrigId,
          substituteTeacherId: editSubId,
          gradeLevel: editGrade,
          reason: editReason.trim() || 'Leave / Official Duty Coverage',
          notes: editNotes.trim(),
        });
      }
      setEditingDelegation(null);
      showNotification(
        isRTL ? 'ބަދަލު ޓީޗަރުގެ ރެކޯޑު އިޞްލާޙުކުރެވިއްޖެ' : 'Delegation record updated successfully'
      );
    } catch (err) {
      showNotification(
        isRTL ? 'ރެކޯޑު އިޞްލާޙުކުރުމުގައި މައްސަލައެއް ޖެހިއްޖެ' : 'Failed to update delegation record',
        'error'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingDelegation) return;

    setIsDeleting(true);
    try {
      if (onDeleteDelegation) {
        await onDeleteDelegation(deletingDelegation.id);
      }
      setDeletingDelegation(null);
      showNotification(
        isRTL ? 'ބަދަލު ޓީޗަރުގެ ރެކޯޑު ފޮހެލެވިއްޖެ' : 'Delegation record deleted successfully'
      );
    } catch (err) {
      showNotification(
        isRTL ? 'ރެކޯޑު ފޮހެލުމުގައި މައްސަލައެއް ޖެހިއްޖެ' : 'Failed to delete delegation record',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered delegations list
  const filteredDelegations = useMemo(() => {
    return delegations.filter((del) => {
      // Grade filter
      if (gradeFilter !== 'ALL' && del.gradeLevel !== gradeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const origName = getStaffName(del.originalTeacherId).toLowerCase();
        const subName = getStaffName(del.substituteTeacherId).toLowerCase();
        const reason = (del.reason || '').toLowerCase();
        const date = (del.date || '').toLowerCase();
        const grade = del.gradeLevel.toLowerCase();
        return (
          origName.includes(query) ||
          subName.includes(query) ||
          reason.includes(query) ||
          date.includes(query) ||
          grade.includes(query)
        );
      }
      return true;
    });
  }, [delegations, gradeFilter, searchQuery, staffList, isRTL]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.substitutionTitle || 'Class Delegation & Substitute Teacher Roster'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.substitutionDesc || 'Temporary homeroom delegation for staff on official duty or leave'}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAssignForm(!showAssignForm);
            setAssignDate(selectedDate);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{t.assignSubstitute || 'Assign Substitute'}</span>
        </button>
      </div>

      {/* Assignment Form (Collapsible) */}
      {showAssignForm && (
        <form onSubmit={handleSubmitAssign} className="bg-white rounded-2xl border border-sky-300 p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>{t.assignSubstitute || 'Assign Substitute'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Delegation Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.delegationDate || 'Delegation Date'}</span>
              </label>
              <input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Original Teacher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.originalTeacher || 'Original Teacher'}</label>
              <select
                value={origTeacherId}
                onChange={(e) => setOrigTeacherId(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {isRTL ? st.fullNameDhivehi || st.fullName : st.fullName} ({st.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Substitute Teacher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.substituteTeacher || 'Substitute Teacher'}</label>
              <select
                value={subTeacherId}
                onChange={(e) => setSubTeacherId(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {isRTL ? st.fullNameDhivehi || st.fullName : st.fullName} ({st.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.gradeLevel || 'Grade Level'}</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value as GradeLevel)}
                required
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.delegationReason || 'Delegation Reason'}</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g. Travel to Male' / Medical leave"
              />
            </div>
          </div>

          {/* Quick preset chips for reason */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500">{isRTL ? 'އާންމު ސަބަބުތައް:' : 'Quick Reasons:'}</span>
            {REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                  reason === preset
                    ? 'bg-sky-100 text-sky-800 border-sky-300 font-semibold'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.delegationNotes || 'Notes / Instructions (Optional)'}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
              placeholder="e.g. Please supervise period 3 maths and distribute exam papers"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {t.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? (isRTL ? 'ރައްކާކުރަނީ...' : 'Saving...') : (t.confirmSubstitution || 'Confirm Substitution')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Delegations Roster with Search, Filter & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              {isRTL ? 'ރެކޯޑުކުރެވިފައިވާ ބަދަލު ޓީޗަރުން' : 'Active Delegations & Coverage Log'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
              {filteredDelegations.length} / {delegations.length}
            </span>
          </div>

          {/* Search and Grade Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ހޯދާ...' : 'Search teacher or reason...'}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="ALL">{t.allGrades || 'All Grades'}</option>
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {delegations.length === 0 ? (
          <div className="p-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">
              {isRTL ? 'މިއަދަށް އެއްވެސް ބަދަލު ޓީޗަރެއް ކަނޑައެޅިފައެއް ނުވޭ' : 'No substitute delegations active today.'}
            </p>
          </div>
        ) : filteredDelegations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Search className="w-7 h-7 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">
              {isRTL ? 'ހޯދި މިންގަނޑާ ދިމާވާ ރެކޯޑެއް ނުފެނުނު' : 'No delegation records matched your filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('ALL');
              }}
              className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
            >
              {isRTL ? 'ފިލްޓަރުތައް ފޮހެލާ' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDelegations.map((del) => (
              <div
                key={del.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 px-2 rounded-xl transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{del.gradeLevel}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200 text-[10px]">
                      {t.activeSubstitute || 'Active Substitute'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {del.date}
                    </span>
                  </div>

                  <div className="text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      {isRTL ? 'އަސްލު ޓީޗަރު:' : 'Original:'}{' '}
                      <strong className="text-slate-800">{getStaffName(del.originalTeacherId)}</strong>
                      <span className="text-slate-400 text-[10px] ml-1">({getStaffDesignation(del.originalTeacherId)})</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {isRTL ? 'ބަދަލު ޓީޗަރު:' : 'Substitute:'}{' '}
                      <strong className="text-sky-700">{getStaffName(del.substituteTeacherId)}</strong>
                      <span className="text-slate-400 text-[10px] ml-1">({getStaffDesignation(del.substituteTeacherId)})</span>
                    </span>
                  </div>

                  {del.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      <span className="font-semibold text-slate-600">{isRTL ? 'ނޯޓު:' : 'Note:'}</span> {del.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] max-w-44 truncate">
                    {del.reason}
                  </span>

                  {/* EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(del)}
                    title={isRTL ? 'ރެކޯޑު ބަދަލުކުރޭ' : 'Edit Delegation'}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5 text-sky-600" />
                    <span className="hidden sm:inline">{isRTL ? 'ބަދަލުކުރޭ' : 'Edit'}</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => setDeletingDelegation(del)}
                    title={isRTL ? 'ރެކޯޑު ފޮހެލާ' : 'Delete Delegation'}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">{isRTL ? 'ފޮހެލާ' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= EDIT DELEGATION MODAL ================= */}
      {editingDelegation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Pencil className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t.editSubstitute || 'Edit Class Delegation'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'ބަދަލު ޓީޗަރުގެ މަޢުލޫމާތު އިޞްލާޙުކުރުން' : 'Update substitute assignment and handover details'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingDelegation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.delegationDate || 'Delegation Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.gradeLevel || 'Grade Level'}</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as GradeLevel)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Original Teacher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.originalTeacher || 'Original Teacher'}</label>
                  <select
                    value={editOrigId}
                    onChange={(e) => setEditOrigId(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {isRTL ? st.fullNameDhivehi || st.fullName : st.fullName} ({st.designation})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Substitute Teacher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.substituteTeacher || 'Substitute Teacher'}</label>
                  <select
                    value={editSubId}
                    onChange={(e) => setEditSubId(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {isRTL ? st.fullNameDhivehi || st.fullName : st.fullName} ({st.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.delegationReason || 'Delegation Reason'}</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g. Travel to Male' / Medical leave"
                />
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditReason(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        editReason === preset
                          ? 'bg-sky-100 text-sky-800 border-sky-300 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.delegationNotes || 'Notes / Instructions (Optional)'}</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  placeholder="Instructions for the substitute..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDelegation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUpdating ? (isRTL ? 'އަދާހަމަކުރަނީ...' : 'Updating...') : (t.updateSubstitute || 'Update Delegation')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingDelegation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.deleteSubstitute || 'Delete Substitution Record?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.confirmDeleteDelegation || 'Are you sure you want to delete this delegation record?'}
                </p>
              </div>
            </div>

            {/* Delegation details preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{deletingDelegation.gradeLevel}</span>
                <span className="font-mono text-slate-500 text-[11px]">{deletingDelegation.date}</span>
              </div>
              <div className="text-slate-600 flex items-center gap-2">
                <span>{getStaffName(deletingDelegation.originalTeacherId)}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-sky-700">{getStaffName(deletingDelegation.substituteTeacherId)}</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                <span className="font-medium text-slate-600">{isRTL ? 'ސަބަބު:' : 'Reason:'}</span> {deletingDelegation.reason}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDelegation(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? (isRTL ? 'ފޮހެލަނީ...' : 'Deleting...') : (isRTL ? 'ރެކޯޑު ފޮހެލާ' : 'Delete Record')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
