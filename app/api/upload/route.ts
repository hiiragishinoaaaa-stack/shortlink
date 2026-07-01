import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { STORAGE_BUCKET, supabaseAdmin } from '@/lib/supabaseAdmin';
import { processOgImage, processOriginalImage } from '@/lib/imageOverlay';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

async function uploadToStorage(path: string, buffer: Buffer): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '31536000',
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Accepts either a new image file ("file") or a reference to a
 * previously stored original image ("sourceUrl") so the play-button
 * overlay can be toggled on/off without re-uploading.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const sourceUrl = formData.get('sourceUrl');
    const playOverlayRaw = formData.get('playOverlay');
    const playOverlay = playOverlayRaw === 'true' || playOverlayRaw === '1';

    let originalBuffer: Buffer;
    let originalImageUrl: string;

    if (file instanceof File) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: '画像サイズは8MB以下にしてください。' },
          { status: 400 }
        );
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: '画像ファイルを選択してください。' },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const normalized = await processOriginalImage(Buffer.from(arrayBuffer));
      const id = randomUUID();
      originalImageUrl = await uploadToStorage(
        `originals/${id}.jpg`,
        normalized
      );
      originalBuffer = normalized;
    } else if (typeof sourceUrl === 'string' && sourceUrl.length > 0) {
      const res = await fetch(sourceUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: '元画像の取得に失敗しました。' },
          { status: 400 }
        );
      }
      originalBuffer = Buffer.from(await res.arrayBuffer());
      originalImageUrl = sourceUrl;
    } else {
      return NextResponse.json(
        { error: 'file または sourceUrl のいずれかが必要です。' },
        { status: 400 }
      );
    }

    const ogBuffer = await processOgImage(originalBuffer, playOverlay);
    const ogId = randomUUID();
    const ogImageUrl = await uploadToStorage(`og/${ogId}.jpg`, ogBuffer);

    return NextResponse.json({ ogImageUrl, originalImageUrl });
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json(
      { error: '画像の処理に失敗しました。' },
      { status: 500 }
    );
  }
}
