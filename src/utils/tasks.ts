export const TASK_STATUSES = [
  'TO DO',
  'IN PROGRESS',
  'BLOCKED',
  'IN REVIEW',
  'READY FOR QA',
  'REOPENED',
  'READY FOR PRODUCTION',
  'DONE',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  'TO DO': 'bg-[#94A3B8]',
  'IN PROGRESS': 'bg-[#0046AD]',
  BLOCKED: 'bg-[#D31818]',
  'IN REVIEW': 'bg-[#F59E0B]',
  'READY FOR QA': 'bg-[#8B5CF6]',
  REOPENED: 'bg-[#EC4899]',
  'READY FOR PRODUCTION': 'bg-[#10B981]',
  DONE: 'bg-[#64748B]',
};

/** Encodes a string value for Supabase PostgREST eq filters (handles spaces). */
export function supabaseEqValue(value: string): string {
  return encodeURIComponent(`"${value.replace(/"/g, '\\"')}"`);
}

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

  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}
