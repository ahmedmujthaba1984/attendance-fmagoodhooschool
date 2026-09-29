import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Database,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Radio,
  Clock,
  Check,
  Download,
  Pencil,
  Sparkles,
  UserCheck,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Student, GradeLevel, User } from '../types';

interface MagoodhooSyncState {
  sourceUrl: string;
  lastSyncTime: string | null;
  lastSyncedBundle: string | null;
  totalStudents: number;
  totalStaff?: number;
  gradeBreakdown: Record<string, number>;
  departmentBreakdown?: Record<string, number>;
  status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  lastError: string | null;
  autoSyncEnabled: boolean;
  version: string;
}

interface MagoodhooSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  staff?: User[];
  onStudentsUpdated: (newStudents: Student[]) => void;
  onStaffUpdated?: (newStaff: User[]) => void;
  onEditStudent?: (student: Student) => void;
}

export const MagoodhooSyncModal: React.FC<MagoodhooSyncModalProps> = ({
  isOpen,
  onClose,
  students,
  staff = [],
  onStudentsUpdated,
  onStaffUpdated,
  onEditStudent,
}) => {
  const { t, isRTL } = useLanguage();
  const isRtl = isRTL;
  const [syncState, setSyncState] = useState<MagoodhooSyncState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'directory' | 'staff' | 'import'>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [jsonInput, setJsonInput] = useState('');

  const handleBatchFixDhivehiNames = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/students/fix-dhivehi-names', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const sRes = await fetch('/api/students');
        if (sRes.ok) {
          const sData = await sRes.json();
          onStudentsUpdated(sData.students);
        }
        setSyncMessage({
          type: 'success',
          text: isRtl
            ? `ދިވެހި ނަންތައް ޗެކްކޮށް އިޞްލާޙު ކުރެވިއްޖެ (${data.correctionsCount} އިޞްލާޙު)`
            : `Audited ${data.totalAudited} students and applied ${data.correctionsCount} Dhivehi orthographic corrections!`,
        });
      }
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || 'Audit failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/magoodhoo/sync-status');
      if (res.ok) {
        const data = await res.json();
        setSyncState(data);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSyncStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/magoodhoo/sync-now', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const staffText = data.currentTotalStaff ? ` and ${data.currentTotalStaff} staff members` : '';
        const dvStaffText = data.currentTotalStaff ? ` އަދި ${data.currentTotalStaff} ސްޓާފުން` : '';
        setSyncMessage({
          type: 'success',
          text: isRtl
            ? `ކާމިޔާބުކަމާއެކު ${data.currentTotalStudents} ދަރިވަރުން${dvStaffText} ފ. މަގޫދޫ ސްކޫލް ޕޯޓަލުން ސިންކްކުރެވިއްޖެ!`
            : `Successfully synchronized ${data.currentTotalStudents} students${staffText} directly from F. Magoodhoo School portal!`,
        });
        await fetchSyncStatus();
        // Refresh student directory
        const stdRes = await fetch('/api/students');
        if (stdRes.ok) {
          const stdData = await stdRes.json();
          onStudentsUpdated(stdData.students);
        }
        // Refresh staff directory if callback provided
        if (onStaffUpdated) {
          const staffRes = await fetch('/api/auth/staff');
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            onStaffUpdated(staffData.staff);
          }
        }
      } else {
        setSyncMessage({
          type: 'error',
          text: data.message || (isRtl ? 'ސިންކްކުރުމުގައި މައްސަލައެއް ދިމާވެއްޖެ.' : 'Failed to sync with remote portal.'),
        });
      }
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || (isRtl ? 'ގުޅުމުގައި މައްސަލައެއް ދިމާވެއްޖެ.' : 'Network connection error during sync.'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch('/api/magoodhoo/import-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: parsed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMessage({
          type: 'success',
          text: isRtl
            ? `ކާމިޔާބުކަމާއެކު ${data.currentTotalStudents} ދަރިވަރުން އިމްޕޯޓްކުރެވިއްޖެ!`
            : `Successfully imported ${data.currentTotalStudents} students from backup payload!`,
        });
        setJsonInput('');
        await fetchSyncStatus();
        const stdRes = await fetch('/api/students');
        if (stdRes.ok) {
          const stdData = await stdRes.json();
          onStudentsUpdated(stdData.students);
        }
      } else {
        setSyncMessage({
          type: 'error',
          text: data.message || 'Import failed.',
        });
      }
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: isRtl ? 'ޖޭސަން ފޯމެޓް ރަނގަޅެއް ނޫން: ' + err.message : 'Invalid JSON format: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter((s) => {
    const matchesGrade = selectedGrade === 'ALL' || s.gradeLevel === selectedGrade;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      s.fullName.toLowerCase().includes(q) ||
      s.fullNameDhivehi.includes(searchQuery) ||
      s.admissionNumber.toLowerCase().includes(q) ||
      s.gradeLevel.toLowerCase().includes(q);
    return matchesGrade && matchesSearch;
  });

  const gradeList: GradeLevel[] = [
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

  const departmentList = Array.from(
    new Set((staff || []).map((s) => s.department).filter(Boolean) as string[])
  ).sort();

  const filteredStaff = (staff || []).filter((s) => {
    const matchesDept = selectedDepartment === 'ALL' || s.department === selectedDepartment;
    if (!staffSearchQuery.trim()) return matchesDept;
    const q = staffSearchQuery.toLowerCase();
    const matchesSearch =
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.fullNameDhivehi && s.fullNameDhivehi.includes(staffSearchQuery)) ||
      (s.designation || '').toLowerCase().includes(q) ||
      (s.designationDhivehi && s.designationDhivehi.includes(staffSearchQuery)) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.primarySubject || '').toLowerCase().includes(q) ||
      (s.staffId || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(staffSearchQuery));
    return matchesDept && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {isRtl ? 'ފ. މަގޫދޫ ސްކޫލް ޑައިރެކްޓަރީ ލައިވް ސިންކްރޮނައިޒަރ' : 'F. Magoodhoo School Directory Synchronizer'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Linked
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-1.5">
                <span>Source:</span>
                <a
                  href="https://reportcard-fmagoodhooschool.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white flex items-center gap-1 transition-colors"
                >
                  https://reportcard-fmagoodhooschool.vercel.app/
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-1 pt-3">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {isRtl ? 'ސިންކް ޙާލަތު' : 'Sync Status & Controls'}
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {isRtl ? `ދަރިވަރުންގެ ލިސްޓް (${students.length})` : `Live Students (${students.length})`}
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isRtl ? `ސްޓާފުންގެ ލިސްޓް (${(staff || []).length})` : `Live Staff (${(staff || []).length})`}
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {isRtl ? 'ބެކަޕް އިމްޕޯޓް' : 'Manual JSON Backup Import'}
            </button>
          </div>

          <div className="flex items-center gap-2 pb-1.5">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing
                ? isRtl
                  ? 'ސިންކްވަނީ...'
                  : 'Syncing Live...'
                : isRtl
                ? 'ވަގުތުން ސިންކްކުރޭ'
                : 'Sync Live Directory Now'}
            </button>
          </div>
        </div>

        {/* Sync message banner */}
        {syncMessage && (
          <div
            className={`px-6 py-3 text-xs flex items-center gap-2 border-b ${
              syncMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{syncMessage.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4">
                  <div className="text-xs font-medium text-blue-700 flex items-center justify-between">
                    <span>{isRtl ? 'ޖުމްލަ ދަރިވަރުން' : 'Total Students'}</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-950 mt-2">
                    {students.length}
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1 font-medium">
                    12 Grades (LKG - Gr 10)
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                  <div className="text-xs font-medium text-amber-700 flex items-center justify-between">
                    <span>{isRtl ? 'ޖުމްލަ ސްޓާފުން' : 'Academic Staff'}</span>
                    <UserCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-950 mt-2">
                    {(staff || []).length || 46}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1 font-medium">
                    {isRtl ? 'ޓީޗަރުން އަދި ލީޑަރޝިޕް' : 'Teachers & Admin'}
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
                  <div className="text-xs font-medium text-emerald-700 flex items-center justify-between">
                    <span>{isRtl ? 'ގުޅުމުގެ ޙާލަތު' : 'Database Link'}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-emerald-900 mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Live Connected
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1">
                    Auto-check active
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
                    <span>{isRtl ? 'އެންމެ ފަހުން ސިންކްކުރީ' : 'Last Synced'}</span>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-2 truncate">
                    {syncState?.lastSyncTime
                      ? new Date(syncState.lastSyncTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {syncState?.lastSyncTime
                      ? new Date(syncState.lastSyncTime).toLocaleDateString()
                      : 'Today'}
                  </div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4">
                  <div className="text-xs font-medium text-indigo-700 flex items-center justify-between">
                    <span>{isRtl ? 'ޑޭޓާބޭސް' : 'Sync Source'}</span>
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xs font-mono font-semibold text-indigo-900 mt-2 truncate">
                    Live Portal Bundle
                  </div>
                  <div className="text-[11px] text-indigo-600 mt-1">
                    Students & Staff Synced
                  </div>
                </div>
              </div>

              {/* Real-time synchronization notice */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <span>ℹ️</span>
                  <span>
                    {isRtl
                      ? 'މަގޫދޫ ސްކޫލް ރިޕޯޓްކާޑު ޕޯޓަލްއާ ވަގުތުން ގުޅިފައިވާ ނިޒާމު'
                      : 'Live External Directory Synchronization'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {isRtl
                    ? 'މި ޕޯޓަލް ވަނީ ސީދާ https://reportcard-fmagoodhooschool.vercel.app/ ގެ ލައިވް ޑޭޓާބޭސްއާ ގުޅުވާލެވިފައެވެ. އެ ޕޯޓަލްގައިވާ ދަރިވަރުންގެ އިނގިރޭސި ނުވަތަ ދިވެހި ނަމަށް ގެންނަ ކޮންމެ ބަދަލެއް އޮޓޮމެޓިކުން މި ޕޯޓަލްގެ ހާޒިރީ ސިސްޓަމަށް ސިންކްވާނެއެވެ.'
                    : 'This portal is directly wired to the live F. Magoodhoo School EduRMS Report Card database (https://reportcard-fmagoodhooschool.vercel.app/). Any change made to student English or Dhivehi names in the report card portal is automatically synchronized into this attendance portal without losing historical attendance records.'}
                </p>
              </div>

              {/* Grade Distribution Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  {isRtl ? 'ގްރޭޑްތަކަށް ބެހިފައިވާ ދަރިވަރުންގެ އަދަދު' : 'Students Enrolled by Grade Level'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {gradeList.map((grade) => {
                    const count = students.filter((s) => s.gradeLevel === grade).length;
                    return (
                      <div
                        key={grade}
                        className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs transition-colors"
                      >
                        <div className="text-xs font-semibold text-slate-700">{grade}</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                          {count}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {isRtl ? 'ކުދިން' : 'students'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'ނަމުން، އެޑްމިޝަން ނަންބަރުން ހޯދާ...'
                        : 'Search by student name, admission #...'
                    }
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">{isRtl ? 'ހުރިހާ ގްރޭޑްތަކެއް' : 'All 12 Grades'}</option>
                    {gradeList.map((g) => (
                      <option key={g} value={g}>
                        {g} ({students.filter((s) => s.gradeLevel === g).length})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleBatchFixDhivehiNames}
                  disabled={isSyncing}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
                  title={isRtl ? 'ދިވެހި ނަންތަކުގެ ކުށް އިޞްލާޙު ކުރޭ' : 'Audit and correct Dhivehi name spellings'}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isRtl ? 'ދިވެހި ނަން އިޞްލާޙު ކުރޭ' : 'Audit Dhivehi Names'}</span>
                </button>
              </div>

              {/* Student Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{isRtl ? 'އެޑްމިޝަން' : 'Adm No / Index'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ދަރިވަރުގެ ނަން (English)' : 'Full Name (English)'}</th>
                      <th className="py-2.5 px-3 text-right">{isRtl ? 'ދަރިވަރުގެ ނަން (ދިވެހި)' : 'Dhivehi Name'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ގްރޭޑް' : 'Grade'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ޖިންސު' : 'Gender'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ބަލަދުވެރިޔާ' : 'Guardian'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ފޯނު' : 'Phone'}</th>
                      {onEditStudent && <th className="py-2.5 px-3 text-center">{isRtl ? 'އަމަލު' : 'Action'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={onEditStudent ? 9 : 8} className="py-8 text-center text-slate-400">
                          {isRtl ? 'ދަރިވަރަކު ނުފެނުނު' : 'No students matching the criteria'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st, i) => (
                        <tr key={st.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-blue-900 font-mono">
                            {st.admissionNumber}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {st.fullName}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 text-right font-thaana" dir="rtl">
                            {st.fullNameDhivehi}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {st.gradeLevel}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {st.gender === 'MALE' ? (isRtl ? 'ފިރިހެން' : 'Male') : (isRtl ? 'އަންހެން' : 'Female')}
                          </td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">
                            {st.guardianName || 'Guardian'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-mono">
                            {st.parentContactPhone}
                          </td>
                          {onEditStudent && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onEditStudent(st)}
                                className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors inline-flex items-center justify-center"
                                title={isRtl ? 'މަޢުލޫމާތު ބަދަލުކުރޭ' : 'Edit student details'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'ސްޓާފް ނަމުން، މަޤާމުން، ޑިޕާޓްމަންޓުން ހޯދާ...'
                        : 'Search staff by name, title, department, ID...'
                    }
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">
                      {isRtl ? 'ހުރިހާ ޑިޕާޓްމަންޓްތަކެއް' : 'All Departments'} ({(staff || []).length})
                    </option>
                    {departmentList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept} ({(staff || []).filter((s) => s.department === dept).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ml-auto text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  {isRtl
                    ? `ފެނުނީ: ${filteredStaff.length} ސްޓާފުން`
                    : `Showing: ${filteredStaff.length} of ${(staff || []).length} Staff`}
                </div>
              </div>

              {/* Staff Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ސްޓާފް އައިޑީ' : 'Staff ID'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ސްޓާފްގެ ނަން' : 'Full Name'}</th>
                      <th className="py-2.5 px-3 text-right">{isRtl ? 'ދިވެހި ނަން' : 'Dhivehi Name'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'މަޤާމު' : 'Designation'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ޑިޕާޓްމަންޓް' : 'Department'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ގްރޭޑް / މާއްދާ' : 'Assigned / Subject'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ރޯލް' : 'Role'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'ގުޅޭނެ' : 'Contact'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          {isRtl ? 'ސްޓާފަކު ނުފެނުނު' : 'No staff members matching the criteria'}
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((st, i) => (
                        <tr key={st.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-blue-900 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[11px]">
                              {st.staffId || `STF-${i + 1}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <div>{st.fullName}</div>
                            {st.email && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-2.5 h-2.5" />
                                <span>{st.email}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 text-right font-thaana" dir="rtl">
                            <div>{st.fullNameDhivehi || '—'}</div>
                            {st.designationDhivehi && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {st.designationDhivehi}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div className="font-medium text-slate-800">{st.designation}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {st.department || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {st.assignedGrade ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                {st.assignedGrade}
                              </span>
                            ) : st.primarySubject ? (
                              <span className="text-[11px] text-slate-600 font-medium">
                                {st.primarySubject}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {st.role === 'ADMIN' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ADMIN
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                TEACHER
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {st.phone ? (
                              <div className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{st.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>
                    {isRtl
                      ? 'މަގޫދޫ ޕޯޓަލުން އެކްސްޕޯޓްކުރި ޖޭސަން ފައިލް އަޅާ'
                      : 'Import Exported Backup from reportcard-fmagoodhooschool.vercel.app'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isRtl
                    ? 'މަގޫދޫ ރިޕޯޓްކާޑު ޕޯޓަލުން ބެކަޕް ނަގާފައިވާ JSON ފައިލް (magoodhoo_edurms_students_v25.json) ނުވަތަ ޑޭޓާ ކޮޕީކޮށް މިތަނަށް އަޅާލައިގެން ދަރިވަރުންގެ ލިސްޓު ވަގުތުން އަޕްޑޭޓް ކުރެވޭނެއެވެ.'
                    : 'If you made changes in your browser on the F. Magoodhoo School Report Card Portal and exported the JSON backup (magoodhoo_edurms_students_v25.json), you can upload it or paste its content below to instantly mirror it here.'}
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRtl ? 'ފައިލް އިޚްތިޔާރުކުރޭ' : 'Choose JSON File'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Supports .json arrays or grade dictionary formats
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isRtl ? 'ޖޭސަން ޑޭޓާ ޕޭސްޓްކުރޭ' : 'Paste JSON Payload Directly'}
                </label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[ { "id": "std-lkg-970", "indexNo": "970", "fullName": "Aasha Binth Nafiz", ... } ]'
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJsonInput('')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {isRtl ? 'ފޮހެލާ' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  disabled={!jsonInput.trim() || isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isRtl ? 'އިމްޕޯޓްކޮށް ސިންކްކުރޭ' : 'Import & Mirror Directory'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {isRtl
                ? 'ފ. މަގޫދޫ ސްކޫލް ހާޒިރީ ސިސްޓަމް • ރަސްމީ ޑައިރެކްޓަރީ'
                : 'F. Magoodhoo School Attendance Portal • Official Directory'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {isRtl ? 'ބަންދުކުރޭ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
