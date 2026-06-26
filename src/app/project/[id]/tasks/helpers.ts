import { getTaskStatusLabel, TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import { createEmptyTasksByStatus } from './constants';
import type { Task } from './types';

export function formatStatusLabel(status: string): string {
  return getTaskStatusLabel(status);
}

export function formatListDueDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getDueDateStatus(deadline?: string | null) {
  if (!deadline) {
    return { isDueToday: false, isDelayed: false };
  }

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return { isDueToday: false, isDelayed: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  return {
    isDueToday: dueDate.getTime() === today.getTime(),
    isDelayed: dueDate.getTime() < today.getTime(),
  };
}

export function getBoardDueLabel(task: Task): string {
  const { isDueToday, isDelayed } = getDueDateStatus(task.deadline);

  if (!task.deadline) return '--';
  if (isDueToday) return 'Today';
  if (isDelayed) return 'Delayed';

  const date = new Date(task.deadline);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'bg-[#E0E8FF] text-[#003D9B]',
    'bg-[#D7E2FF] text-[#0052CC]',
    'bg-[#CDDDFF] text-[#4F5F7B]',
    'bg-[#E8EDFF] text-[#041B3C]',
  ];

  return colors[Math.abs(hash) % colors.length];
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const tasksByStatus = createEmptyTasksByStatus();
  const seenIds = new Set<string>();

  tasks.forEach((task) => {
    if (!TASK_STATUSES.includes(task.status as TaskStatus)) {
      return;
    }

    if (seenIds.has(task.id)) {
      return;
    }

    seenIds.add(task.id);
    tasksByStatus[task.status as TaskStatus].push(task);
  });

  return tasksByStatus;
}

export function countTasks(tasksByStatus: Record<TaskStatus, Task[]>): number {
  return TASK_STATUSES.reduce((total, status) => total + tasksByStatus[status].length, 0);
}

export function mergeTasksById(existing: Task[], incoming: Task[]): Task[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seenIds = new Set(existing.map((task) => task.id));
  const newTasks = incoming.filter((task) => !seenIds.has(task.id));

  if (newTasks.length === 0) {
    return existing;
  }

  return [...existing, ...newTasks];
}
