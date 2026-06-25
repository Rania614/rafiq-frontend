import { FolderKanban, Layers, LayoutGrid } from 'lucide-react';

export default function EmptyProjectsIllustration() {
  return (
    <div className="relative mx-auto flex h-[250px] w-[250px] items-center justify-center">
      <div className="absolute left-2 top-8 rotate-[-12deg] rounded-lg bg-[#E8EDFF] p-4 text-[#003D9B]/30">
        <LayoutGrid size={32} strokeWidth={1.5} />
      </div>

      <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]/70 shadow-[0_1px_2px_0px_#0000000d]">
        <FolderKanban size={48} strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-6 left-6 rotate-[8deg] rounded-lg bg-white p-3 text-[#003D9B]/40 shadow-[0_1px_2px_0px_#0000000d]">
        <Layers size={24} strokeWidth={1.5} />
      </div>

      <div className="absolute right-4 top-12 h-14 w-2.5 rotate-[20deg] rounded-full bg-[#E0E8FF]" />
      <div className="absolute bottom-8 right-4 size-12 rounded-lg border-2 border-dashed border-[#C3C6D6]/80 bg-[#F9F9FF]" />
    </div>
  );
}
