'use client';

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
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (val: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Projects', href: '/project', icon: Folder },
    { name: 'Project Epics', href: '/project/epics', icon: Layers },
    { name: 'Project Tasks', href: '/project/tasks', icon: CheckSquare },
    { name: 'Project Members', href: '/project/members', icon: Users },
    { name: 'Project Details', href: '/project/details', icon: Info },
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
            const isProjectSection =
              pathname === '/project' ||
              pathname === '/project/add' ||
              /^\/project\/[^/]+\/edit$/.test(pathname);

            const isActive =
              pathname === item.href || (item.href === '/project' && isProjectSection);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors
                  ${
                    isActive
                      ? 'bg-[#E2ECFF] text-[#0046AD]'
                      : 'text-[#4A5568] hover:bg-[#F4F7FF] hover:text-[#0A192F]'
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span
                  className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}
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
            <span
              className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}
            >
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
