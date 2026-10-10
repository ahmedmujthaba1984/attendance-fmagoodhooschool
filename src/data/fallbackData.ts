import rawStaff from '../../server/magoodhooStaff.json';
import rawStudents from '../../server/magoodhooStudents.json';
import rawCalendar from '../../server/calendarData.json';
import rawTermDates from '../../server/termDates.json';
import rawPasswords from '../../server/staffPasswords.json';
import { User, Student, AcademicCalendarDay, TermDurationConfig } from '../types';
import { safeLocalStorage, safeJsonParse } from '../utils/browserUtils';

const LOCAL_PASSWORDS_KEY = 'moe_staff_custom_passwords';

// Check if staff has set a custom password (different from default '1234')
export function hasStaffLocalCustomPassword(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check client local storage custom passwords
  try {
    const custom = safeJsonParse<Record<string, string>>(safeLocalStorage.getItem(LOCAL_PASSWORDS_KEY), {});
    if (custom[cleanEmail] && String(custom[cleanEmail]).trim() !== '1234') {
      return true;
    }
  } catch {}

  // 2. Check bundled passwords
  try {
    const found = (rawPasswords as any[]).find(
      (p) => (p.email || '').toLowerCase().trim() === cleanEmail
    );
    if (found && found.hasCustomPassword && String(found.password).trim() !== '1234') {
      return true;
    }
  } catch {}

  return false;
}

// Staff Enrichment matching server logic
export const DEFAULT_STAFF: User[] = (rawStaff as any[]).map((s) => {
  const email = (s.email || '').toLowerCase().trim();
  const isSuperAdmin = Boolean(
    s.isSuperAdmin ||
    email === 'ahmed.mujthaba@fmagoodhooschool.edu.mv'
  );
  const userHasCustom = hasStaffLocalCustomPassword(email);

  return {
    ...s,
    isSuperAdmin,
    role: s.role || (isSuperAdmin ? 'ADMIN' : 'TEACHER'),
    hasCustomPassword: userHasCustom,
    mustChangePassword: !userHasCustom,
  } as User;
});

export const DEFAULT_STUDENTS: Student[] = rawStudents as Student[];

export const DEFAULT_CALENDAR: AcademicCalendarDay[] = rawCalendar as AcademicCalendarDay[];

export const DEFAULT_TERM_DATES: TermDurationConfig[] = rawTermDates as TermDurationConfig[];

// Get staff password (check localStorage custom passwords -> bundled passwords -> default '1234')
export function getStaffLocalPassword(email: string): string {
  if (!email) return '1234';
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check client local storage
  try {
    const custom = safeJsonParse<Record<string, string>>(safeLocalStorage.getItem(LOCAL_PASSWORDS_KEY), {});
    if (custom[cleanEmail]) {
      return String(custom[cleanEmail]).trim();
    }
  } catch {}

  // 2. Check bundled passwords
  try {
    const found = (rawPasswords as any[]).find(
      (p) => (p.email || '').toLowerCase().trim() === cleanEmail
    );
    if (found && found.password) {
      return String(found.password).trim();
    }
  } catch {}

  // 3. Fallback default
  return '1234';
}

// Set staff custom password in localStorage
export function setStaffLocalPassword(email: string, newPass: string): void {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const custom = safeJsonParse<Record<string, string>>(safeLocalStorage.getItem(LOCAL_PASSWORDS_KEY), {});
    custom[cleanEmail] = String(newPass).trim();
    safeLocalStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(custom));
  } catch {}
}
