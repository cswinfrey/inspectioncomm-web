'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateRequestStatus } from '@/app/inspector/requests/actions';

const STATUSES = ['new', 'contacted', 'scheduled', 'closed'];

export function RequestStatusSelect({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setError('');
    startTransition(async () => {
      const result = await updateRequestStatus(requestId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <select
        defaultValue={status}
        onChange={handleChange}
        disabled={isPending}
        className="px-2 py-1 text-xs rounded bg-slate-700 text-white disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
