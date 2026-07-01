export const SLUG_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const RESERVED_SLUGS = new Set(['api', 'favicon.ico', '_next']);

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug.toLowerCase());
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
