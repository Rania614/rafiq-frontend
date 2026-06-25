export const TASK_STATUSES = [
  'TO_DO',
  'IN_PROGRESS',
  'BLOCKED',
  'IN_REVIEW',
  'READY_FOR_QA',
  'REOPENED',
  'READY_FOR_PRODUCTION',
  'DONE',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DEFAULT_TASK_STATUS: TaskStatus = 'TO_DO';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: 'TO DO',
  IN_PROGRESS: 'IN PROGRESS',
  BLOCKED: 'BLOCKED',
  IN_REVIEW: 'IN REVIEW',
  READY_FOR_QA: 'READY FOR QA',
  REOPENED: 'REOPENED',
  READY_FOR_PRODUCTION: 'READY FOR PRODUCTION',
  DONE: 'DONE',
};

export function getTaskStatusLabel(status: string): string {
  if (TASK_STATUSES.includes(status as TaskStatus)) {
    return TASK_STATUS_LABELS[status as TaskStatus];
  }

  return status;
}

export function normalizeTaskStatus(status: string): TaskStatus | null {
  const decoded = decodeURIComponent(status.trim());

  if (TASK_STATUSES.includes(decoded as TaskStatus)) {
    return decoded as TaskStatus;
  }

  const fromLabel = (Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).find(
    ([, label]) => label === decoded
  );
  if (fromLabel) {
    return fromLabel[0];
  }

  const underscored = decoded.replace(/ /g, '_');
  if (TASK_STATUSES.includes(underscored as TaskStatus)) {
    return underscored as TaskStatus;
  }

  return null;
}

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  TO_DO: 'bg-[#94A3B8]',
  IN_PROGRESS: 'bg-[#0046AD]',
  BLOCKED: 'bg-[#D31818]',
  IN_REVIEW: 'bg-[#F59E0B]',
  READY_FOR_QA: 'bg-[#8B5CF6]',
  REOPENED: 'bg-[#EC4899]',
  READY_FOR_PRODUCTION: 'bg-[#10B981]',
  DONE: 'bg-[#64748B]',
};

export function formatTaskCardDate(dateStr?: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  if (taskDate.getTime() === today.getTime()) {
    return 'TODAY';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}
