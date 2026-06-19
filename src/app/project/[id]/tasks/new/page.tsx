import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CreateTaskForm from './CreateTaskForm';

export default function CreateTaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#0046AD]" />
        </div>
      }
    >
      <CreateTaskForm params={params} />
    </Suspense>
  );
}
