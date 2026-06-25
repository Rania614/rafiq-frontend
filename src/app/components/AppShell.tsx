'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FF]">
      <Navbar onMenuClick={() => setIsOpenMobile(true)} />

      <div className="flex min-w-0 pt-16">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        <main className="min-w-0 flex-1 p-6 transition-all duration-300">{children}</main>
      </div>
    </div>
  );
}
