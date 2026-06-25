import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getProjectTasksNewHref } from '@/utils/project';
import type { TaskStatus } from '@/utils/tasks';
import { STATUS_COUNT_BADGE, STATUS_DOT_COLORS } from '../constants';
import { formatStatusLabel } from '../helpers';
import type { Task } from '../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  projectId: string;
  status: TaskStatus;
  tasks: Task[];
}

export default function TaskColumn({ projectId, status, tasks }: TaskColumnProps) {
  const countBadgeClass = STATUS_COUNT_BADGE[status] ?? 'bg-[#E8EDFF] text-[#434654]';

  return (
    <div className="flex min-w-64 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS_DOT_COLORS[status]}`} />
          <span className="text-[11px] font-semibold text-[#64748B]">
            {formatStatusLabel(status)}
          </span>
          <span
            className={`flex size-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold ${countBadgeClass}`}
          >
            {tasks.length}
          </span>
        </div>
        <Link
          href={getProjectTasksNewHref(projectId, status)}
          className="rounded-sm p-0.5 text-[#434654] transition-colors hover:bg-[#F1F3FF] hover:text-[#003D9B]"
          aria-label={`Add task to ${formatStatusLabel(status)}`}
        >
          <Plus size={14} />
        </Link>
      </div>

      <Link
        href={getProjectTasksNewHref(projectId, status)}
        className="flex w-full items-center justify-center gap-2 rounded-sm border-2 border-dashed border-[#C3C6D6]/40 p-4 text-[11px] font-bold tracking-[0.6px] text-[#434654]/60 uppercase transition-colors hover:border-[#003D9B]/30 hover:bg-[#F1F3FF] hover:text-[#003D9B]"
      >
        <Plus size={16} className="text-[#434654]/60" />
        Add New Task
      </Link>

      <div className="flex flex-col gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
