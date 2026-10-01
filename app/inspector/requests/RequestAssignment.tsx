'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignRequest } from '@/app/inspector/requests/actions';

type InspectorOption = { id: string; name: string };

const inputClass = 'px-2 py-1 text-xs rounded bg-slate-700 text-white';

// datetime-local wants "YYYY-MM-DDTHH:mm" in the viewer's local time — this
// converts a stored UTC timestamptz into that shape, and back on save.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RequestAssignment({
  requestId,
  inspectors,
  assignedInspectorId,
  appointmentTime,
}: {
  requestId: string;
  inspectors: InspectorOption[];
  assignedInspectorId: string | null;
  appointmentTime: string | null;
}) {
  const [inspectorId, setInspectorId] = useState(assignedInspectorId ?? '');
  const [time, setTime] = useState(toLocalInputValue(appointmentTime));
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError('');
    setJustSaved(false);
    startTransition(async () => {
      const result = await assignRequest(
        requestId,
        inspectorId || null,
        time ? new Date(time).toISOString() : null
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJustSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5 items-start sm:items-end shrink-0">
      <select
        value={inspectorId}
        onChange={(e) => {
          setInspectorId(e.target.value);
          setJustSaved(false);
        }}
        className={inputClass}
      >
        <option value="">Unassigned</option>
        {inspectors.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => {
          setTime(e.target.value);
          setJustSaved(false);
        }}
        className={inputClass}
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
      >
        {isPending ? 'Saving...' : justSaved ? 'Saved' : 'Save assignment'}
      </button>
      {error && <p className="text-xs text-red-400 max-w-40 text-right">{error}</p>}
    </div>
  );
}
