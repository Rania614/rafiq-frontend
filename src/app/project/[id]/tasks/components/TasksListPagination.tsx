import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGINATION_BUTTON_CLASS } from '../constants';

interface TasksListPaginationProps {
  currentPage?: number;
  totalPages?: number;
}

export default function TasksListPagination({
  currentPage = 1,
  totalPages = 1,
}: TasksListPaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled className={PAGINATION_BUTTON_CLASS} aria-label="Previous page">
        <ChevronLeft size={14} />
      </button>
      <p className="text-sm font-medium text-[#434654]">
        Page {currentPage} of {totalPages}
      </p>
      <button type="button" disabled className={PAGINATION_BUTTON_CLASS} aria-label="Next page">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
