'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Folder,
  Layers,
  CheckSquare,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAppDispatch } from '@/store';
import { logoutUser, clearUser } from '@/store/slices/userSlice';
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

function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  const logoIcon = (
    <svg
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[18px] w-[18px] shrink-0 text-[#0052CC]"
      aria-hidden
    >
      <path
        d="M9 20L0 15V5L9 0L18 5V15L9 20ZM6.1 7.25C6.48333 6.85 6.925 6.54167 7.425 6.325C7.925 6.10833 8.45 6 9 6C9.55 6 10.075 6.10833 10.575 6.325C11.075 6.54167 11.5167 6.85 11.9 7.25L14.9 5.575L9 2.3L3.1 5.575L6.1 7.25ZM8 17.15V13.875C7.1 13.6417 6.375 13.1667 5.825 12.45C5.275 11.7333 5 10.9167 5 10C5 9.81667 5.00833 9.64583 5.025 9.4875C5.04167 9.32917 5.075 9.16667 5.125 9L2 7.25V13.825L8 17.15ZM9 12C9.55 12 10.0208 11.8042 10.4125 11.4125C10.8042 11.0208 11 10.55 11 10C11 9.45 10.8042 8.97917 10.4125 8.5875C10.0208 8.19583 9.55 8 9 8C8.45 8 7.97917 8.19583 7.5875 8.5875C7.19583 8.97917 7 9.45 7 10C7 10.55 7.19583 11.0208 7.5875 11.4125C7.97917 11.8042 8.45 12 9 12ZM10 17.15L16 13.825V7.25L12.875 9C12.925 9.16667 12.9583 9.32917 12.975 9.4875C12.9917 9.64583 13 9.81667 13 10C13 10.9167 12.725 11.7333 12.175 12.45C11.625 13.1667 10.9 13.6417 10 13.875V17.15Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <Link
      href="/project"
      className={`flex items-center gap-2 ${collapsed ? 'md:justify-center' : ''}`}
      aria-label="Taskly home"
    >
      {logoIcon}
      <span
        className={`text-xl font-bold uppercase tracking-[-0.55px] text-[#041B3C] ${
          collapsed ? 'md:hidden' : ''
        }`}
      >
        Taskly
      </span>
    </Link>
  );
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeProjectId = getProjectIdFromPath(pathname) ?? getCurrentProjectId();

  const menuItems: MenuItem[] = [
    {
      name: 'projects',
      href: '/project',
      icon: Folder,
      isActive: (path) => path === '/project' || path === '/project/add',
      onNavigate: () => {
        clearCurrentProjectId();
      },
    },
    {
      name: 'project epics',
      href: activeProjectId ? getProjectEpicsHref(activeProjectId) : '/project',
      icon: Layers,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/epics(?:/new)?$`).test(path)),
    },
    {
      name: 'project tasks',
      href: activeProjectId ? getProjectTasksHref(activeProjectId) : '/project',
      icon: CheckSquare,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/tasks(?:/new)?$`).test(path)),
    },
    {
      name: 'project members',
      href: activeProjectId ? getProjectMembersHref(activeProjectId) : '/project',
      icon: Users,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/members$`).test(path)),
    },
    {
      name: 'project details',
      href: activeProjectId ? getProjectEditHref(activeProjectId) : '/project',
      icon: Info,
      requiresProject: true,
      isActive: (path, projectId) =>
        Boolean(projectId && new RegExp(`^/project/${projectId}/edit$`).test(path)),
    },
  ];

  const visibleMenuItems = activeProjectId
    ? menuItems
    : menuItems.filter((item) => !item.requiresProject);

  const handleNavigate = (item: MenuItem) => {
    item.onNavigate?.();
    setIsOpenMobile(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutUser());
      dispatch(clearUser());
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = (
    <ul className="flex flex-col gap-1">
      {visibleMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive(pathname, activeProjectId);

        return (
          <li
            key={item.name}
            className={`group rounded-sm px-3 py-2.5 ${
              isActive ? 'bg-white' : ''
            } ${isCollapsed ? 'md:flex md:size-12 md:items-center md:justify-center md:px-0 md:py-0' : ''}`}
          >
            <Link
              href={item.href}
              onClick={() => handleNavigate(item)}
              title={item.name}
              className={`flex items-center gap-3 capitalize transition-all duration-300 ${
                isCollapsed ? 'md:w-fit md:mx-auto' : 'w-full'
              } ${
                isActive
                  ? 'text-[#003D9B] max-md:text-[#0052CC]'
                  : 'text-[#041B3C] max-md:text-[#041B3C]/60 hover:text-[#003D9B]'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                className={`shrink-0 transition-transform duration-300 ${
                  isCollapsed ? 'group-hover:scale-110' : ''
                }`}
              />
              <span className={`text-sm font-medium leading-5 ${isCollapsed ? 'md:hidden' : ''}`}>
                {item.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const bottomActions = (
    <div className="flex flex-col gap-1 capitalize">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium leading-5 text-[#041B3C] transition-colors duration-300 hover:text-[#003D9B] md:flex"
      >
        {isCollapsed ? (
          <ChevronRight size={11} strokeWidth={2.5} className="shrink-0" />
        ) : (
          <ChevronLeft size={11} strokeWidth={2.5} className="shrink-0" />
        )}
        <span className={isCollapsed ? 'md:hidden' : ''}>collapse</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium leading-5 text-[#BA1A1A] transition-colors duration-300 hover:text-[#93000A] disabled:cursor-not-allowed disabled:opacity-70 ${
          isCollapsed ? 'md:justify-center' : 'justify-start'
        }`}
      >
        <LogOut size={17} strokeWidth={1.75} className="shrink-0" />
        <span className={isCollapsed ? 'md:hidden' : ''}>
          {isLoggingOut ? 'logging out' : 'logout'}
        </span>
      </button>
    </div>
  );

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-[#041B3C]/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`
          fixed bottom-0 top-0 left-0 z-50 flex flex-col bg-[#F1F3FF] p-4 transition-all duration-300
          md:sticky md:top-16 md:z-30 md:h-[calc(100vh-64px)]
          ${isCollapsed ? 'md:w-fit' : 'md:w-[256px]'}
          ${
            isOpenMobile
              ? 'w-[256px] translate-x-0 opacity-100'
              : 'w-[256px] -translate-x-full opacity-0 invisible md:visible md:translate-x-0 md:opacity-100'
          }
        `}
      >
        <div className="flex h-full flex-col gap-y-9">
          <SidebarLogo collapsed={isCollapsed} />

          <div className="flex flex-1 flex-col justify-between">
            <nav>{navLinks}</nav>
            {bottomActions}
          </div>
        </div>
      </aside>
    </>
  );
}
