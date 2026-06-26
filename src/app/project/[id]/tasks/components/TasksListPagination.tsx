import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGINATION_BUTTON_CLASS } from '../constants';

interface TasksListPaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
}

export default function TasksListPagination({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
}: TasksListPaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={PAGINATION_BUTTON_CLASS}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {pageNumbers.map((page, index) => {
        const prevPage = pageNumbers[index - 1];
        const showEllipsis = prevPage !== undefined && page - prevPage > 1;

        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="flex size-9 items-center justify-center text-sm font-bold text-[#434654]">
                ...
              </span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`${PAGINATION_BUTTON_CLASS} ${
                page === currentPage ? 'border-[#003D9B] bg-[#003D9B] text-white' : ''
              }`}
            >
              {page}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={PAGINATION_BUTTON_CLASS}
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>

      <p className="text-sm font-medium text-[#434654]">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
