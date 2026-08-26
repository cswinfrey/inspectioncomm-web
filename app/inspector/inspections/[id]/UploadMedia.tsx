'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getUploadUrl, recordInspectionMedia } from '@/app/inspector/inspections/media-actions';
import { MEDIA_TAG_SUGGESTIONS } from '@/lib/inspection-checklist';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadOnce(
  inspectionId: string,
  file: File,
  tag: string,
  onProgress: (pct: number) => void
) {
  const result = await getUploadUrl(inspectionId, file.name, file.type, file.size);
  if (!result.ok) {
    throw new Error(result.error);
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', result.uploadUrl);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection.'));
    xhr.send(file);
  });

  const record = await recordInspectionMedia(
    inspectionId,
    result.blobUrl,
    file.type,
    file.name,
    file.size,
    tag
  );
  if (!record.ok) {
    throw new Error(record.error);
  }
}

type QueueItem = {
  file: File;
  status: 'pending' | 'uploading' | 'retrying' | 'done' | 'error';
  progress: number;
  error?: string;
};

export function UploadMedia({ inspectionId }: { inspectionId: string }) {
  const [tag, setTag] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tagListId = useId();

  function updateItem(index: number, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function runUploadForIndex(index: number, file: File, batchTag: string) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      updateItem(index, {
        status: attempt > 1 ? 'retrying' : 'uploading',
        progress: 0,
        error: undefined,
      });
      try {
        await uploadOnce(inspectionId, file, batchTag, (pct) => updateItem(index, { progress: pct }));
        updateItem(index, { status: 'done', progress: 100 });
        router.refresh();
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        if (attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }
        updateItem(index, { status: 'error', error: message });
      }
    }
  }

  function processBatch(files: File[], batchTag: string) {
    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        await runUploadForIndex(i, files[i], batchTag);
      }
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setQueue(files.map((file) => ({ file, status: 'pending', progress: 0 })));
    processBatch(files, tag);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRetry(index: number) {
    const item = queue[index];
    if (!item) return;
    startTransition(() => runUploadForIndex(index, item.file, tag));
  }

  const hasErrors = queue.some((item) => item.status === 'error');
  const allDone = queue.length > 0 && queue.every((item) => item.status === 'done');

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-2 mb-2">
        <label className="text-xs text-gray-400 flex flex-col gap-1">
          Tag (which part is this photo of?)
          <input
            type="text"
            list={tagListId}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. Tires, Engine..."
            className="px-3 py-2 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none text-sm"
          />
          <datalist id={tagListId}>
            {MEDIA_TAG_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        disabled={isPending}
        className="text-sm text-gray-300"
      />

      {queue.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {queue.map((item, i) => (
            <li key={`${item.file.name}-${i}`} className="text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span className="truncate max-w-[70%]">{item.file.name}</span>
                <span>
                  {item.status === 'done' && <span className="text-green-400">Done</span>}
                  {item.status === 'error' && <span className="text-red-400">Failed</span>}
                  {(item.status === 'uploading' || item.status === 'retrying') &&
                    `${item.progress}%`}
                </span>
              </div>
              {(item.status === 'uploading' || item.status === 'retrying') && (
                <div className="w-full bg-slate-700 rounded h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-blue-600 h-1.5 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === 'retrying' && (
                <p className="text-yellow-400 mt-1">Retrying...</p>
              )}
              {item.status === 'error' && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-red-400">{item.error}</p>
                  <button
                    onClick={() => handleRetry(i)}
                    disabled={isPending}
                    className="px-2 py-0.5 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {allDone && !hasErrors && (
        <p className="mt-2 text-xs text-green-400">All uploads complete.</p>
      )}
    </div>
  );
}
