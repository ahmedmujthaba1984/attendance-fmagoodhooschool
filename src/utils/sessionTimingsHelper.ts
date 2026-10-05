import { SchoolSessionTimings, SessionTimingConfig, TemporarySessionOverride, SessionType } from '../types';

export interface EffectiveSessionTiming {
  morning: SessionTimingConfig;
  afternoon: SessionTimingConfig;
  isTemporary: boolean;
  override?: TemporarySessionOverride;
}

export function getEffectiveSessionTimings(
  timings?: SchoolSessionTimings | null,
  dateStr?: string
): EffectiveSessionTiming {
  const safeTimings = timings || ({} as SchoolSessionTimings);
  const normalMorning =
    safeTimings.normal?.morning ||
    safeTimings.morning || {
      startTime: '07:45',
      endTime: '10:15',
      label: 'Morning Session',
      labelDhivehi: 'ހެނދުނުގެ ސެޝަން',
    };

  const normalAfternoon =
    safeTimings.normal?.afternoon ||
    safeTimings.afternoon || {
      startTime: '10:45',
      endTime: '13:15',
      label: 'Afternoon Session',
      labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން',
    };

  if (
    safeTimings.temporaryOverrides &&
    Array.isArray(safeTimings.temporaryOverrides) &&
    safeTimings.temporaryOverrides.length > 0 &&
    dateStr
  ) {
    const match = safeTimings.temporaryOverrides.find((ov) => {
      if (ov.endDate) {
        return dateStr >= ov.date && dateStr <= ov.endDate;
      }
      return ov.date === dateStr;
    });

    if (match) {
      return {
        morning: match.morning || normalMorning,
        afternoon: match.afternoon || normalAfternoon,
        isTemporary: true,
        override: match,
      };
    }
  }

  return {
    morning: normalMorning,
    afternoon: normalAfternoon,
    isTemporary: false,
  };
}

export interface SessionMarkingEligibility {
  allowed: boolean;
  reason?: 'FUTURE_DATE' | 'SESSION_NOT_STARTED';
  message: string;
  messageDhivehi: string;
  startTime?: string;
  currentTime: string;
  currentDate: string;
}

export function getMaldivesNow(): { dateStr: string; timeStr: string; now: Date } {
  // Maldives local time is UTC+5 (no Daylight Saving Time)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const maldivesDate = new Date(utc + 5 * 3600000);
  const year = maldivesDate.getUTCFullYear();
  const month = String(maldivesDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(maldivesDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const hours = String(maldivesDate.getUTCHours()).padStart(2, '0');
  const minutes = String(maldivesDate.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  return { dateStr, timeStr, now: maldivesDate };
}

export function checkSessionMarkingEligibility(
  targetDate: string,
  sessionType: SessionType,
  timings?: SchoolSessionTimings | null,
  customNow?: { dateStr?: string; timeStr?: string }
): SessionMarkingEligibility {
  const current = customNow?.dateStr && customNow?.timeStr
    ? { dateStr: customNow.dateStr, timeStr: customNow.timeStr }
    : getMaldivesNow();

  const curDateStr = current.dateStr;
  const curTimeStr = current.timeStr;

  // 1. Future date check: Cannot mark before date arrives
  if (targetDate > curDateStr) {
    return {
      allowed: false,
      reason: 'FUTURE_DATE',
      message: `Cannot mark attendance for a future date (${targetDate}). Today is ${curDateStr}. Attendance can only be marked on or after the scheduled date once the session starts.`,
      messageDhivehi: `ކުރިއަށް އޮތް ތާރީޚަކަށް (${targetDate}) ހާޒިރީއެއް ނުޖެހޭނެއެވެ. މިއަދަކީ ${curDateStr} އެވެ. ހާޒިރީ ޖެހޭނީ އެ ދުވަހަކު ސެޝަން ފެށުމަށްފަހުގައެވެ.`,
      currentTime: curTimeStr,
      currentDate: curDateStr,
    };
  }

  // 2. Today: check if session start time has passed
  if (targetDate === curDateStr) {
    const effective = getEffectiveSessionTimings(timings, targetDate);
    const sessionStart = sessionType === 'MORNING_BEFORE_BREAK'
      ? effective.morning.startTime
      : effective.afternoon.startTime;

    if (curTimeStr < sessionStart) {
      const isMorning = sessionType === 'MORNING_BEFORE_BREAK';
      const sessionLabel = isMorning ? 'Morning Session (Before Break)' : 'Afternoon Session (Post-Break)';
      const sessionLabelDv = isMorning ? 'ހެނދުނުގެ ސެޝަން' : 'މެންދުރުފަހުގެ ސެޝަން';
      return {
        allowed: false,
        reason: 'SESSION_NOT_STARTED',
        message: `${sessionLabel} roll call has not started yet. Attendance can only be marked after the session starts at ${sessionStart}. (Current Maldives time: ${curTimeStr})`,
        messageDhivehi: `${sessionLabelDv} އަދި ނުފެށެއެވެ. ހާޒިރީ ޖެހޭނީ ސެޝަން ފެށޭ ގަޑި (${sessionStart}) އަށްފަހުގައެވެ. (މިހާރުގެ ވަގުތު: ${curTimeStr})`,
        startTime: sessionStart,
        currentTime: curTimeStr,
        currentDate: curDateStr,
      };
    }
  }

  return {
    allowed: true,
    message: '',
    messageDhivehi: '',
    currentTime: curTimeStr,
    currentDate: curDateStr,
  };
}
