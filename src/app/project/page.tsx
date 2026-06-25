'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CloudOff, Loader2, Pencil, Plus } from 'lucide-react';
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

function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
      <div className="h-36 animate-pulse bg-[#E2ECFF]/70 sm:h-40" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-md bg-[#CBD5E1]/60" />
        <div className="h-3 w-full animate-pulse rounded-md bg-[#CBD5E1]/40" />
        <div className="h-3 w-5/6 animate-pulse rounded-md bg-[#CBD5E1]/40" />
      </div>
    </div>
  );
}

function CreateButtonSkeleton() {
  return <div className="h-10 w-full animate-pulse rounded-lg bg-[#E2ECFF] sm:w-44" />;
}

function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();

  const openProject = () => {
    setCurrentProjectId(project.id);
    router.push(getProjectEpicsHref(project.id));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProject}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProject();
        }
      }}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <Link
        href={getProjectEditHref(project.id)}
        onClick={(event) => {
          event.stopPropagation();
          setCurrentProjectId(project.id);
        }}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:border-[#0046AD] hover:bg-[#F4F7FF] hover:text-[#0046AD]"
        aria-label={`Edit ${project.name}`}
      >
        <Pencil size={15} />
      </Link>

      <h2 className="mb-2 pr-10 text-base font-bold text-[#0A192F] group-hover:text-[#0046AD]">
        {project.name}
      </h2>
      <p className="mb-6 line-clamp-4 flex-1 text-sm leading-relaxed text-[#4A5568]">
        {project.description || 'No description provided.'}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-[#CBD5E1]/60 pt-4">
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
          Created At
        </span>
        <span className="text-xs font-medium text-[#4A5568]">
          {formatProjectDate(project.created_at)}
        </span>
      </div>
    </div>
  );
}

function AddProjectCard() {
  return (
    <Link
      href="/project/add"
      className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-white p-5 text-center transition-colors hover:border-[#0046AD] hover:bg-[#F4F7FF]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E2ECFF] text-[#0046AD]">
        <Plus size={20} />
      </div>
      <span className="text-xs font-bold tracking-widest text-[#4A5568] uppercase">
        Add Project
      </span>
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
  const isLastPage = currentPage >= totalPages;
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
  const showAddProjectCard = !isMobile && isLastPage;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const showingText = isMobile
    ? `Showing ${projects.length} of ${totalCount} active projects`
    : `Showing ${rangeStart + 1}-${rangeEnd + 1} of ${totalCount} active projects`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-[#4A5568]">Manage and curate your projects.</p>
        </div>
        {pageState === 'loading' && <CreateButtonSkeleton />}
        {showCreateButton && (
          <Link
            href="/project/add"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0046AD] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] sm:w-auto"
          >
            <Plus size={16} />
            Create New Project
          </Link>
        )}
      </div>

      {pageState === 'loading' && <LoadingSkeleton />}

      {pageState === 'error' && (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[480px]">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D31818]">
            <CloudOff size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
            Failed to load projects
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4A5568] sm:text-base">
            We&apos;re having trouble retrieving your projects right now. Please try again in a
            moment.
          </p>
          {errorMessage && (
            <p className="mt-2 max-w-md text-xs text-[#4A5568]/80">{errorMessage}</p>
          )}
          <button
            type="button"
            onClick={handleRetry}
            className="mt-8 rounded-xl bg-[#0046AD] px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
          >
            Retry Connection
          </button>
        </div>
      )}

      {pageState === 'empty' && (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[480px]">
          <EmptyProjectsIllustration />
          <h2 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
            No projects found
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#4A5568] sm:text-base">
            You don&apos;t have any projects yet. Start by defining your first architectural
            workspace to begin tracking tasks and epics.
          </p>
          <Link
            href="/project/add"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#0046AD] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#0056D2]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0046AD]">
              <Plus size={16} strokeWidth={2.5} />
            </span>
            Create New Project
          </Link>
        </div>
      )}

      {pageState === 'success' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {showAddProjectCard && <AddProjectCard />}
          </div>

          {isMobile && isLoadingMore && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#4A5568]">
              <Loader2 size={18} className="animate-spin text-[#0046AD]" />
              Loading more projects...
            </div>
          )}

          {isMobile && hasMoreMobile && <div ref={loadMoreRef} className="h-4" aria-hidden />}

          {!isMobile && totalPages > 0 && (
            <div className="mt-8 flex flex-col gap-4 border-t border-[#CBD5E1]/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[#4A5568]">{showingText}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:bg-[#F4F7FF] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#CBD5E1]"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((page, index) => {
                  const prevPage = pageNumbers[index - 1];
                  const showEllipsis = prevPage !== undefined && page - prevPage > 1;

                  return (
                    <span key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-xs text-[#4A5568]">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                          page === currentPage
                            ? 'bg-[#0046AD] font-bold text-white'
                            : 'border border-[#CBD5E1] text-[#4A5568] hover:bg-[#F4F7FF]'
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:bg-[#F4F7FF] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#CBD5E1]"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {isMobile && totalCount > 0 && (
            <p className="mt-6 text-center text-xs font-medium text-[#4A5568]">{showingText}</p>
          )}
        </>
      )}
    </div>
  );
}
