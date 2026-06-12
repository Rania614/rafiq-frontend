export const PROJECTS_PAGE_SIZE = 10;

export interface ContentRange {
  start: number;
  end: number;
  total: number;
}

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

export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount === 0) return 0;
  return Math.ceil(totalCount / pageSize);
}

export function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  return Array.from(pages).sort((a, b) => a - b);
}
