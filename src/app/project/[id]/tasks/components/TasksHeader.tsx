import Link from 'next/link';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { getProjectTasksNewHref } from '@/utils/project';
import { DEFAULT_TASK_STATUS } from '@/utils/tasks';
import { FILTER_BUTTON_CLASS, NEW_TASK_BUTTON_CLASS, SEARCH_INPUT_CLASS } from '../constants';
import type { ViewMode } from '../types';
import TaskViewSelect from './TaskViewSelect';

interface TasksHeaderProps {
  projectName: string;
  projectId: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  loading?: boolean;
}

function TaskSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex w-full items-center lg:max-w-xs">
      <Search className="pointer-events-none absolute left-3 size-4 text-[#737685]" />
      <input
        type="search"
        placeholder="Search tasks..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SEARCH_INPUT_CLASS}
      />
    </div>
  );
}

export function TasksHeaderSkeleton() {
  return (
    <header className="flex animate-pulse flex-col gap-6">
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
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: TasksHeaderProps) {
  return (
    <>
      <header className="hidden flex-col gap-4 xl:flex-row xl:items-end xl:justify-between lg:flex">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[36px] font-semibold leading-10 tracking-[-0.9px] text-[#041B3C]">
            Active Workboard
          </h1>
          <p className="text-sm leading-5 text-[#64748B]">
            Curating {projectName || 'this project'}&apos;s production pipeline and milestones.
          </p>
        </div>
        <div className="flex items-center gap-3 xl:ms-auto">
          <TaskSearchInput value={searchTerm} onChange={onSearchChange} />
          <TaskViewSelect value={viewMode} onChange={onViewModeChange} />
          <button type="button" className={FILTER_BUTTON_CLASS} aria-label="Filter tasks">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>

      <header className="flex flex-col gap-6 lg:hidden">
        <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.75px] text-[#041B3C]">
          Active Workboard
        </h1>
        <div className="flex flex-col gap-3">
          <TaskSearchInput value={searchTerm} onChange={onSearchChange} />
          <TaskViewSelect value={viewMode} onChange={onViewModeChange} />
          <Link
            href={getProjectTasksNewHref(projectId, DEFAULT_TASK_STATUS)}
            className={`${NEW_TASK_BUTTON_CLASS} w-full`}
          >
            <Plus size={16} />
            Create Task
          </Link>
        </div>
      </header>
    </>
  );
}
