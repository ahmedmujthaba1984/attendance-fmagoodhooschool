import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  ShieldAlert,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  AlertTriangle,
  Mail,
  UserCheck,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User, StaffPasswordInfo } from '../types';

interface SuperAdminPasswordModalProps {
  currentUser: User | null;
  onClose: () => void;
  onStaffUpdated?: () => void;
}

export const SuperAdminPasswordModal: React.FC<SuperAdminPasswordModalProps> = ({
  currentUser,
  onClose,
  onStaffUpdated,
}) => {
  const { isRTL } = useLanguage();
  const [staffList, setStaffList] = useState<StaffPasswordInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUSTOM' | 'DEFAULT'>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states for actions
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  // Single staff custom password modal state
  const [selectedStaffForCustom, setSelectedStaffForCustom] = useState<StaffPasswordInfo | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [showCustomPassText, setShowCustomPassText] = useState(false);
  const [isSettingCustom, setIsSettingCustom] = useState(false);

  const fetchStaffPasswordList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/staff-passwords?requesterEmail=${encodeURIComponent(currentUser?.email || '')}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification({
          type: 'error',
          message: errData.error || 'Failed to load staff password status.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Network error loading staff password list.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffPasswordList();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (statusFilter === 'CUSTOM' && !s.hasCustomPassword) return false;
      if (statusFilter === 'DEFAULT' && s.hasCustomPassword) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.fullNameDhivehi && s.fullNameDhivehi.includes(q)) ||
        s.email.toLowerCase().includes(q) ||
        s.staffId.toLowerCase().includes(q) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    });
  }, [staffList, searchQuery, statusFilter]);

  // Handle Reset Single Staff to 1234
  const handleResetSingleToDefault = async (staff: StaffPasswordInfo) => {
    try {
      const res = await fetch('/api/admin/reset-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: staff.email,
          requesterEmail: currentUser?.email,
          newPassword: '1234',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `Password for ${staff.fullName} reset to 1234`,
        });
        fetchStaffPasswordList();
        if (onStaffUpdated) onStaffUpdated();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to reset password.',
        });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Connection error resetting password.' });
    }
  };

  // Handle Setting Custom Password for a Staff Member
  const handleSaveCustomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForCustom || !customPasswordInput.trim()) return;
    if (customPasswordInput.trim().length < 5) {
      setNotification({ type: 'error', message: 'Password must be at least 5 characters long.' });
      return;
    }

    setIsSettingCustom(true);
    try {
      const res = await fetch('/api/admin/reset-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: selectedStaffForCustom.email,
          requesterEmail: currentUser?.email,
          newPassword: customPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `Password for ${selectedStaffForCustom.fullName} set successfully.`,
        });
        setSelectedStaffForCustom(null);
        setCustomPasswordInput('');
        fetchStaffPasswordList();
        if (onStaffUpdated) onStaffUpdated();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to set custom password.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Error setting custom password.' });
    } finally {
      setIsSettingCustom(false);
    }
  };

  // Handle Reset All Staff Passwords to 1234
  const handleResetAllPasswords = async () => {
    setIsResettingAll(true);
    try {
      const res = await fetch('/api/admin/reset-all-passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser?.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `All ${data.count} staff passwords have been reset to default: 1234!`,
        });
        setShowResetAllConfirm(false);
        fetchStaffPasswordList();
        if (onStaffUpdated) onStaffUpdated();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to reset all staff passwords.',
        });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Network error resetting passwords.' });
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {isRTL ? 'ސްޓާފުންގެ ޕާސްވޯޑް މެނޭޖްމަންޓް' : 'Staff Password Management'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRTL
                  ? 'އަޙްމަދު މުޖުތަބާ (ahmed.mujthaba@fmagoodhooschool.edu.mv) • ސުޕަރ އެޑްމިން'
                  : 'Authorized Super Admin: Ahmed Mujthaba (ahmed.mujthaba@fmagoodhooschool.edu.mv)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-3 text-xs font-semibold flex items-center justify-between border-b ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sub-Header Actions: Reset All Staff Passwords & Filters */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetAllConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-xs transition cursor-pointer hover:shadow-rose-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isRTL ? 'ހުރިހާ ސްޓާފުންގެ ޕާސްވޯޑް 1234 އަށް ރީސެޓްކުރޭ' : 'RESET ALL STAFF PASSWORDS TO 1234'}</span>
            </button>

            <button
              type="button"
              onClick={fetchStaffPasswordList}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Status */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                All ({staffList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DEFAULT')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'DEFAULT' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Default 1234 ({staffList.filter((s) => !s.hasCustomPassword).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CUSTOM')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'CUSTOM' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Custom ({staffList.filter((s) => s.hasCustomPassword).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ސްޓާފް / އީމެއިލް ހޯދާ...' : 'Search staff or email...'}
                className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-500" />
              <span>Loading staff directory...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center p-12 text-slate-500 text-xs">
              No staff members found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Staff ID</th>
                    <th className="py-2.5 px-3">Official Email (Username)</th>
                    <th className="py-2.5 px-3">Designation / Role</th>
                    <th className="py-2.5 px-3 text-center">Password Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{staff.fullName}</span>
                          {staff.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        {staff.fullNameDhivehi && (
                          <div className="text-[11px] text-slate-500 font-thaana">
                            {staff.fullNameDhivehi}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">
                        {staff.staffId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-teal-800">
                          <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{staff.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{staff.designation}</div>
                        <div className="text-[10px] text-slate-400">{staff.department}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {staff.hasCustomPassword ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            <Lock className="w-3 h-3 text-blue-600" />
                            <span>Custom Password</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Default: 1234</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResetSingleToDefault(staff)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                            title="Reset password to default: 1234"
                          >
                            Reset to 1234
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForCustom(staff);
                              setCustomPasswordInput('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold transition cursor-pointer"
                            title="Set custom temporary password"
                          >
                            Set Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>
              {isRTL
                ? 'ހުރިހާ ޕާސްވޯޑް ބަދަލުކުރުމާއި ރީސެޓްކުރުމުގެ ހަރަކާތްތައް އޮޑިޓް ލޮގުގައި ރައްކާކުރެވެއެވެ.'
                : 'All staff password resets are securely recorded in the tamper-evident school audit trail.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Reset ALL Passwords */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Reset ALL Staff Passwords?
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Action requires Super Admin confirmation
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will reset the password of <strong>all {staffList.length} staff members</strong> back to the default password: <code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono font-bold">1234</code>.
              Staff will be able to log in using their email and <strong>1234</strong>.
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800 mb-5">
              Confirming as: <strong>{currentUser?.email}</strong> (Super Admin)
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetAllConfirm(false)}
                disabled={isResettingAll}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllPasswords}
                disabled={isResettingAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                {isResettingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting All...</span>
                  </>
                ) : (
                  <span>YES, RESET ALL TO 1234</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Set Custom Password for Individual Staff */}
      {selectedStaffForCustom && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Set Custom Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffForCustom(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-700">
              <div className="font-extrabold text-slate-900">{selectedStaffForCustom.fullName}</div>
              <div className="text-[11px] text-teal-700 font-mono mt-0.5">{selectedStaffForCustom.email}</div>
              <div className="text-[11px] text-slate-500">{selectedStaffForCustom.designation}</div>
            </div>

            <form onSubmit={handleSaveCustomPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (Minimum 5 characters)
                </label>
                <div className="relative">
                  <input
                    type={showCustomPassText ? 'text' : 'password'}
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="Enter new secure password (min. 5 characters)"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    minLength={5}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomPassText(!showCustomPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCustomPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForCustom(null)}
                  disabled={isSettingCustom}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingCustom}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {isSettingCustom ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
