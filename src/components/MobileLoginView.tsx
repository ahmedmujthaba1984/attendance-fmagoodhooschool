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
  ShieldAlert,
  LogOut,
  Zap,
  Smartphone,
  Sparkles,
  Star,
  Check,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { User, GradeLevel } from '../types';
import { safeLocalStorage, safeJsonParse } from '../utils/browserUtils';
import {
  DEFAULT_STAFF,
  getStaffLocalPassword,
  setStaffLocalPassword,
  hasStaffLocalCustomPassword,
} from '../data/fallbackData';

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

  // Mode: Quick Teacher 1-Tap vs Manual Email/Password
  const [loginMethod, setLoginMethod] = useState<'quick_teacher' | 'credentials'>('quick_teacher');
  const [quickGradeFilter, setQuickGradeFilter] = useState<'ALL' | 'PRIMARY' | 'SECONDARY' | 'LEADERSHIP'>('ALL');

  // Staff Pool (from props or robust fallback)
  const allStaff = useMemo(() => {
    return staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;
  }, [staffList]);

  // Selected Teacher for Quick Tap
  const [selectedQuickTeacher, setSelectedQuickTeacher] = useState<User | null>(() => {
    if (currentUser) return currentUser;
    const lastEmail = safeLocalStorage.getItem('moe_last_staff_email');
    if (lastEmail) {
      const found = allStaff.find((s) => s.email?.toLowerCase() === lastEmail.toLowerCase());
      if (found) return found;
    }
    // Default to Leading Teacher / Ahmed Mujthaba or first assigned teacher
    return (
      allStaff.find(
        (s) =>
          s.isSuperAdmin ||
          s.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv'
      ) ||
      allStaff.find((s) => Boolean(s.assignedGrade)) ||
      allStaff[0] ||
      null
    );
  });

  // Primary Login Form State
  const [emailInput, setEmailInput] = useState<string>(() => {
    return (
      currentUser?.email ||
      selectedQuickTeacher?.email ||
      safeLocalStorage.getItem('moe_last_staff_email') ||
      ''
    );
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showCustomPasswordForQuick, setShowCustomPasswordForQuick] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(() => {
    return safeLocalStorage.getItem('moe_remember_device') !== 'false';
  });
  const [enableRapidRollCallPrivilege, setEnableRapidRollCallPrivilege] = useState<boolean>(() => {
    return safeLocalStorage.getItem('moe_rapid_roll_call_privileged') !== 'false';
  });

  // Staff Quick-Select Directory Modal
  const [showDirectoryPicker, setShowDirectoryPicker] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHERS' | 'LEADERSHIP' | 'ADMIN_SUPPORT'>('ALL');

  // Compulsory First Login Password Change State
  const [compulsoryChangeUser, setCompulsoryChangeUser] = useState<User | null>(null);
  const [compulsoryCurrentPassword, setCompulsoryCurrentPassword] = useState<string>('1234');
  const [compulsoryNewPass, setCompulsoryNewPass] = useState<string>('');
  const [compulsoryConfirmPass, setCompulsoryConfirmPass] = useState<string>('');
  const [compulsoryShowPass, setCompulsoryShowPass] = useState<boolean>(false);
  const [compulsoryLoading, setCompulsoryLoading] = useState<boolean>(false);
  const [compulsoryError, setCompulsoryError] = useState<string | null>(null);
  const [compulsorySuccess, setCompulsorySuccess] = useState<string | null>(null);

  // Self-Service Reset Password Modal
  const [showSelfResetModal, setShowSelfResetModal] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetNewPass, setResetNewPass] = useState<string>('');
  const [resetConfirmPass, setResetConfirmPass] = useState<string>('');
  const [resetShowPass, setResetShowPass] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Prominent Class Teachers list for Quick Tap
  const quickClassTeachers = useMemo(() => {
    return allStaff.filter((s) => {
      const hasGrade = Boolean(s.assignedGrade);
      const isLeading = Boolean(
        s.isSuperAdmin ||
        (s.designation || '').toLowerCase().includes('leading') ||
        s.email?.toLowerCase().includes('mujthaba')
      );
      if (quickGradeFilter === 'PRIMARY') {
        const g = s.assignedGrade || '';
        return ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].includes(g);
      }
      if (quickGradeFilter === 'SECONDARY') {
        const g = s.assignedGrade || '';
        return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(g);
      }
      if (quickGradeFilter === 'LEADERSHIP') {
        return isLeading;
      }
      return hasGrade || isLeading;
    });
  }, [allStaff, quickGradeFilter]);

  // Filtered staff for quick-select directory modal
  const filteredDirectory = useMemo(() => {
    return allStaff.filter((s) => {
      const des = (s.designation || '').toLowerCase();
      const isTeacher = s.role === 'TEACHER' || des.includes('teacher');
      const isLeadership =
        s.role === 'ADMIN' ||
        des.includes('leading') ||
        des.includes('principal') ||
        des.includes('administration');
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
  }, [allStaff, directorySearch, roleFilter]);

  // Execute Core Login
  const executeLogin = async (targetEmail: string, targetPass: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = targetEmail.trim();
    const cleanPass = targetPass.trim();

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
          loginViaMobile: true,
          hasRapidRollCallPrivilege: enableRapidRollCallPrivilege,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          loginSucceeded = true;
          loggedInUser = data.user;
        } else if (res.status === 401) {
          const isCustom = data.hasChangedFromDefault || hasStaffLocalCustomPassword(cleanEmail);
          setErrorMessage(
            data.error ||
              (isCustom
                ? (isRTL ? 'ޕާސްވޯޑް ނުބައި. ޑިފޯލްޓް ޕާސްވޯޑް ވަނީ ބަދަލުކުރެވިފައި.' : 'Incorrect password. The default password has change.')
                : (isRTL ? 'ޕާސްވޯޑް ނުބައި. ހުރިހާ ސްޓާފުންގެ ޑިފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.' : 'Incorrect password. The default password for all staff is 1234.'))
          );
          setIsLoading(false);
          return;
        } else if (res.status >= 500) {
          console.warn('Server error during login, falling back to local staff directory:', data.error);
        }
      }
    } catch {
      // Server unreachable, offline fallback
    }

    // 2. Resilient Client-Side / Offline Authentication Fallback
    if (!loginSucceeded) {
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

      const correctPass = getStaffLocalPassword(matched.email || cleanEmail);
      if (cleanPass !== correctPass) {
        const isCustom = hasStaffLocalCustomPassword(matched.email || cleanEmail) || correctPass !== '1234';
        setErrorMessage(
          isCustom
            ? (isRTL ? 'ޕާސްވޯޑް ނުބައި. ޑިފޯލްޓް ޕާސްވޯޑް ވަނީ ބަދަލުކުރެވިފައި.' : 'Incorrect password. The default password has change.')
            : (isRTL ? 'ޕާސްވޯޑް ނުބައި. ހުރިހާ ސްޓާފުންގެ ޑިފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.' : 'Incorrect password. The default password for all staff is 1234.')
        );
        setIsLoading(false);
        return;
      }

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
      const staffEmail = loggedInUser.email || cleanEmail;
      const hasCustom = Boolean(
        (loggedInUser.hasCustomPassword && loggedInUser.mustChangePassword === false) ||
        hasStaffLocalCustomPassword(staffEmail)
      );
      const isDefaultPass = cleanPass === '1234';
      const mustChange = Boolean(
        loggedInUser.mustChangePassword ||
        !hasCustom ||
        isDefaultPass
      );

      // Compulsory 1st login password change: if no custom password yet or logged in with 1234, block entry until changed!
      if (mustChange) {
        setCompulsoryChangeUser(loggedInUser);
        setCompulsoryCurrentPassword(cleanPass || '1234');
        setCompulsoryNewPass('');
        setCompulsoryConfirmPass('');
        setCompulsoryError(null);
        setCompulsorySuccess(null);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        isRTL
          ? `${loggedInUser.fullNameDhivehi || loggedInUser.fullName} މަރުޙަބާ!`
          : `Welcome, ${loggedInUser.fullName}!`
      );

      const userToLogin: User = {
        ...loggedInUser,
        hasRapidRollCallPrivilege: enableRapidRollCallPrivilege,
        loginViaMobile: true,
      };

      if (enableRapidRollCallPrivilege) {
        safeLocalStorage.setItem('moe_rapid_roll_call_privileged', 'true');
        safeLocalStorage.setItem('moe_default_roll_call_mode', 'rapid');
      }
      safeLocalStorage.setItem('moe_login_source', 'mobile');

      if (rememberDevice) {
        safeLocalStorage.setItem('moe_last_staff_email', cleanEmail);
        safeLocalStorage.setItem('moe_active_user_id', userToLogin.id);
        safeLocalStorage.setItem('moe_portal_logged_in', 'true');
        safeLocalStorage.setItem('moe_logged_in_user', JSON.stringify(userToLogin));
      }

      setTimeout(() => {
        onLogin(userToLogin);
      }, 400);
    } else {
      const isCustom = hasStaffLocalCustomPassword(cleanEmail);
      setErrorMessage(
        isCustom
          ? (isRTL ? 'ޕާސްވޯޑް ނުބައި. ޑިފޯލްޓް ޕާސްވޯޑް ވަނީ ބަދަލުކުރެވިފައި.' : 'Incorrect password. The default password has change.')
          : (isRTL ? 'ޕާސްވޯޑް ނުބައި. ހުރިހާ ސްޓާފުންގެ ޑިފޯލްޓް ޕާސްވޯޑަކީ 1234 އެވެ.' : 'Incorrect password. The default password for all staff is 1234.')
      );
    }

    setIsLoading(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(emailInput, passwordInput);
  };

  const handleQuickTeacherLogin = (teacher: User) => {
    const targetEmail = teacher.email || `${teacher.id}@fmagoodhooschool.edu.mv`;
    const targetPass = showCustomPasswordForQuick && passwordInput.trim() ? passwordInput.trim() : '1234';
    executeLogin(targetEmail, targetPass);
  };

  // Handle Compulsory First Login Password Change
  const handleCompulsorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compulsoryChangeUser) return;
    setCompulsoryError(null);
    setCompulsorySuccess(null);

    const cleanNewPass = compulsoryNewPass.trim();
    const cleanCurrent = compulsoryCurrentPassword.trim();

    if (cleanNewPass.length < 5) {
      setCompulsoryError(
        isRTL
          ? 'އާ ޕާސްވޯޑުގައި މަދުވެގެން 5 އަކުރު ހުންނަންވާނެއެވެ.'
          : 'Password should be minimum 5 characters long.'
      );
      return;
    }

    if (cleanNewPass === '1234') {
      setCompulsoryError(
        isRTL
          ? 'ޑީފޯލްޓް ޕާސްވޯޑް (1234) ބޭނުމެއް ނުކުރެވޭނެ. މަދުވެގެން 5 އަކުރުގެ އާ ޕާސްވޯޑެއް ޖައްސަވާ.'
          : 'Cannot reuse the default password (1234). Please choose a new password of at least 5 characters.'
      );
      return;
    }

    if (cleanNewPass !== compulsoryConfirmPass.trim()) {
      setCompulsoryError(
        isRTL ? 'ދެ ޕާސްވޯޑު ދިމައެއް ނުވޭ.' : 'New passwords do not match.'
      );
      return;
    }

    setCompulsoryLoading(true);
    let changeSucceeded = false;

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: compulsoryChangeUser.email,
          currentPassword: cleanCurrent,
          newPassword: cleanNewPass,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          changeSucceeded = true;
        } else if (data.error) {
          setCompulsoryError(data.error);
          setCompulsoryLoading(false);
          return;
        }
      } else if (res.ok) {
        changeSucceeded = true;
      }
    } catch {
      // Offline fallback
    }

    if (compulsoryChangeUser.email) {
      setStaffLocalPassword(compulsoryChangeUser.email, cleanNewPass);
      changeSucceeded = true;
    }

    if (changeSucceeded) {
      const updatedUser: User = {
        ...compulsoryChangeUser,
        hasCustomPassword: true,
        mustChangePassword: false,
        isFirstLogin: false,
      };

      setCompulsorySuccess(
        isRTL
          ? 'ޕާސްވޯޑް ކާމިޔާބުކަމާއެކު ބަދަލުކުރެވިއްޖެ! ޕޯޓަލަށް ވަންނަނީ...'
          : 'Password updated successfully! Entering portal...'
      );

      const finalUser: User = {
        ...updatedUser,
        hasRapidRollCallPrivilege: enableRapidRollCallPrivilege,
        loginViaMobile: true,
      };

      if (enableRapidRollCallPrivilege) {
        safeLocalStorage.setItem('moe_rapid_roll_call_privileged', 'true');
        safeLocalStorage.setItem('moe_default_roll_call_mode', 'rapid');
      }
      safeLocalStorage.setItem('moe_login_source', 'mobile');

      if (rememberDevice && finalUser.email) {
        safeLocalStorage.setItem('moe_last_staff_email', finalUser.email);
        safeLocalStorage.setItem('moe_active_user_id', finalUser.id);
        safeLocalStorage.setItem('moe_portal_logged_in', 'true');
        safeLocalStorage.setItem('moe_logged_in_user', JSON.stringify(finalUser));
      }

      setTimeout(() => {
        onLogin(finalUser);
      }, 700);
    } else {
      setCompulsoryError(
        isRTL
          ? 'ޕާސްވޯޑް އަޕްޑޭޓް ނުކުރެވުނު. އަލުން މަސައްކަތްކުރައްވާ.'
          : 'Failed to update password. Please try again.'
      );
    }
    setCompulsoryLoading(false);
  };

  // Handle Request Password Reset to Super Admin (Ahmed Mujthaba)
  const [resetNote, setResetNote] = useState<string>('');

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanEmail = resetEmail.trim();

    if (!cleanEmail) {
      setResetError(isRTL ? 'ސްޓާފް އީމެއިލް ލިޔުއްވާ ނުވަތަ އިޚްތިޔާރުކުރައްވާ.' : 'Staff email is required.');
      return;
    }

    const matchedStaff = allStaff.find(
      (s) =>
        (s.email || '').toLowerCase().trim() === cleanEmail.toLowerCase() ||
        (s.staffId || '').toLowerCase().trim() === cleanEmail.toLowerCase() ||
        s.fullName.toLowerCase() === cleanEmail.toLowerCase()
    );

    setResetLoading(true);

    const localReq = {
      id: `reset-req-${Date.now()}`,
      staffId: matchedStaff?.staffId || matchedStaff?.id || 'staff',
      fullName: matchedStaff?.fullName || cleanEmail,
      fullNameDhivehi: matchedStaff?.fullNameDhivehi,
      email: matchedStaff?.email || cleanEmail,
      designation: matchedStaff?.designation || 'Staff',
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
      note: resetNote.trim() || 'Staff requested password reset to default 1234',
    };

    try {
      const stored = safeJsonParse<any[]>(safeLocalStorage.getItem('moe_password_reset_requests'), []);
      stored.unshift(localReq);
      safeLocalStorage.setItem('moe_password_reset_requests', JSON.stringify(stored));
    } catch {}

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: matchedStaff?.email || cleanEmail,
          staffId: matchedStaff?.staffId || matchedStaff?.id,
          fullName: matchedStaff?.fullName || cleanEmail,
          note: resetNote.trim() || 'Staff requested password reset to default 1234',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setResetSuccess(
          isRTL
            ? 'ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަށް ޕާސްވޯޑް ޑިފޯލްޓް 1234 އަށް ރީސެޓްކުރުމަށް އެދި ރިކުއެސްޓް ފޮނުވިއްޖެއެވެ. ސުޕަރ އެޑްމިން (7984844) ރީސެޓްކުރުމުން 1234 ޖައްސަވައިގެން ލޮގިންވެވަޑައިގަންނަވާ.'
            : 'Password reset request submitted to Super Admin (Ahmed Mujthaba)! Once approved, your password will be set back to default: 1234. You can also contact him directly at 7984844.'
        );
      } else {
        setResetSuccess(
          isRTL
            ? 'ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަށް ޕާސްވޯޑް ރީސެޓްކުރުމަށް އެދި ރިކުއެސްޓް ފޮނުވިއްޖެއެވެ. ސުޕަރ އެޑްމިން (7984844) ރީސެޓްކުރުމުން 1234 ޖައްސަވައިގެން ލޮގިންވެވަޑައިގަންނަވާ.'
            : 'Password reset request submitted to Super Admin (Ahmed Mujthaba). Once approved, your password will be reset to default: 1234.'
        );
      }
    } catch {
      // Local fallback
      setResetSuccess(
        isRTL
          ? 'ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަށް ޕާސްވޯޑް ރީސެޓްކުރުމަށް އެދި ރިކުއެސްޓް ފޮނުވިއްޖެއެވެ. ސުޕަރ އެޑްމިން (7984844) ރީސެޓްކުރުމުން 1234 ޖައްސަވައިގެން ލޮގިންވެވަޑައިގަންނަވާ.'
          : 'Password reset request logged for Super Admin (Ahmed Mujthaba). Please contact Super Admin at 7984844 to reset your password to 1234.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between relative overflow-x-hidden ${
        isRTL ? 'font-thaana' : 'font-sans'
      }`}
    >
      {/* Top Mobile App Bar */}
      <div className="sticky top-0 z-20 px-3.5 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-teal-600 via-sky-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span className="truncate">{isRTL ? 'ފ. މަގޫދޫ ސްކޫލް' : 'F. Magoodhoo School'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-800 font-mono font-bold border border-teal-200 shrink-0">
                SCH-F02
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              {isRTL ? 'ދަރިވަރުންގެ ހާޒިރީ ޕޯޓަލް' : 'Student Attendance Portal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            type="button"
            id="mobile-login-lang-btn"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-2xs"
            title="Toggle Language (English / Dhivehi)"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'en' ? 'ދިވެހި' : 'English'}</span>
          </button>

          {/* Optional Close button if rendered as modal */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container - Ultra clean, friendly & thumb-optimized */}
      <div className="relative z-10 flex-1 max-w-xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-8 flex flex-col justify-center">
        {/* Ministry Badge & Island School Verification */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-bold mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isRTL ? 'މަގޫދޫ ސްކޫލް - ހާޒިރީ ޕޯޓަލް' : 'Magoodhoo School - Attendance Portal'}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {compulsoryChangeUser
              ? isRTL
                ? 'ފުރަތަމަ ލޮގިން: ޕާސްވޯޑް ބަދަލުކުރުން'
                : '1st Login: Set New Password'
              : isRTL
              ? 'ސްޓާފް ހާޒިރީ ލޮގިން'
              : 'Teacher & Staff Login'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {compulsoryChangeUser
              ? isRTL
                ? 'ދަރިވަރުންގެ މަޢުލޫމާތުގެ ރައްކާތެރިކަމަށްޓަކައި، ކޮންމެ ސްޓާފަކުވެސް ފުރަތަމަ ފަހަރު އާ ޕާސްވޯޑެއް ހެދުން މަޖުބޫރެވެ.'
                : 'For data security, every staff member must change their password on first login.'
              : isRTL
              ? 'އަތްމަތީ ފޯނުން 1-ޓެޕުން ޓީޗަރު ޚިޔާރުކުރައްވާ ނުވަތަ އީމެއިލުން ވަންނަވާ.'
              : 'Tap your name for 1-touch mobile sign-in or use your school email.'}
          </p>
        </div>

        {compulsoryChangeUser ? (
          /* Compulsory 1st Login Password Change Card */
          <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 sm:p-7 shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs text-amber-900 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{isRTL ? 'ފުރަތަމަ ލޮގިން: ޕާސްވޯޑް ބަދަލުކުރުން މަޖުބޫރު' : '1st Login: Compulsory Password Change'}</span>
            </div>

            {/* Staff Info Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-black text-sm shrink-0 border border-teal-200">
                {compulsoryChangeUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-slate-900 text-sm truncate">
                  {isRTL && compulsoryChangeUser.fullNameDhivehi ? compulsoryChangeUser.fullNameDhivehi : compulsoryChangeUser.fullName}
                </div>
                <div className="text-xs text-teal-700 font-mono truncate">
                  {compulsoryChangeUser.email}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {compulsoryChangeUser.designation} {compulsoryChangeUser.assignedGrade && `• ★ ${compulsoryChangeUser.assignedGrade}`}
                </div>
              </div>
            </div>

            {/* Instruction Warning Box */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
              {isRTL
                ? 'ދަރިވަރުންގެ މަޢުލޫމާތާއި ޕޯޓަލްގެ ރައްކާތެރިކަމަށްޓަކައި، ކޮންމެ ސްޓާފަކުވެސް ފުރަތަމަ ފަހަރު ލޮގިންވުމަށްފަހު އާ ޕާސްވޯޑެއް ހެދުން މަޖުބޫރެވެ (މަދުވެގެން 5 އަކުރު).'
                : 'For student data security, set your personalized password upon first login (minimum 5 characters).'}
            </div>

            {/* Feedback Messages */}
            {compulsoryError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{compulsoryError}</span>
              </div>
            )}

            {compulsorySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{compulsorySuccess}</span>
              </div>
            )}

            <form onSubmit={handleCompulsorySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRTL ? 'މިހާރުގެ ޕާސްވޯޑް (ޑީފޯލްޓް: 1234)' : 'Current Password (Default: 1234)'}
                </label>
                <div className="relative">
                  <input
                    type={compulsoryShowPass ? 'text' : 'password'}
                    value={compulsoryCurrentPassword}
                    onChange={(e) => setCompulsoryCurrentPassword(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCompulsoryShowPass(!compulsoryShowPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {compulsoryShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isRTL ? 'އާ ޕާސްވޯޑް (މަދުވެގެން 5 އަކުރު)' : 'New Password (min. 5 characters)'}
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      compulsoryNewPass.trim().length >= 5
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {compulsoryNewPass.trim().length}/5 {isRTL ? 'އަކުރު' : 'chars'}
                  </span>
                </div>
                <input
                  type={compulsoryShowPass ? 'text' : 'password'}
                  value={compulsoryNewPass}
                  onChange={(e) => setCompulsoryNewPass(e.target.value)}
                  placeholder={isRTL ? 'އާ ޕާސްވޯޑް ލިޔުއްވާ (މަދުވެގެން 5 އަކުރު)' : 'Enter new password (min. 5 chars)'}
                  required
                  minLength={5}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRTL ? 'އާ ޕާސްވޯޑް ކަށަވަރުކުރޭ' : 'Confirm New Password'}
                </label>
                <input
                  type={compulsoryShowPass ? 'text' : 'password'}
                  value={compulsoryConfirmPass}
                  onChange={(e) => setCompulsoryConfirmPass(e.target.value)}
                  placeholder={isRTL ? 'އާ ޕާސްވޯޑް އަލުން ލިޔުއްވާ' : 'Re-enter new password'}
                  required
                  minLength={5}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCompulsoryChangeUser(null);
                    setPasswordInput('');
                    setCompulsoryError(null);
                  }}
                  disabled={compulsoryLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'ކެންސަލް' : 'Cancel'}</span>
                </button>
                <button
                  type="submit"
                  disabled={
                    compulsoryLoading ||
                    compulsoryNewPass.trim().length < 5 ||
                    compulsoryNewPass !== compulsoryConfirmPass
                  }
                  className={`flex-2 py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    compulsoryLoading ||
                    compulsoryNewPass.trim().length < 5 ||
                    compulsoryNewPass !== compulsoryConfirmPass
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white font-black active:scale-98'
                  }`}
                >
                  {compulsoryLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isRTL ? 'ސޭވްކުރަނީ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{isRTL ? 'ސޭވްކޮށް ޕޯޓަލަށް ވަންނަވާ' : 'Save Password & Enter'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Main Clean Login Card */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            {/* Top Method Switcher: Quick Teacher 1-Tap vs Manual Credentials */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-black">
              <button
                type="button"
                onClick={() => setLoginMethod('quick_teacher')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'quick_teacher'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{isRTL ? 'ހަލުވި ޓީޗަރު 1-ޓެޕް' : 'Quick Teacher Sign-In'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('credentials')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'credentials'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>{isRTL ? 'އީމެއިލް / ޕާސްވޯޑް' : 'Email & Password'}</span>
              </button>
            </div>

            {/* Error & Success Feedback Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-1.5 font-bold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
                {errorMessage.includes('Incorrect password') && (
                  <div className="pt-1.5 border-t border-rose-200/60 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-rose-600 font-medium">
                      {isRTL ? 'ޕާސްވޯޑް ހަނދާންނެތުނީ؟' : 'Forgot your password?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedQuickTeacher || allStaff.find(s => s.email?.toLowerCase() === emailInput.toLowerCase());
                        if (target?.email) setResetEmail(target.email);
                        setShowSelfResetModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[11px] transition cursor-pointer"
                    >
                      <Key className="w-3 h-3 text-rose-700" />
                      <span>{isRTL ? 'ސުޕަރ އެޑްމިން އަތުން ރީސެޓްކުރުމަށް އެދުމަށް' : 'Request Reset from Super Admin'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* METHOD 1: QUICK TEACHER 1-TAP (Instant touch login on mobile) */}
            {loginMethod === 'quick_teacher' && (
              <div className="space-y-3.5">
                {/* Filter Pills for Quick Teachers */}
                <div className="flex items-center justify-between gap-1.5 pb-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setQuickGradeFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                        quickGradeFilter === 'ALL'
                          ? 'bg-teal-600 text-white font-black shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isRTL ? 'ހުރިހާ ކްލާހެއް' : 'All Classes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickGradeFilter('PRIMARY')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                        quickGradeFilter === 'PRIMARY'
                          ? 'bg-teal-600 text-white font-black shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isRTL ? 'ޕްރައިމަރީ (LKG-Gr5)' : 'LKG - Gr 5'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickGradeFilter('SECONDARY')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                        quickGradeFilter === 'SECONDARY'
                          ? 'bg-teal-600 text-white font-black shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isRTL ? 'ސެކަންޑަރީ (Gr6-10)' : 'Gr 6 - 10'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickGradeFilter('LEADERSHIP')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                        quickGradeFilter === 'LEADERSHIP'
                          ? 'bg-teal-600 text-white font-black shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isRTL ? 'ލީޑަރޝިޕް' : 'Leadership'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDirectoryPicker(true)}
                    className="text-[11px] font-black text-teal-700 hover:text-teal-800 flex items-center gap-1 shrink-0 cursor-pointer ml-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isRTL ? '46 ސްޓާފުން' : 'All 46'}</span>
                  </button>
                </div>

                {/* Quick Teachers List (Grid / Thumb-friendly tiles) */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 max-h-56 sm:max-h-64 overflow-y-auto p-0.5 scrollbar-thin">
                  {quickClassTeachers.map((teacher) => {
                    const isSelected = selectedQuickTeacher?.id === teacher.id;
                    const isLeader = Boolean(
                      teacher.isSuperAdmin ||
                      (teacher.designation || '').toLowerCase().includes('leading') ||
                      teacher.email?.toLowerCase().includes('mujthaba')
                    );

                    return (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuickTeacher(teacher);
                          setEmailInput(teacher.email || `${teacher.id}@fmagoodhooschool.edu.mv`);
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer relative min-h-[56px] active:scale-98 ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-400/30 shadow-xs'
                            : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : isLeader
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {teacher.fullName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {isRTL && teacher.fullNameDhivehi ? teacher.fullNameDhivehi : teacher.fullName}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-auto" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {teacher.assignedGrade ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                                ★ {teacher.assignedGrade}
                              </span>
                            ) : isLeader ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                                ★ Leading
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 truncate">
                                {teacher.designation || 'Teacher'}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Teacher Action Box */}
                {selectedQuickTeacher && (
                  <div className="p-3.5 rounded-2xl bg-linear-to-r from-teal-50/80 via-emerald-50/60 to-cyan-50/80 border border-teal-200 shadow-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {selectedQuickTeacher.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">
                              {isRTL && selectedQuickTeacher.fullNameDhivehi
                                ? selectedQuickTeacher.fullNameDhivehi
                                : selectedQuickTeacher.fullName}
                            </span>
                            {selectedQuickTeacher.assignedGrade && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-black text-[10px] shrink-0">
                                {selectedQuickTeacher.assignedGrade}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {selectedQuickTeacher.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCustomPasswordForQuick(!showCustomPasswordForQuick)}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer shrink-0"
                      >
                        {showCustomPasswordForQuick
                          ? (isRTL ? 'ޑީފޯލްޓް (1234)' : 'Use Default 1234')
                          : (isRTL ? 'އަމިއްލަ ޕާސްވޯޑް' : 'Custom Password?')}
                      </button>
                    </div>

                    {/* Optional Custom Password Input for Quick Mode */}
                    {showCustomPasswordForQuick && (
                      <div className="relative pt-1 animate-in fade-in">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder={isRTL ? 'ޕާސްވޯޑް ލިޔުއްވާ...' : 'Enter your password...'}
                          className="w-full pl-3 pr-10 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {/* Instant 1-Touch Sign In Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickTeacherLogin(selectedQuickTeacher)}
                      className="w-full py-3.5 rounded-xl bg-linear-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isRTL ? 'ވަންނަނީ...' : 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                          <span className="truncate">
                            {isRTL
                              ? `${selectedQuickTeacher.fullNameDhivehi || selectedQuickTeacher.fullName} ގެ ގޮތުގައި ހާޒިރީ ފުރުމަށް ވަންނަވާ`
                              : `Sign In & Mark Attendance as ${selectedQuickTeacher.fullName.split(' ')[0]}`}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* METHOD 2: MANUAL EMAIL & PASSWORD (Standard credentials form) */}
            {loginMethod === 'credentials' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Default Password Hint Banner */}
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-2 text-xs text-teal-900">
                  <Key className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-teal-950">
                      {isRTL ? 'ޑީފޯލްޓް ޕާސްވޯޑް: 1234' : 'Default Password for All Staff: 1234'}
                    </div>
                    <div className="text-[11px] text-teal-800 mt-0.5">
                      {isRTL
                        ? 'ޔޫޒަރނޭމަކީ ސްކޫލްގެ ރަސްމީ އީމެއިލް އެވެ.'
                        : 'Official school email or username. Default password is 1234.'}
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isRTL ? 'ސްޓާފް އީމެއިލް' : 'Staff Email'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDirectoryPicker(true)}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3 h-3" />
                      <span>{isRTL ? 'ޑައިރެކްޓަރީ' : 'Directory'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@fmagoodhooschool.edu.mv"
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isRTL ? 'ޕާސްވޯޑް' : 'Password'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(emailInput);
                        setShowSelfResetModal(true);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-teal-700 cursor-pointer"
                    >
                      {isRTL ? 'ހަނދާންނެތުނީ؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={isRTL ? 'ޕާސްވޯޑް (ޑީފޯލްޓް: 1234)' : 'Password (Default: 1234)'}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick 1234 button */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setPasswordInput('1234')}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                  >
                    {isRTL ? '1234 ފުރާލާ' : 'Fill default (1234)'}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRTL ? 'ވަންނަނީ...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                      <span>{isRTL ? 'ހާޒިރީ ފުރުމަށް ވަންނަވާ' : 'Sign In to Mark Attendance'}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Common Options: Rapid Roll Call & Remember Device */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
                <input
                  type="checkbox"
                  checked={enableRapidRollCallPrivilege}
                  onChange={(e) => {
                    setEnableRapidRollCallPrivilege(e.target.checked);
                    safeLocalStorage.setItem('moe_rapid_roll_call_privileged', String(e.target.checked));
                  }}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold flex items-center gap-1">
                  <span>{isRTL ? 'ހަލުވި ހާޒިރީ (Rapid Roll Call) އިމްތިޔާޒު އެކްޓިވްކުރުން' : 'Enable Mobile Rapid Roll Call (1-tap marking)'}</span>
                  <span className="text-amber-600">⚡</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => {
                    setRememberDevice(e.target.checked);
                    safeLocalStorage.setItem('moe_remember_device', String(e.target.checked));
                  }}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>{isRTL ? 'މި ފޯނުގައި ސޭވްކޮށްފައި ބަހައްޓާ' : 'Remember this mobile device'}</span>
              </label>
            </div>

            {/* Super Admin Notice Card */}
            <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500">
              <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRTL ? 'ސުޕަރ އެޑްމިން' : 'Super Admin Password Control'}</span>
              </div>
              <span>
                {isRTL
                  ? 'އަޙްމަދު މުޖުތަބާ އަށް ހުރިހާ ސްޓާފުންގެ ޕާސްވޯޑް ރީސެޓްކުރުމުގެ ބާރު ލިބިފައިވެއެވެ.'
                  : 'Ahmed Mujthaba can reset any staff member password from the Super Admin panel.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Island Info */}
      <div className="relative z-10 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white/70">
        <span>F. Magoodhoo School • Faafu Atoll, Maldives • 2026 Academic Portal</span>
      </div>

      {/* Staff Directory Quick-Select Modal */}
      {showDirectoryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRTL ? 'ސްޓާފް ޑައިރެކްޓަރީ (46)' : 'Staff Directory (46 Members)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'އޮޓޯ-ފިލް ކުރުމަށް ނަން ނަންގަވާ' : 'Select your name to auto-fill for login'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectoryPicker(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder={isRTL ? 'ނަން ނުވަތަ އީމެއިލް ހޯދާ...' : 'Search staff by name, email, designation...'}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    roleFilter === 'ALL' ? 'bg-teal-600 text-white font-black' : 'hover:bg-slate-200'
                  }`}
                >
                  All ({allStaff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('TEACHERS')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    roleFilter === 'TEACHERS' ? 'bg-teal-600 text-white font-black' : 'hover:bg-slate-200'
                  }`}
                >
                  Teachers
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('LEADERSHIP')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    roleFilter === 'LEADERSHIP' ? 'bg-teal-600 text-white font-black' : 'hover:bg-slate-200'
                  }`}
                >
                  Leadership & Admin
                </button>
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
              {filteredDirectory.map((staff) => {
                const isSuperAdmin = staff.email?.toLowerCase() === 'ahmed.mujthaba@fmagoodhooschool.edu.mv';
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      setEmailInput(staff.email || `${staff.id}@fmagoodhooschool.edu.mv`);
                      setSelectedQuickTeacher(staff);
                      setShowDirectoryPicker(false);
                      if (!passwordInput) {
                        setPasswordInput('1234');
                      }
                    }}
                    className="w-full p-2.5 text-left hover:bg-slate-50 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-xs shrink-0 border border-teal-200">
                        {staff.fullName ? staff.fullName.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{isRTL ? staff.fullNameDhivehi || staff.fullName : staff.fullName}</span>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                              SUPER ADMIN
                            </span>
                          )}
                          {staff.assignedGrade && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
                              ★ {staff.assignedGrade}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-teal-700 font-mono mt-0.5 truncate">
                          {staff.email}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {staff.designation} • {staff.staffId}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-teal-600 text-[11px] font-bold text-slate-700 group-hover:text-white shrink-0 transition">
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Request Password Reset from Super Admin Modal */}
      {showSelfResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRTL ? 'ޕާސްވޯޑް ރީސެޓްކުރުމަށް އެދުމަށް' : 'Request Password Reset'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'ސުޕަރ އެޑްމިން (އަޙްމަދު މުޖުތަބާ) އަތުން ރީސެޓްކުރުން' : 'Super Admin (Ahmed Mujthaba) will reset to 1234'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSelfResetModal(false);
                  setResetSuccess(null);
                  setResetError(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Super Admin Info Card */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-4 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Super Admin: </span>
                <span>Ahmed Mujthaba (Senior School Administration Officer)</span>
                <div className="text-[11px] text-amber-800/90 font-mono mt-0.5">
                  ahmed.mujthaba@fmagoodhooschool.edu.mv • 7984844
                </div>
              </div>
            </div>

            {resetError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-center space-y-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-black text-sm">
                  {isRTL ? 'ރިކުއެސްޓް ކާމިޔާބުކަމާއެކު ފޮނުވިއްޖެ!' : 'Reset Request Submitted!'}
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {resetSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSelfResetModal(false);
                    setResetSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isRTL ? 'ލޮގިން ސްކްރީނަށް އެނބުރިދިޔުމަށް' : 'Return to Login Screen'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRTL ? 'ސްޓާފް އީމެއިލް / ނަން' : 'Select or Enter Your Staff Account'}
                  </label>
                  <select
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  >
                    <option value="">{isRTL ? '-- ސްޓާފެއް އިޚްތިޔާރުކުރައްވާ --' : '-- Choose Staff Member --'}</option>
                    {allStaff.map((s) => (
                      <option key={s.id} value={s.email || `${s.id}@fmagoodhooschool.edu.mv`}>
                        {s.fullName} ({s.designation || s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRTL ? 'ނޯޓް / ސަބަބު (އިޚްތިޔާރީ)' : 'Reason / Note for Super Admin (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={resetNote}
                    onChange={(e) => setResetNote(e.target.value)}
                    placeholder={isRTL ? 'މިސާލަކަށް: ޕާސްވޯޑް ހަނދާންނެތުނީ، 1234 އަށް ރީސެޓްކޮށްދެއްވާ' : 'e.g., Forgot my password, please reset to default 1234'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSelfResetModal(false)}
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                  >
                    {isRTL ? 'ކެންސަލް' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isRTL ? 'ފޮނުވަނީ...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'ރިކުއެސްޓް ފޮނުވާ' : 'Submit Reset Request'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
