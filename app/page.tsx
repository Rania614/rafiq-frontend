import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-6 gap-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-[#CBD5E1]">
        <div className="mb-4 text-xs font-bold tracking-widest text-[#0046AD] uppercase">
          ✦ Taskly Blueprint (Day 2)
        </div>

        <h1 className="text-3xl font-bold text-[#0A192F] tracking-tight">Curated Space</h1>

        <p className="mt-2 text-sm text-[#4A5568] leading-relaxed">
          Task Management Redefined. Welcome to your fresh Next.js project with Tailwind CSS v4
          variables configured successfully.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button className="w-full rounded-lg bg-[#0046AD] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0056D2]">
            Primary Action
          </button>

          <button className="w-full rounded-lg bg-[#E2ECFF] px-4 py-2.5 text-sm font-semibold text-[#0046AD] transition-colors hover:opacity-90">
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

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm border border-[#CBD5E1] text-center">
        <div className="text-xs font-bold tracking-widest text-[#4A5568] uppercase mb-2">
          ✦ Authentication (Day 3)
        </div>
        <p className="text-sm text-[#4A5568] mb-4">
          Ready to test user registration with React Hook Form & Zod?
        </p>
        <Link
          href="/sign-up"
          className="inline-block w-full rounded-lg bg-[#0046AD] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0056D2] shadow-sm"
        >
          Go to Sign Up Page
        </Link>
      </div>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm border border-[#CBD5E1] text-center">
        <div className="text-xs font-bold tracking-widest text-[#4A5568] uppercase mb-2">
          ✦ Authentication (Day 3)
        </div>
        <p className="text-sm text-[#4A5568] mb-4">
          Already have an account? Test the session and cookies storage.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-[#E2ECFF] px-4 py-3 text-sm font-bold text-[#0046AD] transition-colors hover:opacity-90 shadow-sm"
        >
          Go to Login Page
        </Link>
      </div>
    </main>
  );
}
