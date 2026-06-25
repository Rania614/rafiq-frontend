import Link from 'next/link';
import { MoreVertical, Plus } from 'lucide-react';
import { getAvatarLetters } from '@/utils/avatar';
import { NEW_TASK_BUTTON_CLASS, SHADOW_SM, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '../constants';
import { formatListDueDate, getAvatarColor } from '../helpers';
import type { Task } from '../types';
import TaskRow from './TaskRow';
import TaskStatusBadge from './TaskStatusBadge';
import TasksListPagination from './TasksListPagination';

interface TasksListProps {
  projectId: string;
  tasks: Task[];
  totalCount: number;
  onOpenTaskDetails: (taskId: string) => void;
}

function TaskMobileCard({
  task,
  onOpenTaskDetails,
}: {
  task: Task;
  onOpenTaskDetails: (taskId: string) => void;
}) {
  const assigneeName = task.assignee?.name;
  const avatarSeed = assigneeName || task.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenTaskDetails(task.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenTaskDetails(task.id);
        }
      }}
      className={`flex w-full cursor-pointer flex-col gap-3 rounded-lg bg-white p-4 text-left transition-colors hover:bg-[#F1F3FF] ${SHADOW_SM}`}
    >
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
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="rounded-sm p-0.5 text-[#434654]/40"
          aria-label={`Actions for ${task.title}`}
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

export default function TasksList({
  projectId,
  tasks,
  totalCount,
  onOpenTaskDetails,
}: TasksListProps) {
  const addTaskHref = `/project/${projectId}/tasks/new`;

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4 lg:gap-0">
      <div className="hidden min-w-0 w-full overflow-x-auto lg:block">
        <table className={`min-w-[960px] w-full border-collapse ${SHADOW_SM}`}>
          <thead>
            <tr className="border-b border-[#C3C6D6]/10 bg-[#F1F3FF]/30">
              <th className={`${TABLE_HEAD_CLASS} w-2/12`}>Task</th>
              <th className={`${TABLE_HEAD_CLASS} w-3/12`}>Title</th>
              <th className={`${TABLE_HEAD_CLASS} w-2/12`}>Due Date</th>
              <th className={`${TABLE_HEAD_CLASS} w-1/5`}>Status</th>
              <th className={`${TABLE_HEAD_CLASS} w-3/12`}>Assignee</th>
              <th className={`${TABLE_HEAD_CLASS} w-12`}>
                <span className="sr-only">Settings</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onOpenTaskDetails={onOpenTaskDetails} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {tasks.map((task) => (
          <TaskMobileCard key={task.id} task={task} onOpenTaskDetails={onOpenTaskDetails} />
        ))}
      </div>

      <footer className="flex flex-col gap-4 bg-[#F1F3FF]/20 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-medium text-[#434654]">
          Showing {tasks.length} of {totalCount} tasks
        </p>
        <TasksListPagination />
      </footer>

      <div className="flex justify-center lg:justify-end">
        <Link href={addTaskHref} className={`${NEW_TASK_BUTTON_CLASS} w-full lg:w-auto`}>
          <Plus size={16} />
          Add New Task
        </Link>
      </div>
    </div>
  );
}

export function TasksListSkeleton() {
  return (
    <>
      <div className="hidden w-full overflow-x-auto lg:block">
        <table className={`min-w-[960px] w-full border-collapse ${SHADOW_SM}`}>
          <thead>
            <tr className="border-b border-[#C3C6D6]/10 bg-[#F1F3FF]/30">
              {['Task', 'Title', 'Due Date', 'Status', 'Assignee', ''].map((label) => (
                <th key={label || 'settings'} className={TABLE_HEAD_CLASS}>
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
                  <div className="h-4 w-24 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="h-6 w-20 rounded-sm bg-[#E8EDFF]" />
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="flex items-center gap-3">
                    <div className="size-6.5 rounded-full bg-[#E8EDFF]" />
                    <div className="h-4 w-20 rounded-sm bg-[#E8EDFF]" />
                  </div>
                </td>
                <td className={TABLE_CELL_CLASS}>
                  <div className="ms-auto h-4 w-4 rounded-sm bg-[#F1F3FF]" />
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
