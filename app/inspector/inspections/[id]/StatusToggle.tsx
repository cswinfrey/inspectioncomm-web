'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setInspectionStatus } from '@/app/inspector/inspections/actions';

export function StatusToggle({
  inspectionId,
  status,
}: {
  inspectionId: string;
  status: string;
}) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    setError('');
    const next = status === 'completed' ? 'in_progress' : 'completed';
    startTransition(async () => {
      const result = await setInspectionStatus(inspectionId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60"
      >
        {isPending
          ? '...'
          : status === 'completed'
            ? 'Reopen'
            : 'Mark Complete'}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
