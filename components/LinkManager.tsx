'use client';

import { useState } from 'react';
import type { LinkRow } from '@/lib/types';
import { buildShortUrl } from '@/lib/siteUrl';
import LinkForm from '@/components/LinkForm';
import LinkList from '@/components/LinkList';

export default function LinkManager({ initialLinks }: { initialLinks: LinkRow[] }) {
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);

  function handleCreated(link: LinkRow) {
    setLinks((prev) => [link, ...prev]);
    setLastCreatedUrl(buildShortUrl(link.slug));
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">新しいリンクを作成</h2>
        <LinkForm mode="create" onSuccess={handleCreated} />
        {lastCreatedUrl && (
          <div className="mt-4 rounded-md border border-emerald-700 bg-emerald-950 p-4 text-sm">
            作成しました:{' '}
            <a href={lastCreatedUrl} target="_blank" rel="noreferrer" className="font-medium text-emerald-300 underline">
              {lastCreatedUrl}
            </a>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">作成済みリンク一覧</h2>
        <LinkList links={links} onChange={setLinks} />
      </section>
    </div>
  );
}
