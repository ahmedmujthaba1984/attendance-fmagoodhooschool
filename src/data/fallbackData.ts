import rawStaff from '../../server/magoodhooStaff.json';
import rawStudents from '../../server/magoodhooStudents.json';
import rawCalendar from '../../server/calendarData.json';
import rawTermDates from '../../server/termDates.json';
import rawPasswords from '../../server/staffPasswords.json';
import { User, Student, AcademicCalendarDay, TermDurationConfig } from '../types';

// Staff Enrichment matching server logic
export const DEFAULT_STAFF: User[] = (rawStaff as any[]).map((s) => {
  const email = (s.email || '').toLowerCase().trim();
  const isSuperAdmin = Boolean(
    s.isSuperAdmin ||
    email === 'ahmed.mujthaba@fmagoodhooschool.edu.mv'
  );

  return {
    ...s,
    isSuperAdmin,
    role: s.role || (isSuperAdmin ? 'ADMIN' : 'TEACHER'),
  } as User;
});

export const DEFAULT_STUDENTS: Student[] = rawStudents as Student[];

export const DEFAULT_CALENDAR: AcademicCalendarDay[] = rawCalendar as AcademicCalendarDay[];

export const DEFAULT_TERM_DATES: TermDurationConfig[] = rawTermDates as TermDurationConfig[];

const LOCAL_PASSWORDS_KEY = 'moe_staff_custom_passwords';

// Get staff password (check localStorage custom passwords -> bundled passwords -> default '1234')
export function getStaffLocalPassword(email: string): string {
  if (!email) return '1234';
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check client local storage
  try {
    const custom = JSON.parse(localStorage.getItem(LOCAL_PASSWORDS_KEY) || '{}');
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
    const custom = JSON.parse(localStorage.getItem(LOCAL_PASSWORDS_KEY) || '{}');
    custom[cleanEmail] = String(newPass).trim();
    localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(custom));
  } catch {}
}
