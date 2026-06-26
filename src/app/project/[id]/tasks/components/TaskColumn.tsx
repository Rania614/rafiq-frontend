'use client';

import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { getProjectTasksNewHref } from '@/utils/project';
import type { TaskStatus } from '@/utils/tasks';
import { STATUS_COUNT_BADGE, STATUS_DOT_COLORS } from '../constants';
import { formatStatusLabel } from '../helpers';
import { useBoardColumnTasks } from '../hooks/useBoardColumnTasks';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  projectId: string;
  status: TaskStatus;
  refreshKey?: number;
}

export default function TaskColumn({ projectId, status, refreshKey = 0 }: TaskColumnProps) {
  const { tasks, totalCount, isLoading, isLoadingMore, hasMore, error, loadMoreRef, retry } =
    useBoardColumnTasks(projectId, status, refreshKey);
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const countBadgeClass = STATUS_COUNT_BADGE[status] ?? 'bg-[#E8EDFF] text-[#434654]';

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-4 rounded-lg p-2 transition-colors ${
        isOver ? 'bg-[#F1F3FF]/60 outline outline-2 outline-dashed outline-[#003D9B]/20' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS_DOT_COLORS[status]}`} />
          <span className="text-[11px] font-semibold text-[#64748B]">
            {formatStatusLabel(status)}
          </span>
          <span
            className={`flex size-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold ${countBadgeClass}`}
          >
            {isLoading ? '…' : totalCount}
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

      {error && (
        <div className="flex flex-col items-center gap-2 rounded-sm bg-[#FFDBD6]/30 p-3 text-center">
          <p className="text-xs text-[#BA1A1A]">Failed to load tasks</p>
          <button
            type="button"
            onClick={retry}
            className="text-xs font-semibold text-[#003D9B] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-lg bg-white p-4 shadow-[0_2px_8px_0_#00000005]"
            >
              <div className="mb-2 h-4 w-3/4 rounded-sm bg-[#E8EDFF]" />
              <div className="h-3 w-1/2 rounded-sm bg-[#E8EDFF]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}

          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#434654]">
              <Loader2 size={14} className="animate-spin text-[#003D9B]" />
              Loading more...
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
