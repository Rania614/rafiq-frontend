import { TASK_STATUSES } from '@/utils/tasks';
import { BOARD_COLUMNS_CLASS, BOARD_SCROLL_CONTAINER_CLASS, BOARD_SHADOW } from '../constants';
import type { ViewMode } from '../types';
import { TasksListSkeleton } from './TasksList';

function BoardColumnSkeleton() {
  return (
    <div className="flex w-64 shrink-0 animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-[#E8EDFF]" />
          <div className="h-4 w-20 rounded-sm bg-[#E8EDFF]" />
          <div className="size-5 rounded-sm bg-[#F1F3FF]" />
        </div>
        <div className="size-4 rounded-sm bg-[#F1F3FF]" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-sm border-2 border-dashed border-[#C3C6D6]/40 p-4">
        <div className="size-4 rounded-sm bg-[#E8EDFF]" />
        <div className="h-4 w-24 rounded-sm bg-[#E8EDFF]" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={`flex flex-col gap-4 rounded-lg border bg-white p-4 ${BOARD_SHADOW}`}
        >
          <div className="h-4 w-full rounded-sm bg-[#E8EDFF]" />
          <div className="flex justify-between">
            <div className="h-3 w-12 rounded-sm bg-[#F1F3FF]" />
            <div className="size-6 rounded-full bg-[#E8EDFF]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TasksBoardSkeleton() {
  return (
    <div className={BOARD_SCROLL_CONTAINER_CLASS}>
      <div className={BOARD_COLUMNS_CLASS}>
        {TASK_STATUSES.map((status) => (
          <BoardColumnSkeleton key={status} />
        ))}
      </div>
    </div>
  );
}

interface TaskLoadingStateProps {
  viewMode: ViewMode;
}

export default function TaskLoadingState({ viewMode }: TaskLoadingStateProps) {
  return viewMode === 'board' ? <TasksBoardSkeleton /> : <TasksListSkeleton />;
}
