'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getUploadUrl, recordInspectionMedia } from '@/app/inspector/inspections/media-actions';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadOnce(inspectionId: string, file: File, onProgress: (pct: number) => void) {
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
    file.size
  );
  if (!record.ok) {
    throw new Error(record.error);
  }
}

export function UploadMedia({ inspectionId }: { inspectionId: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function attemptUpload(file: File) {
    startTransition(async () => {
      setError('');

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setRetrying(attempt > 1 ? attempt : 0);
        setProgress(0);
        try {
          await uploadOnce(inspectionId, file, setProgress);
          setSelectedFile(null);
          if (inputRef.current) inputRef.current.value = '';
          setProgress(null);
          setRetrying(0);
          router.refresh();
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed.';
          if (attempt < MAX_ATTEMPTS) {
            await delay(RETRY_DELAY_MS * attempt);
            continue;
          }
          setError(message);
          setProgress(null);
          setRetrying(0);
          // Keep selectedFile so "Try Again" can resubmit without reselecting.
          return;
        }
      }
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    attemptUpload(file);
  }

  function handleTryAgain() {
    if (selectedFile) attemptUpload(selectedFile);
  }

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        disabled={isPending}
        className="text-sm text-gray-300"
      />
      {progress !== null && (
        <div className="mt-2">
          <div className="w-full bg-slate-700 rounded h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {retrying > 0 && (
            <p className="mt-1 text-xs text-yellow-400">
              Retrying (attempt {retrying} of {MAX_ATTEMPTS})...
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm text-red-400">{error}</p>
          {selectedFile && (
            <button
              onClick={handleTryAgain}
              disabled={isPending}
              className="px-2 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
