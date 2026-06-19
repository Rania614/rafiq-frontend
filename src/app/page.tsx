import Link from 'next/link';
import AppShell from './components/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="rounded-xl border border-[#CBD5E1] bg-white p-8 shadow-sm">
          <div className="mb-4 text-xs font-bold tracking-widest text-[#0046AD] uppercase">
            ✦ Taskly Blueprint (Day 2)
          </div>

          <h1 className="text-3xl font-bold text-[#0A192F] tracking-tight">Curated Space</h1>

          <p className="mt-2 text-sm text-[#4A5568] leading-relaxed">
            Task Management Redefined. Welcome to your fresh Next.js project with Tailwind CSS v4
            variables configured successfully.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="flex-1 rounded-lg bg-[#0046AD] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0056D2]">
              Primary Action
            </button>

            <button className="flex-1 rounded-lg bg-[#E2ECFF] px-4 py-2.5 text-sm font-semibold text-[#0046AD] transition-colors hover:opacity-90">
              Secondary Action
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#CBD5E1] pt-4 text-xs font-medium text-[#4A5568]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#70FFB5]" /> Success
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FFB000]" /> Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#D31818]" /> Error
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-xs font-bold tracking-widest text-[#4A5568] uppercase">
            ✦ Authentication (Day 3)
          </div>
          <p className="mb-4 text-sm text-[#4A5568]">
            Ready to test user registration with React Hook Form & Zod?
          </p>
          <Link
            href="/sign-up"
            className="inline-block w-full rounded-lg bg-[#0046AD] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
          >
            Go to Sign Up Page
          </Link>
        </div>

        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-xs font-bold tracking-widest text-[#4A5568] uppercase">
            ✦ Authentication (Day 3)
          </div>
          <p className="mb-4 text-sm text-[#4A5568]">
            Already have an account? Test the session and cookies storage.
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-lg bg-[#E2ECFF] px-4 py-3 text-sm font-bold text-[#0046AD] shadow-sm transition-colors hover:opacity-90"
          >
            Go to Login Page
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
