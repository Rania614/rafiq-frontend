import Link from 'next/link';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { FILTER_BUTTON_CLASS, NEW_TASK_BUTTON_CLASS, SEARCH_INPUT_CLASS } from '../constants';
import type { ViewMode } from '../types';
import TaskViewSelect from './TaskViewSelect';

interface TasksHeaderProps {
  projectName: string;
  projectId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  loading?: boolean;
}

function TaskSearchInput() {
  return (
    <div className="relative flex w-full items-center lg:max-w-xs">
      <Search className="pointer-events-none absolute left-3 size-4 text-[#737685]" />
      <input
        type="search"
        placeholder="Search tasks..."
        readOnly
        aria-readonly="true"
        className={SEARCH_INPUT_CLASS}
      />
    </div>
  );
}

export function TasksHeaderSkeleton() {
  return (
    <header className="flex min-w-0 w-full animate-pulse flex-col gap-6">
      <div className="hidden flex-col gap-1.5 lg:flex">
        <div className="h-10 w-56 rounded-sm bg-[#E8EDFF]" />
        <div className="h-4 w-72 rounded-sm bg-[#F1F3FF]" />
      </div>
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="h-10 w-48 rounded-sm bg-[#E8EDFF]" />
        <div className="h-12 w-full rounded-sm bg-[#E8EDFF]" />
      </div>
      <div className="hidden items-center gap-3 lg:flex lg:ms-auto">
        <div className="h-12 w-56 rounded-sm bg-[#E8EDFF]" />
        <div className="h-12 w-44 rounded-sm bg-[#E8EDFF]" />
        <div className="size-11 rounded-sm bg-[#F1F3FF]" />
      </div>
    </header>
  );
}

export default function TasksHeader({
  projectName,
  projectId,
  viewMode,
  onViewModeChange,
}: TasksHeaderProps) {
  const addTaskHref = `/project/${projectId}/tasks/new`;

  return (
    <>
      <header className="hidden min-w-0 w-full flex-col gap-4 xl:flex-row xl:items-end xl:justify-between lg:flex">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[36px] font-semibold leading-10 tracking-[-0.9px] text-[#041B3C]">
            Active Workboard
          </h1>
          <p className="text-sm leading-5 text-[#64748B]">
            Curating {projectName || 'this project'}&apos;s production pipeline and milestones.
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-3 xl:ms-auto">
          <TaskSearchInput />
          <TaskViewSelect value={viewMode} onChange={onViewModeChange} />
          <button type="button" className={FILTER_BUTTON_CLASS} aria-label="Filter tasks">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>

      <header className="flex min-w-0 w-full flex-col gap-6 lg:hidden">
        <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.75px] text-[#041B3C]">
          Active Workboard
        </h1>
        <div className="flex flex-col gap-3">
          <TaskSearchInput />
          <TaskViewSelect value={viewMode} onChange={onViewModeChange} />
          <Link href={addTaskHref} className={`${NEW_TASK_BUTTON_CLASS} w-full`}>
            <Plus size={16} />
            Add New Task
          </Link>
        </div>
      </header>
    </>
  );
}
