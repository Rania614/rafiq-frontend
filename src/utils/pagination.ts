/**
 * Number of items displayed per page in the projects list.
 */
export const PROJECTS_PAGE_SIZE = 10;

/**
 * Number of items displayed per page in the epics list.
 */
export const EPICS_PAGE_SIZE = 10;

/**
 * Represents the parsed pagination range from the Content-Range header.
 */
export interface ContentRange {
  start: number;
  end: number;
  total: number;
}

/**
 * Parses the Supabase Content-Range header to extract pagination metadata.
 *
 * @param header - The raw Content-Range header string (e.g., "0-9/50" or "0-9/*").
 * @returns An object containing the start index, end index, and total count.
 */
export function parseContentRange(header: string | null): ContentRange {
  if (!header) {
    return { start: 0, end: 0, total: 0 };
  }

  const match = header.match(/(\d+)-(\d+)\/(\d+|\*)/);
  if (!match) {
    return { start: 0, end: 0, total: 0 };
  }

  const total = match[3] === '*' ? 0 : Number.parseInt(match[3], 10);

  return {
    start: Number.parseInt(match[1], 10),
    end: Number.parseInt(match[2], 10),
    total,
  };
}

/**
 * Calculates the total number of pages based on the total item count and page size.
 *
 * @param totalCount - Total number of items available.
 * @param pageSize - Number of items per page.
 * @returns The total number of pages required.
 */
export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount === 0) return 0;
  return Math.ceil(totalCount / pageSize);
}

/**
 * Generates an array of page numbers to display in the pagination component,
 * optimizing the view to show first, current, last, and adjacent pages.
 *
 * @param currentPage - The currently active page index.
 * @param totalPages - The total number of pages available.
 * @returns An array of page numbers to render.
 */
export function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  return Array.from(pages).sort((a, b) => a - b);
}
