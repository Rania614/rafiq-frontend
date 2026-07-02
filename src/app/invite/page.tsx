'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InviteAcceptanceCard from './components/InviteAcceptanceCard';

export default function InvitePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-4 font-sans">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-[#CBD5E1] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#0046AD]" size={36} />
          <p className="text-sm font-semibold text-[#0A192F]">Loading session context...</p>
        </div>
      }>
        <InviteAcceptanceCard />
      </Suspense>
    </main>
  );
}
