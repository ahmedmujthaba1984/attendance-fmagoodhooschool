import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Globe,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Search,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Key,
  Users,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';
import { DEFAULT_STAFF, getStaffLocalPassword, setStaffLocalPassword } from '../data/fallbackData';

interface MobileLoginViewProps {
  staffList: User[];
  currentUser: User | null;
  onLogin: (user: User) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const MobileLoginView: React.FC<MobileLoginViewProps> = ({
  staffList,
  currentUser,
  onLogin,
  onClose,
  isModal = false,
}) => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();

  // Primary Login Form State
  const [emailInput, setEmailInput] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('moe_last_staff_email') || '';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(() => {
    return localStorage.getItem('moe_remember_device') !== 'false';
  });

  // Staff Quick-Select Directory Modal
  const [showDirectoryPicker, setShowDirectoryPicker] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHERS' | 'LEADERSHIP' | 'ADMIN_SUPPORT'>('ALL');

  // Self-Service Reset Password Modal
  const [showSelfResetModal, setShowSelfResetModal] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetNewPass, setResetNewPass] = useState<string>('');
  const [resetConfirmPass, setResetConfirmPass] = useState<string>('');
  const [resetShowPass, setResetShowPass] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Filtered staff for quick-select directory (with bundled fallback)
  const filteredDirectory = useMemo(() => {
    const sourceList = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;
    return sourceList.filter((s) => {
      const des = (s.designation || '').toLowerCase();
      const isTeacher = s.role === 'TEACHER' || des.includes('teacher');
      const isLeadership = s.role === 'ADMIN' || des.includes('leading') || des.includes('principal') || des.includes('administration');
      const isSupport = !isTeacher && !isLeadership;

      if (roleFilter === 'TEACHERS' && !isTeacher) return false;
      if (roleFilter === 'LEADERSHIP' && !isLeadership) return false;
      if (roleFilter === 'ADMIN_SUPPORT' && !isSupport) return false;

      if (!directorySearch.trim()) return true;
      const q = directorySearch.toLowerCase().trim();
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.fullNameDhivehi && s.fullNameDhivehi.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.staffId && s.staffId.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    });
  }, [staffList, directorySearch, roleFilter]);

  // Handle Login Submission (with resilient offline/Vercel fallback)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = emailInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail) {
      setErrorMessage(
        isRTL
          ? 'ސްޓާފް އީމެއިލް ނުވަތަ ޔޫޒަރނޭމް ލިޔުއްވާ.'
          : 'Please enter your official staff email or username.'
      );
      return;
    }

    if (!cleanPass) {
      setErrorMessage(
        isRTL
          ? 'ޕާސްވޯޑް ލިޔުއްވާ. ޑީފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.'
          : 'Please enter your password. Default password for all staff is 1234.'
      );
      return;
    }

    setIsLoading(true);
    let loginSucceeded = false;
    let loggedInUser: User | null = null;

    // 1. Try server-side authentication first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPass,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          loginSucceeded = true;
          loggedInUser = data.user;
        } else if (res.status === 401 || res.status === 404 || data.error) {
          // Explicit credential error from server
          setErrorMessage(
            data.error ||
              (isRTL
                ? 'ޕާސްވޯޑް ރަނގަޅެއް ނޫން. ޑީފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.'
                : 'Incorrect credentials. Default password is 1234.')
          );
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Server unreachable, offline, or static host (e.g. Vercel)
    }

    // 2. Resilient Client-Side / Offline Authentication Fallback
    if (!loginSucceeded) {
      const allStaff = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;
      const inputId = cleanEmail.toLowerCase();
      const matched = allStaff.find((s) => {
        const sEmail = (s.email || '').toLowerCase().trim();
        const sStaffId = (s.staffId || '').toLowerCase().trim();
        const sUsername = (s.username || '').toLowerCase().trim();
        const sId = (s.id || '').toLowerCase().trim();
        return (
          sEmail === inputId ||
          sStaffId === inputId ||
          sUsername === inputId ||
          sId === inputId ||
          sEmail.split('@')[0] === inputId
        );
      });

      if (!matched) {
        setErrorMessage(
          isRTL
            ? `މި އީމެއިލް ("${cleanEmail}") ގެ ސްޓާފް އެކައުންޓެއް ނުފެނުނު. ސުކޫލްގެ ރަސްމީ އީމެއިލް ޖައްސަވާ ނުވަތަ ޑައިރެކްޓަރީން ނަންގަވާ.`
            : `Staff account not found for "${cleanEmail}". Please check your email or select from directory.`
        );
        setIsLoading(false);
        return;
      }

      // Verify Password (check localStorage custom passwords -> bundled JSON -> default 1234)
      const correctPass = getStaffLocalPassword(matched.email || cleanEmail);
      if (cleanPass !== correctPass && cleanPass !== '1234') {
        setErrorMessage(
          isRTL
            ? 'ޕާސްވޯޑް ރަނގަޅެއް ނޫން. ޑީފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.'
            : 'Incorrect password. Default password for all staff is 1234.'
        );
        setIsLoading(false);
        return;
      }

      // Successful Client-side Authentication
      loginSucceeded = true;
      loggedInUser = {
        ...matched,
        isSuperAdmin: Boolean(
          matched.isSuperAdmin ||
          matched.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv'
        ),
      };
    }

    if (loginSucceeded && loggedInUser) {
      setSuccessMessage(
        isRTL
          ? `${loggedInUser.fullNameDhivehi || loggedInUser.fullName} މަރުޙަބާ!`
          : `Welcome, ${loggedInUser.fullName}!`
      );

      // Store active session in localStorage
      if (rememberDevice) {
        localStorage.setItem('moe_last_staff_email', cleanEmail);
        localStorage.setItem('moe_active_user_id', loggedInUser.id);
        localStorage.setItem('moe_portal_logged_in', 'true');
        localStorage.setItem('moe_logged_in_user', JSON.stringify(loggedInUser));
      }

      setTimeout(() => {
        onLogin(loggedInUser!);
      }, 400);
    } else {
      setErrorMessage(
        isRTL
          ? 'ޕާސްވޯޑް ރަނގަޅެއް ނޫން. ޑީފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.'
          : 'Incorrect credentials. Default password is 1234.'
      );
    }

    setIsLoading(false);
  };

  // Handle Self-Service Password Reset
  const handleSelfResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanEmail = resetEmail.trim();
    const newPass = resetNewPass.trim();

    if (!cleanEmail) {
      setResetError(isRTL ? 'ސްޓާފް އީމެއިލް ލިޔުއްވާ.' : 'Staff email is required.');
      return;
    }

    if (newPass.length < 4) {
      setResetError(isRTL ? 'ޕާސްވޯޑުގައި މަދުވެގެން 4 އަކުރު ހުންނަންވާނެއެވެ.' : 'Password must be at least 4 characters long.');
      return;
    }

    if (newPass !== resetConfirmPass.trim()) {
      setResetError(isRTL ? 'ދެ ޕާސްވޯޑު ދިމައެއް ނުވޭ.' : 'Passwords do not match.');
      return;
    }

    setResetLoading(true);
    let resetSucceeded = false;

    try {
      const res = await fetch('/api/auth/self-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          newPassword: newPass,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          resetSucceeded = true;
        } else if (data.error) {
          setResetError(data.error);
          setResetLoading(false);
          return;
        }
      }
    } catch {
      // Server unreachable, offline, or static host
    }

    // Client-side / Offline fallback password reset
    if (!resetSucceeded) {
      const allStaff = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;
      const staffExists = allStaff.some(
        (s) => (s.email || '').toLowerCase().trim() === cleanEmail.toLowerCase()
      );

      if (!staffExists) {
        setResetError(
          isRTL
            ? `މި އީމެއިލް ("${cleanEmail}") ގެ ސްޓާފް އެކައުންޓެއް ނުފެނުނު.`
            : `Staff account not found for "${cleanEmail}". Verify your school email.`
        );
        setResetLoading(false);
        return;
      }

      setStaffLocalPassword(cleanEmail, newPass);
      resetSucceeded = true;
    }

    if (resetSucceeded) {
      setResetSuccess(
        isRTL
          ? 'ޕާސްވޯޑް ކާމިޔާބުކަމާއެކު ރީސެޓްކުރެވިއްޖެ! މިހާރު ލޮގިން ވެވޭނެއެވެ.'
          : 'Password successfully reset! You can now log in with your new password.'
      );
      setEmailInput(cleanEmail);
      setPasswordInput(newPass);
      setTimeout(() => {
        setShowSelfResetModal(false);
        setResetSuccess(null);
      }, 1500);
    } else {
      setResetError('Connection error resetting password.');
    }
    setResetLoading(false);
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden ${
        isRTL ? 'font-thaana' : 'font-sans'
      }`}
    >
      {/* Background Ambience / Subtle Ocean Glow */}
      <div className="absolute inset-0 bg-radial from-teal-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Top Mobile App Bar */}
      <div className="relative z-10 px-4 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{isRTL ? 'ފ. މަގޫދޫ ސްކޫލް' : 'F. Magoodhoo School'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-900/80 text-teal-300 font-mono border border-teal-700/60">
                SCH-F02
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isRTL ? 'ހާޒިރީ އަދި މެނޭޖްމަންޓް ޕޯޓަލް' : 'Attendance & School Portal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{language === 'en' ? 'ދިވެހި' : 'English'}</span>
          </button>

          {/* Optional Close button if rendered as modal */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container - Optimized for Smartphone and Desktop */}
      <div className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Ministry Badge & Island School Verification */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-medium mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isRTL ? 'މިނިސްޓްރީ އޮފް އެޑިޔުކޭޝަން • ރަސްމީ ޕޯޓަލް' : 'Ministry of Education • Official Portal'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isRTL ? 'ސްޓާފް ލޮގިން' : 'Staff Portal Login'}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {isRTL
              ? 'ޕޯޓަލް ބޭނުންކުރުމަށް ސްޓާފް އީމެއިލް އަދި ޕާސްވޯޑް ބޭނުންކުރައްވާ.'
              : 'Every staff member must sign in to mark attendance and manage student records.'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* Default Password Hint Banner */}
          <div className="mb-5 p-3 rounded-2xl bg-teal-950/60 border border-teal-800/60 flex items-start gap-2.5 text-xs text-teal-200">
            <Key className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-teal-300">
                {isRTL ? 'ޑީފޯލްޓް ޕާސްވޯޑް: 1234' : 'Default Password for All Staff: 1234'}
              </div>
              <div className="text-[11px] text-teal-300/80 mt-0.5">
                {isRTL
                  ? 'ޔޫޒަރނޭމަކީ ސްކޫލްގެ ރަސްމީ އީމެއިލް އެވެ. އަމިއްލައަށްވެސް ޕާސްވޯޑް ބަދަލުކުރެވޭނެއެވެ.'
                  : 'Username is your official school email. You can reset or change your password anytime.'}
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Staff Email (Username) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isRTL ? 'ސްޓާފް އީމެއިލް (ޔޫޒަރނޭމް)' : 'Staff Email (Username)'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDirectoryPicker(true)}
                  className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>{isRTL ? 'ޑައިރެކްޓަރީން ނަން ނަންގަވާ' : 'Select from Directory'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@fmagoodhooschool.edu.mv"
                  required
                  autoFocus
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isRTL ? 'ޕާސްވޯޑް' : 'Password'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(emailInput);
                    setShowSelfResetModal(true);
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-teal-300 transition cursor-pointer"
                >
                  {isRTL ? 'ޕާސްވޯޑް ހަނދާންނެތުނީ؟' : 'Forgot / Reset Password?'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={isRTL ? 'ޕާސްވޯޑް ލިޔުއްވާ (ޑީފޯލްޓް: 1234)' : 'Enter password (Default: 1234)'}
                  required
                  className="w-full pl-3.5 pr-10 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Device Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => {
                    setRememberDevice(e.target.checked);
                    localStorage.setItem('moe_remember_device', String(e.target.checked));
                  }}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                />
                <span>{isRTL ? 'މި ޑިވައިސްގައި ސޭވްކޮށްފައި ބަހައްޓާ' : 'Remember this device'}</span>
              </label>

              {/* Quick Fill Default 1234 Button */}
              <button
                type="button"
                onClick={() => setPasswordInput('1234')}
                className="text-[11px] font-bold text-teal-400/90 hover:text-teal-300 underline cursor-pointer"
              >
                {isRTL ? '1234 ފުރާލާ' : 'Fill default (1234)'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRTL ? 'ކަށަވަރުކުރަނީ...' : 'Verifying credentials...'}</span>
                </>
              ) : (
                <>
                  <span>{isRTL ? 'ޕޯޓަލަށް ވަންނަވާ' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Super Admin Notice Card */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isRTL ? 'ސުޕަރ އެޑްމިން' : 'Super Admin Password Control'}</span>
            </div>
            <span>
              {isRTL
                ? 'އަޙްމަދު މުޖުތަބާ (ahmed.mujthaba@fmagoodhooschool.edu.mv) އަށް ހުރިހާ ސްޓާފުންގެ ޕާސްވޯޑް ރީސެޓްކުރުމުގެ ބާރު ލިބިފައިވެއެވެ.'
                : 'Ahmed Mujthaba (ahmed.mujthaba@fmagoodhooschool.edu.mv) can reset any staff member password from the Super Admin panel.'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Island Info */}
      <div className="relative z-10 py-3 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950/80">
        <span>F. Magoodhoo School • Faafu Atoll, Maldives • 2026 Academic Portal</span>
      </div>

      {/* Staff Directory Quick-Select Modal */}
      {showDirectoryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isRTL ? 'ސްޓާފް ޑައިރެކްޓަރީ (46)' : 'Staff Directory (46 Members)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? 'އީމެއިލް އޮޓޯ-ފިލް ކުރުމަށް ނަން ނަންގަވާ' : 'Select your name to auto-fill your email address'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectoryPicker(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder={isRTL ? 'ނަން ނުވަތަ އީމެއިލް ހޯދާ...' : 'Search staff by name, email, designation...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold text-slate-400">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    roleFilter === 'ALL' ? 'bg-teal-600 text-white font-bold' : 'hover:bg-slate-800'
                  }`}
                >
                  All ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('TEACHERS')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    roleFilter === 'TEACHERS' ? 'bg-teal-600 text-white font-bold' : 'hover:bg-slate-800'
                  }`}
                >
                  Teachers
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('LEADERSHIP')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    roleFilter === 'LEADERSHIP' ? 'bg-teal-600 text-white font-bold' : 'hover:bg-slate-800'
                  }`}
                >
                  Leadership & Admin
                </button>
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/60">
              {filteredDirectory.map((staff) => {
                const isSuperAdmin = staff.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv';
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      setEmailInput(staff.email || `${staff.id}@fmagoodhooschool.edu.mv`);
                      setShowDirectoryPicker(false);
                      if (!passwordInput) {
                        setPasswordInput('1234');
                      }
                    }}
                    className="w-full p-3 text-left hover:bg-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.fullName ? staff.fullName.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{isRTL ? staff.fullNameDhivehi || staff.fullName : staff.fullName}</span>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-teal-400 font-mono mt-0.5">
                          {staff.email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {staff.designation} • {staff.staffId}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-teal-600 text-[11px] font-bold text-slate-300 group-hover:text-white shrink-0 transition">
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Self-Service Reset Password Modal */}
      {showSelfResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isRTL ? 'އަމިއްލައަށް ޕާސްވޯޑް ރީސެޓްކުރުން' : 'Self-Service Password Reset'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? 'ކޮންމެ ސްޓާފަކަށްވެސް އަމިއްލައަށް ރީސެޓްކުރެވޭނެ' : 'Staff can reset their password on their own'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSelfResetModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSelfResetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {isRTL ? 'ސްޓާފް އީމެއިލް' : 'Staff School Email'}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@fmagoodhooschool.edu.mv"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {isRTL ? 'އާ ޕާސްވޯޑް (މަދުވެގެން 4 އަކުރު)' : 'New Password (min. 4 characters)'}
                </label>
                <div className="relative">
                  <input
                    type={resetShowPass ? 'text' : 'password'}
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="Enter new password (e.g. 1234 or custom)"
                    required
                    minLength={4}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setResetShowPass(!resetShowPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {resetShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {isRTL ? 'އާ ޕާސްވޯޑް ކަށަވަރުކުރޭ' : 'Confirm New Password'}
                </label>
                <input
                  type={resetShowPass ? 'text' : 'password'}
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  minLength={4}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSelfResetModal(false)}
                  disabled={resetLoading}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save & Update Password</span>
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
