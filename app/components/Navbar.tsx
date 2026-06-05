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

export default function Navbar({ onMenuClick }: NavbarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: user, loading, error } = useAppSelector((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = user?.raw_user_meta_data?.name || 'Mahmoud Taha';
  const jobTitle = user?.raw_user_meta_data?.job_title || 'PROJECT MANAGER';
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
    const result = await dispatch(logoutUser());

    if (logoutUser.fulfilled.match(result)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      sessionStorage.clear();

      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      dispatch(clearUser());
      router.push('/login');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-white px-6 border-b border-[#CBD5E1]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-[#4A5568] hover:bg-[#F4F7FF] md:hidden"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {error && <span className="text-xs text-[#D31818] font-medium">{error}</span>}

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {loading ? (
            <div className="h-4 w-24 bg-[#CBD5E1]/50 animate-pulse rounded" />
          ) : (
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-[#0A192F]">{name}</div>
              <div className="text-[10px] font-bold text-[#0046AD] uppercase tracking-wider">
                {jobTitle}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0046AD] text-sm font-bold text-white tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0046AD]/20 transition-all"
          >
            {avatarLetters}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#CBD5E1] bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-[#CBD5E1]/40 sm:hidden">
                <div className="text-xs font-bold text-[#0A192F] truncate">{name}</div>
                <div className="text-[9px] font-bold text-[#0046AD] uppercase tracking-wider mt-0.5 truncate">
                  {jobTitle}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#D31818] hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
