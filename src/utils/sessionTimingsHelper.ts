import { SchoolSessionTimings, SessionTimingConfig, TemporarySessionOverride } from '../types';

export interface EffectiveSessionTiming {
  morning: SessionTimingConfig;
  afternoon: SessionTimingConfig;
  isTemporary: boolean;
  override?: TemporarySessionOverride;
}

export function getEffectiveSessionTimings(
  timings: SchoolSessionTimings,
  dateStr: string
): EffectiveSessionTiming {
  const normalMorning =
    timings.normal?.morning ||
    timings.morning || {
      startTime: '07:45',
      endTime: '10:15',
      label: 'Morning Session',
      labelDhivehi: 'ހެނދުނުގެ ސެޝަން',
    };

  const normalAfternoon =
    timings.normal?.afternoon ||
    timings.afternoon || {
      startTime: '10:45',
      endTime: '13:15',
      label: 'Afternoon Session',
      labelDhivehi: 'މެންދުރުފަހުގެ ސެޝަން',
    };

  if (timings.temporaryOverrides && Array.isArray(timings.temporaryOverrides) && timings.temporaryOverrides.length > 0) {
    const match = timings.temporaryOverrides.find((ov) => {
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
