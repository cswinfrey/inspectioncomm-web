'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMediaDescription } from '@/app/inspector/inspections/media-actions';

export function MediaDescriptionInput({
  mediaId,
  inspectionId,
  initialDescription,
}: {
  mediaId: string;
  inspectionId: string;
  initialDescription: string | null;
}) {
  const [value, setValue] = useState(initialDescription ?? '');
  const [savedValue, setSavedValue] = useState(initialDescription ?? '');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleBlur() {
    if (value === savedValue) return;
    startTransition(async () => {
      const result = await updateMediaDescription(mediaId, inspectionId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError('');
      setSavedValue(value);
      router.refresh();
    });
  }

  return (
    <div className="mt-1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Description"
        rows={2}
        disabled={isPending}
        className="w-full text-xs px-2 py-1 rounded bg-slate-800 text-white placeholder-gray-500 focus:outline-none disabled:opacity-60 resize-y"
      />
      {isPending && <p className="text-[10px] text-gray-400 mt-0.5">Saving...</p>}
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
