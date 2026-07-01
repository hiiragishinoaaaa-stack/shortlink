'use client';

import { useState } from 'react';
import type { LinkRow } from '@/lib/types';
import { buildShortUrl } from '@/lib/siteUrl';
import { deleteLink } from '@/lib/clientApi';
import EditLinkDialog from '@/components/EditLinkDialog';

export default function LinkList({
  links,
  onChange,
}: {
  links: LinkRow[];
  onChange: (links: LinkRow[]) => void;
}) {
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(link: LinkRow) {
    if (!confirm(`「${link.slug}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    setDeletingId(link.id);
    try {
      await deleteLink(link.id);
      onChange(links.filter((l) => l.id !== link.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました。');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCopy(link: LinkRow) {
    const url = buildShortUrl(link.slug);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (links.length === 0) {
    return <p className="text-sm text-neutral-400">まだリンクがありません。</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {links.map((link) => {
          const shortUrl = buildShortUrl(link.slug);
          return (
            <li
              key={link.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 sm:flex-row sm:items-center"
            >
              {link.og_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={link.og_image}
                  alt={link.og_title}
                  className="aspect-[1200/630] w-full max-w-[160px] flex-shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{link.og_title}</p>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm text-emerald-400 hover:underline"
                >
                  {shortUrl}
                </a>
                <p className="truncate text-xs text-neutral-500">
                  → {link.destination_url}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  クリック数: {link.click_count}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-wrap gap-2">
                <button onClick={() => handleCopy(link)} className="btn-secondary">
                  {copiedId === link.id ? 'コピーしました' : 'URLコピー'}
                </button>
                <button onClick={() => setEditing(link)} className="btn-secondary">
                  編集
                </button>
                <button
                  onClick={() => handleDelete(link)}
                  disabled={deletingId === link.id}
                  className="btn-danger"
                >
                  {deletingId === link.id ? '削除中...' : '削除'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <EditLinkDialog
          link={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            onChange(links.map((l) => (l.id === updated.id ? updated : l)))
          }
        />
      )}
    </>
  );
}
