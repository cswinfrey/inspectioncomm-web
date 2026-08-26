'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMediaTag } from '@/app/inspector/inspections/media-actions';
import { MEDIA_TAG_SUGGESTIONS } from '@/lib/inspection-checklist';

export function MediaTagInput({
  mediaId,
  inspectionId,
  initialTag,
}: {
  mediaId: string;
  inspectionId: string;
  initialTag: string | null;
}) {
  const [value, setValue] = useState(initialTag ?? '');
  const [savedValue, setSavedValue] = useState(initialTag ?? '');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const listId = useId();

  function handleBlur() {
    if (value === savedValue) return;
    startTransition(async () => {
      const result = await updateMediaTag(mediaId, inspectionId, value);
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
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Label (e.g. Left front tire)"
        disabled={isPending}
        className="w-full text-xs px-2 py-1 rounded bg-slate-800 text-white placeholder-gray-500 focus:outline-none disabled:opacity-60"
      />
      <datalist id={listId}>
        {MEDIA_TAG_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {isPending && <p className="text-[10px] text-gray-400 mt-0.5">Saving...</p>}
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
