'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Folder,
  Layers,
  CheckSquare,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  clearCurrentProjectId,
  getCurrentProjectId,
  getProjectEditHref,
  getProjectEpicsHref,
  getProjectIdFromPath,
  getProjectMembersHref,
  getProjectTasksHref,
} from '@/utils/project';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (val: boolean) => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string, projectId: string | null) => boolean;
  onNavigate?: () => void;
  requiresProject?: boolean;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    setStoredProjectId(getCurrentProjectId());
  }, [pathname]);

  const activeProjectId = getProjectIdFromPath(pathname) ?? storedProjectId;

  const menuItems: MenuItem[] = [
    {
      name: 'Projects',
      href: '/project',
      icon: Folder,
      isActive: (path) => path === '/project' || path === '/project/add',
      onNavigate: () => {
        clearCurrentProjectId();
        setStoredProjectId(null);
      },
    },
    {
      name: 'Project Epics',
      href: activeProjectId ? getProjectEpicsHref(activeProjectId) : '/project',
      icon: Layers,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/epics(?:/new)?$`).test(path)),
    },
    {
      name: 'Project Tasks',
      href: activeProjectId ? getProjectTasksHref(activeProjectId) : '/project',
      icon: CheckSquare,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/tasks(?:/new)?$`).test(path)),
    },
    {
      name: 'Project Members',
      href: activeProjectId ? getProjectMembersHref(activeProjectId) : '/project',
      icon: Users,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/members$`).test(path)),
    },
    {
      name: 'Project Details',
      href: activeProjectId ? getProjectEditHref(activeProjectId) : '/project',
      icon: Info,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/edit$`).test(path)),
    },
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-[#0A192F]/20 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`
          fixed bottom-0 top-0 left-0 z-50 flex flex-col bg-white border-r border-[#CBD5E1] transition-all duration-300
          md:sticky md:z-30 md:h-[calc(100vh-64px)]
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          ${isOpenMobile ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#CBD5E1] md:hidden">
          <span className="text-sm font-bold text-[#0A192F]">TASKLY</span>
          <button
            type="button"
            onClick={() => setIsOpenMobile(false)}
            className="rounded-lg p-1.5 text-[#4A5568] hover:bg-[#F4F7FF]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="hidden h-16 items-center px-6 md:flex">
          <span className="text-sm font-black tracking-wider text-[#0A192F]">TASKLY</span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive(pathname, activeProjectId);
            const isDisabled = item.requiresProject && !activeProjectId;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={item.onNavigate}
                aria-disabled={isDisabled}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors
                  ${
                    isActive
                      ? 'bg-[#E2ECFF] text-[#0046AD]'
                      : isDisabled
                        ? 'text-[#CBD5E1] pointer-events-none'
                        : 'text-[#4A5568] hover:bg-[#F4F7FF] hover:text-[#0A192F]'
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : ''}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#CBD5E1]/60 p-4">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#4A5568] hover:bg-[#F4F7FF] hover:text-[#0A192F] md:flex"
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="shrink-0" />
            ) : (
              <ChevronLeft size={18} className="shrink-0" />
            )}
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : ''}`}>
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
