'use server';

import { randomUUID } from 'crypto';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAzureStorageAccountKey } from '@/lib/azure-secrets';

const ACCOUNT_NAME = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME!;
const CONTAINER_NAME = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME!;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
]);
const MAX_SIZE_BYTES = 200 * 1024 * 1024;

export type UploadUrlResult =
  | { ok: true; uploadUrl: string; blobUrl: string }
  | { ok: false; error: string };

export async function getUploadUrl(
  inspectionId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<UploadUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not authenticated.' };
  }

  if (!ALLOWED_TYPES.has(fileType)) {
    return { ok: false, error: 'Unsupported file type.' };
  }
  if (fileSize > MAX_SIZE_BYTES) {
    return { ok: false, error: 'File is too large (200MB max).' };
  }

  // Belt-and-suspenders: RLS also enforces this on the eventual DB insert,
  // but check ownership here too before minting a write-capable SAS.
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id')
    .eq('id', inspectionId)
    .eq('inspector_id', user.id)
    .maybeSingle();

  if (!inspection) {
    return { ok: false, error: 'Inspection not found.' };
  }

  const accountKey = await getAzureStorageAccountKey();
  const credential = new StorageSharedKeyCredential(ACCOUNT_NAME, accountKey);

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blobName = `${inspectionId}/${randomUUID()}-${safeName}`;

  const now = Date.now();
  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),
      protocol: SASProtocol.Https,
      startsOn: new Date(now - 5 * 60 * 1000),
      expiresOn: new Date(now + 10 * 60 * 1000),
    },
    credential
  ).toString();

  const blobUrl = `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}`;

  return { ok: true, uploadUrl: `${blobUrl}?${sas}`, blobUrl };
}

export type RecordMediaResult = { ok: true } | { ok: false; error: string };

export async function recordInspectionMedia(
  inspectionId: string,
  fileUrl: string,
  fileType: string,
  fileName: string,
  fileSizeBytes: number
): Promise<RecordMediaResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not authenticated.' };
  }

  const { error } = await supabase.from('inspection_media').insert({
    inspection_id: inspectionId,
    file_url: fileUrl,
    file_type: fileType,
    file_name: fileName,
    file_size_bytes: fileSizeBytes,
  });

  if (error) {
    return { ok: false, error: 'Could not save the upload.' };
  }

  revalidatePath(`/inspector/inspections/${inspectionId}`);
  return { ok: true };
}
