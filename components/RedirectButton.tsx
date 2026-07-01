'use client';

import { useState } from 'react';

export default function RedirectButton({
  slug,
  destinationUrl,
  buttonText,
}: {
  slug: string;
  destinationUrl: string;
  buttonText: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/click/${encodeURIComponent(slug)}`, { method: 'POST' });
    } catch {
      // Recording the click is best-effort; never block navigation on it.
    } finally {
      window.location.href = destinationUrl;
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary px-6 py-3 text-base"
    >
      {loading ? '読み込み中...' : buttonText}
    </button>
  );
}
