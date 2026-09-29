// Academic Weeks Generator for F. Magoodhoo School (Sunday to Thursday Academic Weeks)

export interface AcademicWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD (Sunday)
  endDate: string;   // YYYY-MM-DD (Thursday)
  label: string;     // e.g. "Week 38: 20 Sep 2026 – 24 Sep 2026"
  labelDhivehi: string;
  monthName: string;
  monthNumber: number;
  isCurrent?: boolean;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_DV = [
  'ޖެނުއަރީ', 'ފެބްރުއަރީ', 'މާރިޗު', 'އޭޕްރީލް', 'މެއި', 'ޖޫން',
  'ޖުލައި', 'އޮގަސްޓް', 'ސެޕްޓެމްބަރ', 'އޮކްޓޫބަރ', 'ނޮވެމްބަރ', 'ޑިސެމްބަރ'
];

const MONTH_SHORT_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function generateAcademicWeeks(year: number = 2026): AcademicWeek[] {
  const weeks: AcademicWeek[] = [];
  
  // Find the first Sunday of the given year
  // In 2026, Jan 1 is Thursday, Jan 4 is Sunday
  let current = new Date(Date.UTC(year, 0, 1));
  while (current.getUTCDay() !== 0) {
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let weekNum = 1;

  while (current.getUTCFullYear() === year || (current.getUTCFullYear() === year + 1 && weekNum <= 52)) {
    const sYear = current.getUTCFullYear();
    const sMonth = current.getUTCMonth();
    const sDate = current.getUTCDate();
    const startStr = `${sYear}-${String(sMonth + 1).padStart(2, '0')}-${String(sDate).padStart(2, '0')}`;

    // End date is Thursday (+4 days)
    const end = new Date(current);
    end.setUTCDate(end.getUTCDate() + 4);
    const eYear = end.getUTCFullYear();
    const eMonth = end.getUTCMonth();
    const eDate = end.getUTCDate();
    const endStr = `${eYear}-${String(eMonth + 1).padStart(2, '0')}-${String(eDate).padStart(2, '0')}`;

    // Format labels
    const sFormatted = `${String(sDate).padStart(2, '0')} ${MONTH_SHORT_EN[sMonth]} ${sYear}`;
    const eFormatted = `${String(eDate).padStart(2, '0')} ${MONTH_SHORT_EN[eMonth]} ${eYear}`;
    const label = `Week ${weekNum}: ${sFormatted} – ${eFormatted}`;
    const labelDhivehi = `ހަފްތާ ${weekNum}: ${String(sDate).padStart(2, '0')} ${MONTH_NAMES_DV[sMonth]} – ${String(eDate).padStart(2, '0')} ${MONTH_NAMES_DV[eMonth]}`;

    const isCurrent = todayStr >= startStr && todayStr <= endStr;

    weeks.push({
      weekNumber: weekNum,
      startDate: startStr,
      endDate: endStr,
      label,
      labelDhivehi,
      monthName: MONTH_NAMES_EN[sMonth],
      monthNumber: sMonth + 1,
      isCurrent,
    });

    weekNum++;
    // Advance to next Sunday (+7 days)
    current.setUTCDate(current.getUTCDate() + 7);

    // Stop if we rolled well past the target year
    if (weekNum > 52 && current.getUTCFullYear() > year) {
      break;
    }
  }

  return weeks;
}

export const ALL_ACADEMIC_WEEKS_2026: AcademicWeek[] = generateAcademicWeeks(2026);

// Find the closest or current active school week
export function getCurrentOrLatestSchoolWeek(weeks: AcademicWeek[] = ALL_ACADEMIC_WEEKS_2026): AcademicWeek {
  const current = weeks.find((w) => w.isCurrent);
  if (current) return current;

  const todayStr = new Date().toISOString().slice(0, 10);
  // Find past weeks that have already begun
  const pastWeeks = weeks.filter((w) => w.startDate <= todayStr);
  if (pastWeeks.length > 0) {
    return pastWeeks[pastWeeks.length - 1];
  }
  return weeks[0];
}
