'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getUploadUrl, recordInspectionMedia } from '@/app/inspector/inspections/media-actions';

export function UploadMedia({ inspectionId }: { inspectionId: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function uploadFile(file: File) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setError('');
          setProgress(0);

          const result = await getUploadUrl(inspectionId, file.name, file.type, file.size);
          if (!result.ok) {
            throw new Error(result.error);
          }

          await new Promise<void>((res, rej) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', result.uploadUrl);
            xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                setProgress(Math.round((event.loaded / event.total) * 100));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) res();
              else rej(new Error(`Upload failed (${xhr.status})`));
            };
            xhr.onerror = () => rej(new Error('Upload failed'));
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

          router.refresh();
          resolve();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed.');
          reject(err);
        } finally {
          setProgress(null);
          if (inputRef.current) inputRef.current.value = '';
        }
      });
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadFile(file).catch(() => {
      // Error state is already set inside uploadFile.
    });
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
        <div className="mt-2 w-full bg-slate-700 rounded h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
