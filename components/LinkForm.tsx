'use client';

import { useState } from 'react';
import type { LinkRow } from '@/lib/types';
import { createLink, updateLink, uploadImage } from '@/lib/clientApi';

interface LinkFormProps {
  mode: 'create' | 'edit';
  link?: LinkRow;
  onSuccess: (link: LinkRow) => void;
  onCancel?: () => void;
}

export default function LinkForm({ mode, link, onSuccess, onCancel }: LinkFormProps) {
  const [slug, setSlug] = useState(link?.slug ?? '');
  const [destinationUrl, setDestinationUrl] = useState(link?.destination_url ?? '');
  const [ogTitle, setOgTitle] = useState(link?.og_title ?? '');
  const [ogDescription, setOgDescription] = useState(link?.og_description ?? '');
  const [buttonText, setButtonText] = useState(link?.button_text ?? 'タップで再生 ▶');
  const [playOverlay, setPlayOverlay] = useState(link?.play_overlay ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(link?.og_image ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!slug.trim() || !destinationUrl.trim() || !ogTitle.trim()) {
      setError('slug・遷移先URL・カードタイトルは必須です。');
      return;
    }
    if (mode === 'create' && !imageFile) {
      setError('カード画像をアップロードしてください。');
      return;
    }

    setSubmitting(true);
    try {
      let ogImageUrl = link?.og_image ?? null;
      let originalImageUrl = link?.original_image ?? null;

      const overlayChanged = mode === 'edit' && link && playOverlay !== link.play_overlay;

      if (imageFile) {
        const result = await uploadImage({ file: imageFile, playOverlay });
        ogImageUrl = result.ogImageUrl;
        originalImageUrl = result.originalImageUrl;
      } else if (overlayChanged && originalImageUrl) {
        const result = await uploadImage({
          sourceUrl: originalImageUrl,
          playOverlay,
        });
        ogImageUrl = result.ogImageUrl;
        originalImageUrl = result.originalImageUrl;
      }

      const payload = {
        slug: slug.trim(),
        destination_url: destinationUrl.trim(),
        og_title: ogTitle.trim(),
        og_description: ogDescription.trim(),
        button_text: buttonText.trim() || 'タップで再生 ▶',
        play_overlay: playOverlay,
        og_image: ogImageUrl,
        original_image: originalImageUrl,
      };

      const result =
        mode === 'create'
          ? await createLink(payload)
          : await updateLink(link!.id, payload);

      onSuccess(result);

      if (mode === 'create') {
        setSlug('');
        setDestinationUrl('');
        setOgTitle('');
        setOgDescription('');
        setButtonText('タップで再生 ▶');
        setPlayOverlay(true);
        setImageFile(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-700 bg-neutral-900 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="slug" required>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="aespa001"
            className="input"
          />
        </Field>
        <Field label="遷移先URL" required>
          <input
            type="text"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://onelink.me/xxxx"
            className="input"
          />
        </Field>
      </div>

      <Field label="カードタイトル" required>
        <input
          type="text"
          value={ogTitle}
          onChange={(e) => setOgTitle(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="カード説明">
        <textarea
          value={ogDescription}
          onChange={(e) => setOgDescription(e.target.value)}
          rows={2}
          className="input"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="カード画像アップロード" required={mode === 'create'}>
          <input type="file" accept="image/*" onChange={handleFileChange} className="input" />
        </Field>
        <Field label="ボタン文言">
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={playOverlay}
          onChange={(e) => setPlayOverlay(e.target.checked)}
        />
        再生ボタンを画像に合成する
      </label>

      {previewUrl && (
        <div className="overflow-hidden rounded-md border border-neutral-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="プレビュー" className="aspect-[1200/630] w-full max-w-md object-cover" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? '処理中...' : mode === 'create' ? 'リンクを作成' : '保存'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-neutral-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
