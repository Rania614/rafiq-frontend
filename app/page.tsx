export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-[#CBD5E1]">
        {/* اسم البراند من الصورة */}
        <div className="mb-4 text-xs font-bold tracking-widest text-[#0046AD] uppercase">
          ✦ Taskly Blueprint
        </div>
        
        {/* العنوان بالخط الأساسي */}
        <h1 className="text-3xl font-bold text-[#0A192F] tracking-tight">
          Curated Space
        </h1>
        
        <p className="mt-2 text-sm text-[#4A5568] leading-relaxed">
          Task Management Redefined. Welcome to your fresh Next.js project with Tailwind CSS v4 variables configured successfully.
        </p>

        {/* أزرار مأخوذة من الـ Components Showcase في الديزاين */}
        <div className="mt-6 flex flex-col gap-3">
          <button className="w-full rounded-lg bg-[#0046AD] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0056D2]">
            Primary Action
          </button>
          
          <button className="w-full rounded-lg bg-[#E2ECFF] px-4 py-2.5 text-sm font-semibold text-[#0046AD] transition-colors hover:opacity-90">
            Secondary Action
          </button>
        </div>

        {/* مؤشرات الألوان Semantic للتأكيد */}
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
    </main>
  );
}