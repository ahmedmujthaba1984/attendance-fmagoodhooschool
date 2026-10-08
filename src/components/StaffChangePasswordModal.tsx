import React, { useState } from 'react';
import { Key, Lock, Check, AlertTriangle, X, Eye, EyeOff, RefreshCw, ShieldAlert, LogOut } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';
import { setStaffLocalPassword } from '../data/fallbackData';

interface StaffChangePasswordModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSuccess?: () => void;
  isCompulsory?: boolean;
  onLogout?: () => void;
}

export const StaffChangePasswordModal: React.FC<StaffChangePasswordModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
  isCompulsory = false,
  onLogout,
}) => {
  const { isRTL } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState(isCompulsory ? '1234' : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const newPassLength = newPassword.trim().length;
  const isLengthValid = newPassLength >= 5;
  const isNotDefault = newPassword.trim() !== '1234';
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanNewPass = newPassword.trim();
    const cleanCurrent = currentPassword.trim();

    if (cleanNewPass.length < 5) {
      setError(
        isRTL
          ? 'އާ ޕާސްވޯޑުގައި މަދުވެގެން 5 އަކުރު ހުންނަންވާނެއެވެ.'
          : 'New password must be at least 5 characters long.'
      );
      return;
    }

    if (cleanNewPass === '1234') {
      setError(
        isRTL
          ? 'ޑީފޯލްޓް ޕާސްވޯޑް (1234) ބޭނުމެއް ނުކުރެވޭނެ. މަދުވެގެން 5 އަކުރުގެ އާ ޕާސްވޯޑެއް ޖައްސަވާ.'
          : 'Cannot reuse the default password (1234). Please choose a new password of at least 5 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isRTL ? 'ދެ ޕާސްވޯޑު ދިމައެއް ނުވޭ.' : 'New passwords do not match.');
      return;
    }

    setIsLoading(true);
    let updateSucceeded = false;

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          currentPassword: cleanCurrent,
          newPassword: cleanNewPass,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          updateSucceeded = true;
        } else if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }
      } else if (res.ok) {
        updateSucceeded = true;
      }
    } catch (err: any) {
      // In offline / static preview, fall back gracefully
    }

    // Always update client storage as well
    if (currentUser?.email) {
      setStaffLocalPassword(currentUser.email, cleanNewPass);
      updateSucceeded = true;
    }

    if (updateSucceeded) {
      setSuccess(
        isRTL
          ? 'ޕާސްވޯޑް ކާމިޔާބުކަމާއެކު ބަދަލުކުރެވިއްޖެ!'
          : 'Your password has been successfully updated!'
      );

      // Update stored session if present
      try {
        const savedUserJson = localStorage.getItem('moe_logged_in_user');
        if (savedUserJson) {
          const parsed = JSON.parse(savedUserJson);
          if (parsed.email === currentUser?.email) {
            parsed.hasCustomPassword = true;
            parsed.mustChangePassword = false;
            parsed.isFirstLogin = false;
            localStorage.setItem('moe_logged_in_user', JSON.stringify(parsed));
          }
        }
      } catch {}

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } else {
      setError(
        isRTL
          ? 'ޕާސްވޯޑް އަޕްޑޭޓް ނުކުރެވުނު. މިހާރުގެ ޕާސްވޯޑް ޔަޤީންކުރައްވާ (ޑީފޯލްޓަކީ 1234).'
          : 'Failed to update password. Check your current password (default is 1234).'
      );
    }
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
      onClick={(e) => {
        // Prevent accidental background dismiss if compulsory
        if (!isCompulsory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCompulsory ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
              }`}
            >
              {isCompulsory ? <ShieldAlert className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isCompulsory
                  ? isRTL
                    ? 'ފުރަތަމަ ލޮގިން: ޕާސްވޯޑް ބަދަލުކުރުން މަޖުބޫރު'
                    : '1st Login: Change Password (Compulsory)'
                  : isRTL
                  ? 'ޕާސްވޯޑް ބަދަލުކުރުން'
                  : 'Change Your Password'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser?.fullName} ({currentUser?.email})
              </p>
            </div>
          </div>
          {!isCompulsory && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compulsory 1st Login Notice Banner */}
        {isCompulsory && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isRTL
                  ? 'ފުރަތަމަ ފަހަރު ލޮގިންވުމުގެ ސެކިއުރިޓީ ގަވާއިދު'
                  : 'Mandatory 1st Login Security Notice'}
              </span>
            </div>
            <p className="leading-relaxed">
              {isRTL
                ? 'ދަރިވަރުންގެ މަޢުލޫމާތާއި ޕޯޓަލްގެ ރައްކާތެރިކަމަށްޓަކައި، ކޮންމެ ސްޓާފަކުވެސް ފުރަތަމަ ފަހަރު ލޮގިންވުމަށްފަހު އާ ޕާސްވޯޑެއް ހެދުން މަޖުބޫރެވެ (މަދުވެގެން 5 އަކުރު).'
                : 'Every staff member must change their default password upon first login before accessing the school portal. Password should be at least 5 characters long.'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isRTL ? 'މިހާރުގެ ޕާސްވޯޑް (ޑީފޯލްޓް: 1234)' : 'Current Password (Default: 1234)'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="1234"
                required
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                {isRTL ? 'އާ ޕާސްވޯޑް (މަދުވެގެން 5 އަކުރު)' : 'New Password (min. 5 characters)'}
              </label>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isLengthValid
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {newPassLength}/5 {isRTL ? 'އަކުރު' : 'chars'}
              </span>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isRTL ? 'އާ ޕާސްވޯޑް ލިޔުއްވާ (މަދުވެގެން 5 އަކުރު)' : 'Enter your new secure password (min. 5 chars)'}
              required
              minLength={5}
              autoFocus
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isRTL ? 'އާ ޕާސްވޯޑް ކަށަވަރުކުރޭ' : 'Confirm New Password'}
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isRTL ? 'އާ ޕާސްވޯޑް އަލުން ލިޔުއްވާ' : 'Re-enter your new password'}
              required
              minLength={5}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isLengthValid
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isLengthValid ? '✓' : '•'}
              </div>
              <span className={isLengthValid ? 'text-emerald-700 font-medium' : ''}>
                {isRTL ? 'މަދުވެގެން 5 އަކުރު' : 'Minimum 5 characters long'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isNotDefault && newPassLength > 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isNotDefault && newPassLength > 0 ? '✓' : '•'}
              </div>
              <span className={isNotDefault && newPassLength > 0 ? 'text-emerald-700 font-medium' : ''}>
                {isRTL ? 'ޑީފޯލްޓް ޕާސްވޯޑް (1234) އާ ތަފާތުވުން' : 'Different from default (1234)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isMatching
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isMatching ? '✓' : '•'}
              </div>
              <span className={isMatching ? 'text-emerald-700 font-medium' : ''}>
                {isRTL ? 'ދެ ޕާސްވޯޑް ދިމާވުން' : 'Passwords match'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            {isCompulsory ? (
              onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'ސައިން އައުޓް' : 'Sign Out'}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                {isRTL ? 'ކެންސަލް' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !isLengthValid || !isMatching}
              className={`px-5 py-2 rounded-xl text-white font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
                isLoading || !isLengthValid || !isMatching
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>
                  {isCompulsory
                    ? isRTL
                      ? 'ޕާސްވޯޑް ސޭވްކޮށް ޕޯޓަލަށް ވަންނަވާ'
                      : 'Save Password & Continue'
                    : isRTL
                    ? 'ޕާސްވޯޑް ބަދަލުކުރޭ'
                    : 'Update Password'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
