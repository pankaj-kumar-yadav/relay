import { DateFormat, formatDate } from '@/constants/date.constant';
import { type CycleStatusValue } from '@relay/shared/constants/cycle.constant';

export {
   CycleStatus,
   CYCLE_NAME_MAX,
   DEFAULT_CYCLE_STATUS,
   isCycleStatus,
   type CycleStatusValue,
} from '@relay/shared/constants/cycle.constant';

export const cycleStatusLabel: Record<CycleStatusValue, string> = {
   upcoming: 'Upcoming',
   active: 'Active',
   completed: 'Completed',
};

export function formatCycleDateRange(cycle: { startsAt: string; endsAt: string }): string {
   return `${formatDate(cycle.startsAt, DateFormat.MONTH_DAY)} → ${formatDate(cycle.endsAt, DateFormat.MONTH_DAY)}`;
}
