import type { LinkRow } from '@/lib/types';

export interface UploadResult {
  ogImageUrl: string;
  originalImageUrl: string;
}

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `リクエストに失敗しました (${res.status})`);
  }
  return data;
}

export async function uploadImage(opts: {
  file?: File;
  sourceUrl?: string;
  playOverlay: boolean;
}): Promise<UploadResult> {
  const formData = new FormData();
  if (opts.file) {
    formData.set('file', opts.file);
  } else if (opts.sourceUrl) {
    formData.set('sourceUrl', opts.sourceUrl);
  }
  formData.set('playOverlay', String(opts.playOverlay));

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await parseJsonOrThrow(res);
  return { ogImageUrl: data.ogImageUrl, originalImageUrl: data.originalImageUrl };
}

export async function fetchLinks(): Promise<LinkRow[]> {
  const res = await fetch('/api/links', { cache: 'no-store' });
  const data = await parseJsonOrThrow(res);
  return data.links;
}

export async function createLink(payload: Record<string, unknown>): Promise<LinkRow> {
  const res = await fetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res);
  return data.link;
}

export async function updateLink(
  id: string,
  payload: Record<string, unknown>
): Promise<LinkRow> {
  const res = await fetch(`/api/links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res);
  return data.link;
}

export async function deleteLink(id: string): Promise<void> {
  const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
  await parseJsonOrThrow(res);
}
