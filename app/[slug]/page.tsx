import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLinkBySlug } from '@/lib/getLinkBySlug';
import { buildShortUrl, getSiteUrl } from '@/lib/siteUrl';
import RedirectButton from '@/components/RedirectButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const link = await getLinkBySlug(params.slug);
  if (!link) {
    return { title: 'リンクが見つかりません' };
  }

  const shortUrl = buildShortUrl(link.slug);
  const images = link.og_image ? [{ url: link.og_image, width: 1200, height: 630 }] : [];

  return {
    metadataBase: new URL(getSiteUrl()),
    title: link.og_title,
    description: link.og_description,
    openGraph: {
      title: link.og_title,
      description: link.og_description,
      url: shortUrl,
      siteName: link.og_title,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: link.og_title,
      description: link.og_description,
      images: link.og_image ? [link.og_image] : [],
    },
  };
}

export default async function SlugPage({ params }: PageProps) {
  const link = await getLinkBySlug(params.slug);
  if (!link) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-lg space-y-6">
        {link.og_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.og_image}
            alt={link.og_title}
            className="aspect-[1200/630] w-full rounded-lg object-cover shadow-lg"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{link.og_title}</h1>
          {link.og_description && (
            <p className="mt-2 text-sm text-neutral-400">{link.og_description}</p>
          )}
        </div>
        <RedirectButton
          slug={link.slug}
          destinationUrl={link.destination_url}
          buttonText={link.button_text}
        />
      </div>
    </main>
  );
}
