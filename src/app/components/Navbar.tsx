'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutUser, clearUser } from '@/store/slices/userSlice';
import { getAvatarLetters } from '@/utils/avatar';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onMenuClick: () => void;
}

function NavbarSkeleton({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 border-b border-black/10 bg-white px-6 py-3">
      <div className="hidden items-center justify-end gap-4 md:flex">
        <div className="flex flex-col items-end gap-1">
          <div className="h-5 w-20 animate-pulse rounded-sm bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]" />
          <div className="h-4 w-24 animate-pulse rounded-sm bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]" />
        </div>
        <div className="size-10 animate-pulse rounded-lg bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]" />
      </div>

      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="size-6 animate-pulse rounded-lg bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]"
            aria-label="Open menu"
          />
          <div className="h-5 w-20 animate-pulse rounded-lg bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]" />
        </div>
        <div className="size-10 animate-pulse rounded-lg bg-[#C3C6D6] shadow-[0_1px_2px_0px_#0000000d]" />
      </div>
    </header>
  );
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: user, loading, error } = useAppSelector((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = user?.raw_user_meta_data?.name || 'User';
  const jobTitle = user?.raw_user_meta_data?.job_title || 'Member';
  const avatarLetters = getAvatarLetters(name);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearUser());
    router.push('/login');
  };

  if (loading || !user) {
    return <NavbarSkeleton onMenuClick={onMenuClick} />;
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-40 border-b border-black/10 bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={onMenuClick}
            className="cursor-pointer rounded-sm p-1 text-[#041B3C] transition-colors hover:text-[#003D9B]"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <h3 className="text-xl font-bold uppercase tracking-[-0.55px] text-[#041B3C]">Taskly</h3>
        </div>

        <div className="ms-auto flex items-center gap-4">
          {error && (
            <span className="hidden text-xs font-medium text-[#BA1A1A] sm:inline">{error}</span>
          )}

          <div className="hidden flex-col items-end md:flex">
            <h3 className="text-sm font-semibold capitalize leading-5 text-[#041B3C]">{name}</h3>
            <span className="text-[10px] font-bold uppercase leading-5 tracking-[1px] text-[#003D9B]">
              {jobTitle}
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#0052CC] text-base font-bold uppercase leading-6 tracking-wider text-white shadow-[0_1px_2px_0px_#0000000d] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#003D9B]/20"
              aria-expanded={isOpen}
              aria-haspopup="menu"
            >
              {avatarLetters}
            </button>

            {isOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[12.5rem] rounded-sm bg-white p-1 shadow-[0_1px_2px_0px_#0000000d]"
              >
                <div className="border-b border-black/10 px-3 py-2 md:hidden">
                  <div className="truncate text-sm font-semibold capitalize leading-5 text-[#041B3C]">
                    {name}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] font-bold uppercase leading-5 tracking-[1px] text-[#003D9B]">
                    {jobTitle}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium capitalize leading-5 text-[#BA1A1A] transition-colors hover:text-[#93000A]"
                >
                  <LogOut size={17} strokeWidth={1.75} />
                  <span>logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
