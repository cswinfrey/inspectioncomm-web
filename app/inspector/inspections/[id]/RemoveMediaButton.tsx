'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeInspectionMedia } from '@/app/inspector/inspections/media-actions';

export function RemoveMediaButton({
  mediaId,
  inspectionId,
  fileName,
}: {
  mediaId: string;
  inspectionId: string;
  fileName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const router = useRouter();

  function handleRemove() {
    if (!window.confirm(`Remove "${fileName}" from this inspection?`)) return;
    setMessage('');
    startTransition(async () => {
      const result = await removeInspectionMedia(mediaId, inspectionId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setMessage(result.warning ?? '');
      router.refresh();
    });
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
      >
        {isPending ? 'Removing…' : 'Remove photo'}
      </button>
      {message && (
        <p className="mt-1 text-xs text-red-300" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
