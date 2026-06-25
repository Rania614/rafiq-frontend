'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
} from 'lucide-react';
import EmptyProjectsIllustration from '@/app/components/EmptyProjectsIllustration';
import { getAccessToken } from '@/utils/auth';
import { formatProjectDate } from '@/utils/date';
import {
  getPageNumbers,
  getTotalPages,
  parseContentRange,
  PROJECTS_PAGE_SIZE,
} from '@/utils/pagination';
import {
  clearCurrentProjectId,
  getProjectEditHref,
  getProjectEpicsHref,
  setCurrentProjectId,
} from '@/utils/project';
import { parseSupabaseRestError, supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

type PageState = 'loading' | 'success' | 'error' | 'empty';

const MOBILE_QUERY = '(max-width: 767px)';

const PROJECT_MENU_BUTTON_CLASS =
  'shrink-0 cursor-pointer rounded-sm p-1 text-[#041B3C]/20 transition-colors hover:text-[#041B3C]/40';

const PROJECT_MENU_PANEL_CLASS =
  'absolute right-0 top-full z-10 mt-2 w-24 list-none rounded-sm bg-[#F9F9FF] p-2 shadow-[0_1px_2px_0px_#0000000d]';

const SHOWING_TEXT_CLASS = 'text-sm font-medium text-[#434654]';

const PAGINATION_BUTTON_CLASS =
  'flex size-9 items-center justify-center rounded-xs border border-[#C3C6D6] text-sm font-bold text-[#434654] transition-colors hover:bg-[#F1F3FF] disabled:cursor-not-allowed disabled:opacity-40';

function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-y-3.5 rounded-lg bg-white p-6">
      <div className="h-32 w-full animate-pulse rounded-sm bg-[#E8EDFF]" />
      <div className="h-6 w-3/4 animate-pulse rounded-sm bg-[#E8EDFF]" />
      <div className="h-3.5 w-4/6 animate-pulse rounded-sm bg-[#E8EDFF]" />
    </div>
  );
}

function LoadingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <section className="flex flex-col gap-10">
      <header className="mb-5 flex animate-pulse flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="h-10 w-56 max-w-full rounded-md bg-[#C3C6D6]/60" />
        <div className="hidden h-12 w-44 rounded-md bg-[#C3C6D6]/60 lg:block" />
      </header>
      <div className="grid grid-cols-1 gap-6 pb-10 sm:grid-cols-2 lg:grid-cols-3 lg:pb-20 2xl:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col gap-y-3.5 rounded-lg bg-white p-6"
      onClick={() => setIsMenuOpen(false)}
    >
      <header className="flex items-center justify-between">
        <Link
          href={getProjectEpicsHref(project.id)}
          onClick={() => setCurrentProjectId(project.id)}
          className="w-full"
        >
          <h2 className="text-lg font-medium capitalize leading-[1.35] text-[#041B3C]">
            {project.name}
          </h2>
        </Link>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((open) => !open);
            }}
            className={PROJECT_MENU_BUTTON_CLASS}
            aria-label={`Actions for ${project.name}`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <ul className={PROJECT_MENU_PANEL_CLASS}>
              <li>
                <Link
                  href={getProjectEditHref(project.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentProjectId(project.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-0.5 text-sm text-[#434654] transition-colors hover:text-[#003D9B]"
                >
                  <Pencil size={20} className="text-[#003D9B]" />
                  <span>Edit</span>
                </Link>
              </li>
            </ul>
          )}
        </div>
      </header>

      <Link
        href={getProjectEpicsHref(project.id)}
        onClick={() => setCurrentProjectId(project.id)}
        className="flex w-full flex-col gap-y-3.5"
      >
        <p className="mb-6 line-clamp-4 text-sm leading-6 text-[#434654]">
          {project.description || 'No description provided.'}
        </p>
        <div className="mt-auto flex items-end justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[-0.55px] text-[#737685]">
            Created At
          </span>
          <span className="text-sm font-medium text-[#434654]">
            {formatProjectDate(project.created_at)}
          </span>
        </div>
      </Link>
    </div>
  );
}

function CreateProjectButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/project/add"
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] px-6 py-3 text-sm font-semibold capitalize text-white shadow-[0_1px_2px_0px_#0000000d] transition-opacity hover:opacity-95 ${className}`}
    >
      <Plus size={11} strokeWidth={2.5} />
      Create New Project
    </Link>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [projects, setProjects] = useState<Project[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const totalPages = getTotalPages(totalCount, PROJECTS_PAGE_SIZE);
  const hasMoreMobile = projects.length < totalCount;

  useEffect(() => {
    clearCurrentProjectId();
  }, []);

  /**
   * Main data fetching function for projects.
   * Handles both initial load and "load more" (append) for mobile infinite scroll.
   * Also parses pagination metadata from the response headers.
   */
  const fetchProjects = useCallback(
    async ({ offset, append = false }: { offset: number; append?: boolean }) => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      if (append) {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else {
        setPageState('loading');
      }
      setErrorMessage('');

      try {
        const url = `${supabaseRestUrl('/rpc/get_projects')}?limit=${PROJECTS_PAGE_SIZE}&offset=${offset}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...supabaseAuthHeaders(token),
            Prefer: 'count=exact',
          },
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          const message = await parseSupabaseRestError(response, 'Failed to load projects');
          setErrorMessage(message);
          setPageState('error');
          return;
        }

        const { start, end, total } = parseContentRange(response.headers.get('content-range'));
        const data: Project[] = await response.json();

        setTotalCount(total);
        setRangeStart(start);
        setRangeEnd(end);
        setProjects((prev) => (append ? [...prev, ...data] : data));
        setPageState(total === 0 ? 'empty' : 'success');
      } catch {
        setErrorMessage('Failed to load projects');
        setPageState('error');
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [router]
  );

  /**
   * Tracks screen size to toggle between Desktop (Pagination) and Mobile (Infinite Scroll) layouts.
   * Attaches a listener to update the `isMobile` state dynamically.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateIsMobile = () => {
      const matches = mediaQuery.matches;
      setIsMobile((wasMobile) => {
        if (matches !== wasMobile) {
          setCurrentPage(1);
          setProjects([]);
        }
        return matches;
      });
    };

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  /**
   * Triggers data fetching when the page changes or when switching between mobile/desktop modes.
   * On mobile, it resets to page 1 and fetches from the beginning.
   */
  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preserve existing projects fetch flow
      fetchProjects({ offset: 0, append: false });
      return;
    }

    fetchProjects({
      offset: (currentPage - 1) * PROJECTS_PAGE_SIZE,
      append: false,
    });
  }, [currentPage, isMobile, fetchProjects]);

  /**
   * IntersectionObserver setup for mobile infinite scrolling.
   * Watches the invisible 'sentinel' div at the bottom of the list.
   * When it comes into view, it fetches the next batch of projects.
   */
  useEffect(() => {
    if (!isMobile || pageState !== 'success' || !hasMoreMobile) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          fetchProjects({ offset: projects.length, append: true });
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile, pageState, hasMoreMobile, projects.length, fetchProjects]);

  const handleRetry = () => {
    if (isMobile) {
      fetchProjects({ offset: 0, append: false });
      return;
    }

    fetchProjects({
      offset: (currentPage - 1) * PROJECTS_PAGE_SIZE,
      append: false,
    });
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showCreateButton = pageState === 'success';
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const showingText = isMobile
    ? `Showing ${projects.length} of ${totalCount} active projects`
    : `Showing ${rangeStart + 1}-${rangeEnd + 1} of ${totalCount} active projects`;

  return (
    <section className="flex min-h-screen flex-col gap-10">
      <header className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-semibold capitalize leading-9 tracking-[-0.75px] text-[#041B3C]">
            Projects
          </h1>
          <p className="text-sm text-[#434654]">Manage and curate your projects</p>
        </div>
        {showCreateButton && <CreateProjectButton className="hidden lg:inline-flex" />}
      </header>

      {pageState === 'loading' && <LoadingSkeleton />}

      {pageState === 'error' && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center lg:min-h-[70vh]">
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#FFDBD6] text-[#BA1A1A]">
            <CloudOff size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C]">
            Failed to load projects
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#434654]">
            We&apos;re having trouble retrieving your projects right now. Please try again in a
            moment.
          </p>
          {errorMessage && (
            <p className="mt-2 max-w-md text-xs text-[#434654]/80">{errorMessage}</p>
          )}
          <button
            type="button"
            onClick={handleRetry}
            className="mt-8 rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] px-8 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_0px_#0000000d] transition-opacity hover:opacity-95"
          >
            Retry Connection
          </button>
        </div>
      )}

      {pageState === 'empty' && (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center sm:mx-auto sm:max-w-[40%] lg:min-h-[80vh]">
          <div className="flex flex-col items-center gap-11">
            <EmptyProjectsIllustration />
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-[36px] font-semibold tracking-[-0.9px] text-[#041B3C]">
                No Projects
              </h2>
              <p className="max-w-lg text-sm leading-6 tracking-[0.6px] text-[#434654]">
                You don&apos;t have any projects yet. Start by defining your first architectural
                workspace to begin tracking tasks and epics.
              </p>
            </div>
            <CreateProjectButton />
          </div>
        </div>
      )}

      {pageState === 'success' && (
        <>
          <div className="grid grid-cols-1 gap-6 pb-5 sm:grid-cols-2 lg:grid-cols-3 lg:pb-20 2xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {isMobile && isLoadingMore && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#434654]">
              <Loader2 size={18} className="animate-spin text-[#003D9B]" />
              Loading more projects...
            </div>
          )}

          {isMobile && hasMoreMobile && <div ref={loadMoreRef} className="h-4" aria-hidden />}

          {totalCount > 0 && (
            <footer className="flex flex-col items-center justify-between gap-6 lg:flex-row lg:items-center">
              <p className={`${SHOWING_TEXT_CLASS} ${isMobile ? 'text-center' : ''}`}>
                {showingText}
              </p>

              {!isMobile && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
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
                          onClick={() => handlePageChange(page)}
                          className={`flex size-9 items-center justify-center rounded-xs border text-sm font-bold transition-colors ${
                            page === currentPage
                              ? 'border-[#003D9B] bg-[#003D9B] text-white'
                              : 'border-[#C3C6D6] text-[#434654] hover:bg-[#F1F3FF]'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={PAGINATION_BUTTON_CLASS}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </footer>
          )}

          <Link
            href="/project/add"
            className="fixed bottom-20 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white shadow-[0_1px_2px_0px_#0000000d] transition-opacity hover:opacity-95 lg:hidden"
            aria-label="Create new project"
          >
            <Plus size={14} strokeWidth={2.5} />
          </Link>
        </>
      )}
    </section>
  );
}
