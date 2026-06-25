import { MoreVertical } from 'lucide-react';
import { getAvatarLetters } from '@/utils/avatar';
import { SHADOW_SM, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '../constants';
import { formatListDueDate, getAvatarColor } from '../helpers';
import type { Task } from '../types';
import TaskRow from './TaskRow';
import TaskStatusBadge from './TaskStatusBadge';

interface TasksListProps {
  tasks: Task[];
  totalCount: number;
}

function TaskMobileCard({ task }: { task: Task }) {
  const assigneeName = task.assignee?.name;
  const avatarSeed = assigneeName || task.id;

  return (
    <div className={`flex flex-col gap-3 rounded-lg bg-white p-4 ${SHADOW_SM}`}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold tracking-[0.6px] text-[#434654]/50 uppercase">
            {task.task_id ?? task.id.slice(0, 8)}
          </span>
          <TaskStatusBadge status={task.status} />
        </div>
        <h3 className="mt-1 text-lg font-medium leading-6 text-[#041B3C]">{task.title}</h3>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-6.5 items-center justify-center rounded-full text-[10px] font-bold ${getAvatarColor(avatarSeed)}`}
          >
            {assigneeName ? getAvatarLetters(assigneeName) : '—'}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-[#434654]/70">due date</span>
            <span className="text-sm font-medium text-[#041B3C]">
              {formatListDueDate(task.deadline)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="rounded-sm p-0.5 text-[#434654]/40"
          aria-label={`Actions for ${task.title}`}
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

export default function TasksList({ tasks, totalCount }: TasksListProps) {
  return (
    <>
      <div className="hidden w-full overflow-x-auto lg:block">
        <table className={`min-w-[960px] w-full border-collapse ${SHADOW_SM}`}>
          <thead>
            <tr className="border-b border-[#C3C6D6]/10 bg-[#F1F3FF]/30">
              <th className={`${TABLE_HEAD_CLASS} w-2/12`}>Task ID</th>
              <th className={`${TABLE_HEAD_CLASS} w-3/12`}>Title</th>
              <th className={`${TABLE_HEAD_CLASS} w-1/5`}>Status</th>
              <th className={`${TABLE_HEAD_CLASS} w-2/12`}>Due Date</th>
              <th className={`${TABLE_HEAD_CLASS} w-3/12`}>Assignees</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {tasks.map((task) => (
          <TaskMobileCard key={task.id} task={task} />
        ))}
      </div>

      <footer className="hidden bg-[#F1F3FF]/20 px-6 py-3 lg:block">
        <p className="text-sm font-medium text-[#434654]">
          Showing {tasks.length} of {totalCount} tasks
        </p>
      </footer>
    </>
  );
}

export function TasksListSkeleton() {
  return (
    <>
      <div className="hidden w-full overflow-x-auto lg:block">
        <table className={`min-w-[960px] w-full border-collapse ${SHADOW_SM}`}>
          <thead>
            <tr className="border-b border-[#C3C6D6]/10 bg-[#F1F3FF]/30">
              {['Task ID', 'Title', 'Status', 'Due Date', 'Assignees'].map((label) => (
                <th key={label} className={TABLE_HEAD_CLASS}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="animate-pulse border-b border-[#F1F3FF] bg-white">
                <td className={TABLE_CELL_CLASS}>
                  <div className="h-4 w-16 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="h-4 w-3/4 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="h-6 w-20 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="h-4 w-24 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="flex items-center gap-3">
                    <div className="size-6.5 rounded-full bg-[#E8EDFF]" />
                    <div className="h-4 w-20 rounded-sm bg-[#E8EDFF]" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`animate-pulse rounded-lg bg-white p-4 ${SHADOW_SM}`}>
            <div className="mb-3 h-4 w-16 rounded-sm bg-[#E8EDFF]" />
            <div className="mb-4 h-6 w-3/4 rounded-sm bg-[#E8EDFF]" />
            <div className="flex items-center gap-3">
              <div className="size-6.5 rounded-full bg-[#E8EDFF]" />
              <div className="h-4 w-24 rounded-sm bg-[#E8EDFF]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
