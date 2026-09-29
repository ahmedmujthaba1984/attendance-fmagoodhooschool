import React, { useState } from 'react';
import { Key, Lock, Check, AlertTriangle, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';

interface StaffChangePasswordModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StaffChangePasswordModal: React.FC<StaffChangePasswordModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
}) => {
  const { isRTL } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.trim().length < 4) {
      setError(isRTL ? 'އާ ޕާސްވޯޑުގައި މަދުވެގެން 4 އަކުރު ހުންނަންވާނެއެވެ.' : 'New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isRTL ? 'ދެ ޕާސްވޯޑު ދިމައެއް ނުވޭ.' : 'New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(
          isRTL
            ? 'ޕާސްވޯޑް ކާމިޔާބުކަމާއެކު ބަދަލުކުރެވިއްޖެ!'
            : 'Your password has been successfully updated!'
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update password. Check your current password (default is 1234).');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isRTL ? 'ޕާސްވޯޑް ބަދަލުކުރުން' : 'Change Your Password'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser?.fullName} ({currentUser?.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
            <label className="block font-bold text-slate-700 mb-1">
              {isRTL ? 'އާ ޕާސްވޯޑް (މަދުވެގެން 4 އަކުރު)' : 'New Password (min. 4 characters)'}
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new secure password"
              required
              minLength={4}
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
              placeholder="Re-enter your new password"
              required
              minLength={4}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              {isRTL ? 'ކެންސަލް' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>{isRTL ? 'ޕާސްވޯޑް ބަދަލުކުރޭ' : 'Update Password'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
