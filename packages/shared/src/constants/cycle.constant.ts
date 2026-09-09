export const CycleStatus = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export type CycleStatusValue = (typeof CycleStatus)[keyof typeof CycleStatus];

export const CYCLE_NAME_MAX = 80;

export const DEFAULT_CYCLE_STATUS = CycleStatus.UPCOMING;

const CYCLE_STATUS_VALUES = new Set<string>(Object.values(CycleStatus));

export function isCycleStatus(value: string): value is CycleStatusValue {
  return CYCLE_STATUS_VALUES.has(value);
}
