import { MoreVertical } from 'lucide-react';
import { getAvatarLetters } from '@/utils/avatar';
import { TABLE_CELL_CLASS } from '../constants';
import { formatListDueDate, getAvatarColor } from '../helpers';
import type { Task } from '../types';
import TaskStatusBadge from './TaskStatusBadge';

interface TaskRowProps {
  task: Task;
}

export default function TaskRow({ task }: TaskRowProps) {
  const assigneeName = task.assignee?.name;
  const avatarSeed = assigneeName || task.id;

  return (
    <tr className="border-b border-[#F1F3FF] bg-white last:border-b-0">
      <td className={`${TABLE_CELL_CLASS} w-2/12 uppercase text-[#003D9B]`}>
        {task.task_id ?? task.id.slice(0, 8)}
      </td>
      <td className={`${TABLE_CELL_CLASS} w-3/12 font-medium text-[#041B3C]`}>{task.title}</td>
      <td className={`${TABLE_CELL_CLASS} w-1/5`}>
        <TaskStatusBadge status={task.status} />
      </td>
      <td className={`${TABLE_CELL_CLASS} w-2/12 text-[#434654]`}>
        {formatListDueDate(task.deadline)}
      </td>
      <td className={`${TABLE_CELL_CLASS} w-3/12`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex size-6.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${getAvatarColor(avatarSeed)}`}
            >
              {assigneeName ? getAvatarLetters(assigneeName) : '—'}
            </div>
            <span className="truncate text-[#041B3C]">{assigneeName ?? 'Unassigned'}</span>
          </div>
          <button
            type="button"
            className="rounded-sm p-0.5 text-[#041B3C]/20 transition-colors hover:text-[#041B3C]/40"
            aria-label={`Actions for ${task.title}`}
          >
            <MoreVertical size={16} className="rotate-90" />
          </button>
        </div>
      </td>
    </tr>
  );
}
