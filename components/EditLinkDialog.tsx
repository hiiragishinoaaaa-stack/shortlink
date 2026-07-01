'use client';

import type { LinkRow } from '@/lib/types';
import LinkForm from '@/components/LinkForm';

export default function EditLinkDialog({
  link,
  onClose,
  onSaved,
}: {
  link: LinkRow;
  onClose: () => void;
  onSaved: (link: LinkRow) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-neutral-950 p-1">
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="text-lg font-semibold">リンクを編集</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white" aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="p-4">
          <LinkForm
            mode="edit"
            link={link}
            onCancel={onClose}
            onSuccess={(updated) => {
              onSaved(updated);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
