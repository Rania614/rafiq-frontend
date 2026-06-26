import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import type { Task } from './types';

export const BOARD_SCROLL_CONTAINER_CLASS = 'min-w-0 w-full max-w-full overflow-x-auto pb-4';

export const BOARD_COLUMNS_CLASS = 'inline-flex gap-4 lg:gap-6';

export const SHADOW_SM = 'shadow-[0_1px_2px_0px_#0000000d]';
export const BOARD_SHADOW = 'shadow-[0_2px_8px_0_#00000005]';

export const GRADIENT_BUTTON_BASE = `inline-flex items-center justify-center rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white ${SHADOW_SM}`;

export const NEW_TASK_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} gap-2 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95`;

export const SEARCH_INPUT_CLASS =
  'w-full rounded-sm border-0 bg-[#E0E8FF] py-3 pr-4 pl-10 text-sm text-[#434654] placeholder:text-[#737685]/70 transition-colors focus:outline focus:outline-1 focus:outline-[#003D9B]';

export const VIEW_SELECT_CLASS =
  'appearance-none rounded-sm border-0 bg-white py-3 pr-8 pl-10 text-sm font-medium text-[#041B3C] focus:outline focus:outline-1 focus:outline-[#003D9B]';

export const FILTER_BUTTON_CLASS =
  'flex size-11 items-center justify-center rounded-sm bg-white text-[#434654] transition-colors hover:bg-[#F1F3FF] hover:text-[#003D9B]';

export const TABLE_HEAD_CLASS =
  'px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.6px] text-[#434654]';

export const TABLE_CELL_CLASS = 'px-6 py-4.5 text-sm leading-4';

export const PAGINATION_BUTTON_CLASS =
  'flex size-9 items-center justify-center rounded-xs border border-[#C3C6D6] text-sm font-bold text-[#434654] transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  TO_DO: 'bg-[#6B7280]',
  IN_PROGRESS: 'bg-[#0052CC]',
  BLOCKED: 'bg-[#BA1A1A]',
  IN_REVIEW: 'bg-[#041B3C]',
  READY_FOR_QA: 'bg-[#4F5F7B]',
  REOPENED: 'bg-[#CDDDFF]',
  READY_FOR_PRODUCTION: 'bg-[#FFB300]',
  DONE: 'bg-[#005235]',
};

export const STATUS_COUNT_BADGE: Partial<Record<TaskStatus, string>> = {
  BLOCKED: 'bg-[#FFDBD6] text-[#BA1A1A]',
};

export const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  TO_DO: 'bg-[#6B7280]/10 text-[#434654]',
  IN_PROGRESS: 'bg-[#0052CC]/10 text-[#0052CC]',
  BLOCKED: 'bg-[#FFDBD6] text-[#BA1A1A]',
  IN_REVIEW: 'bg-[#041B3C]/10 text-[#434654]',
  READY_FOR_QA: 'bg-[#4F5F7B]/10 text-[#4F5F7B]',
  REOPENED: 'bg-[#CDDDFF] text-[#434654]',
  READY_FOR_PRODUCTION: 'bg-[#FFB300]/30 text-[#434654]',
  DONE: 'bg-[#82F9BE] text-[#005235]',
};

export function createEmptyTasksByStatus(): Record<TaskStatus, Task[]> {
  return TASK_STATUSES.reduce(
    (accumulator, status) => {
      accumulator[status] = [];
      return accumulator;
    },
    {} as Record<TaskStatus, Task[]>
  );
}
