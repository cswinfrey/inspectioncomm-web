import 'server-only';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { getAzureStorageAccountKey } from '@/lib/azure-secrets';

const ACCOUNT_NAME = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME!;
const CONTAINER_NAME = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME!;
const BASE_URL = `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/`;

// The container is private (no public read), so a bare stored file_url
// isn't actually viewable — every render needs a fresh, short-lived
// read-SAS URL. blobUrl is the plain https://...blob.core.windows.net/...
// URL stored in inspection_media.file_url; this derives the blob name from
// it and signs a 1-hour read-only URL.
export async function getReadUrl(blobUrl: string): Promise<string> {
  if (!blobUrl.startsWith(BASE_URL)) {
    // Not a blob in our container (shouldn't happen) — return as-is rather
    // than throw, so a single bad row doesn't break the whole page.
    return blobUrl;
  }
  const blobName = decodeURIComponent(blobUrl.slice(BASE_URL.length));

  const accountKey = await getAzureStorageAccountKey();
  const credential = new StorageSharedKeyCredential(ACCOUNT_NAME, accountKey);

  const now = Date.now();
  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      startsOn: new Date(now - 5 * 60 * 1000),
      expiresOn: new Date(now + 60 * 60 * 1000),
    },
    credential
  ).toString();

  return `${blobUrl}?${sas}`;
}

export async function getReadUrls<T extends { file_url: string }>(
  media: T[]
): Promise<(T & { read_url: string })[]> {
  return Promise.all(
    media.map(async (item) => ({ ...item, read_url: await getReadUrl(item.file_url) }))
  );
}
