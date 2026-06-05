'use client';

import { Menu } from 'lucide-react';
import { useAppSelector } from '@/store';
import { getAvatarLetters } from '@/utils/avatar';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { data: user, loading } = useAppSelector((state) => state.user);

  const name = user?.raw_user_meta_data?.name || 'Mahmoud Taha';
  const jobTitle = user?.raw_user_meta_data?.job_title || 'PROJECT MANAGER';
  const avatarLetters = getAvatarLetters(name);

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

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-4 w-24 bg-[#CBD5E1]/50 animate-pulse rounded" />
        ) : (
          <div className="text-right">
            <div className="text-sm font-bold text-[#0A192F]">{name}</div>
            <div className="text-[10px] font-bold text-[#0046AD] uppercase tracking-wider">
              {jobTitle}
            </div>
          </div>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0046AD] text-sm font-bold text-white tracking-wider">
          {avatarLetters}
        </div>
      </div>
    </header>
  );
}
