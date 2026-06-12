import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface ProjectBreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function ProjectBreadcrumb({ items }: ProjectBreadcrumbProps) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#4A5568] uppercase">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight size={12} className="shrink-0 text-[#CBD5E1]" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-[#0046AD]">
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? 'text-[#0046AD]' : 'text-[#4A5568]'}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
