import { Compass, Layers, Square } from 'lucide-react';

export default function EmptyProjectsIllustration() {
  return (
    <div className="relative mx-auto mb-8 flex h-44 w-full max-w-xs items-center justify-center">
      <div className="absolute left-4 top-6 rotate-[-12deg] rounded-xl border border-[#CBD5E1]/60 bg-[#E2ECFF]/50 p-3 text-[#0046AD]/40">
        <Square size={28} strokeWidth={1.5} />
      </div>

      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#CBD5E1] bg-[#E2ECFF]/60 shadow-sm">
        <Compass size={40} className="text-[#0046AD]/70" strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-4 left-8 rotate-[8deg] rounded-lg border border-[#CBD5E1]/60 bg-white p-2.5 text-[#0046AD]/50 shadow-sm">
        <Layers size={22} strokeWidth={1.5} />
      </div>

      <div className="absolute right-2 top-10 h-16 w-3 rotate-[20deg] rounded-full bg-[#E2ECFF] border border-[#CBD5E1]/40" />
      <div className="absolute bottom-10 right-6 h-12 w-12 rounded-lg border-2 border-dashed border-[#CBD5E1]/80 bg-[#F4F7FF]" />
    </div>
  );
}
