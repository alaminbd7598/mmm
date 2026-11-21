/**
 * URL safety rules shared by the browser (what may be rendered) and the server (what may be
 * stored). Pure: no DOM or Node APIs beyond `URL`.
 */

const INLINE_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i;
const SITE_PATH_RE = /^\/(?!\/)/;
const HTTP_RE = /^https?:\/\//i;

/** http(s), a same-site path, or an inline raster image; anything else becomes ''. */
export function safeImageUrl(value: string | undefined | null): string {
  const url = String(value || '').trim();
  if (!url) return '';
  if (HTTP_RE.test(url) || SITE_PATH_RE.test(url) || INLINE_IMAGE_RE.test(url)) return url;
  return '';
}

/** http(s), mailto and same-site paths/anchors survive; everything else becomes ''. */
export function safeLinkUrl(value: string | undefined | null): string {
  const url = String(value || '').trim();
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  if (SITE_PATH_RE.test(url) || url.startsWith('#')) return url;
  return '';
}

/** Hosts the site may show inside an <iframe> (keep in step with `frame-src` in next.config.mjs). */
const EMBED_HOSTS: readonly string[] = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'www.facebook.com',
  'web.facebook.com',
  'facebook.com',
  'www.google.com',
  'google.com',
  'maps.google.com',
  'player.vimeo.com',
  'drive.google.com',
];

function parseHttps(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Hostname of an https URL, lower-cased; '' for anything else. */
export function httpsHostOf(value: string | undefined | null): string {
  return parseHttps(String(value || '').trim())?.hostname.toLowerCase() || '';
}

/** True when the URL is https and its host is one of the embed providers the site uses. */
export function isAllowedEmbedUrl(value: string | undefined | null): boolean {
  const host = httpsHostOf(value);
  return host !== '' && EMBED_HOSTS.includes(host);
}

/** True for a Google Maps embed URL on a Google host (the only maps iframe sources accepted). */
export function isGoogleMapsEmbedUrl(value: string | undefined | null): boolean {
  const url = parseHttps(String(value || '').trim());
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  if (host !== 'www.google.com' && host !== 'google.com' && host !== 'maps.google.com') return false;
  return url.pathname.startsWith('/maps') && (url.pathname.includes('/embed') || url.searchParams.get('output') === 'embed');
}

/** Direct media files may be played in a <video> element from http(s) or a same-site path. */
export function isSafeMediaUrl(value: string | undefined | null): boolean {
  const url = String(value || '').trim();
  return HTTP_RE.test(url) || SITE_PATH_RE.test(url);
}

const SCRIPT_SCHEME_RE = /^[\s\u0000-\u001f]*(javascript|vbscript|livescript)\s*:/i;
const DATA_SCHEME_RE = /^[\s\u0000-\u001f]*data\s*:/i;
/** Inline files the CMS stores on purpose: images, PDF/Word documents, audio and video. */
const STORABLE_DATA_RE =
  /^data:(image\/(png|jpe?g|webp|gif|avif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+)(;[a-z0-9-]+=[a-z0-9.+-]+)*;base64,/i;

/** True when a stored string would be dangerous if it ever reached an href, src or iframe. */
export function isUnsafeStoredString(value: string): boolean {
  if (SCRIPT_SCHEME_RE.test(value)) return true;
  return DATA_SCHEME_RE.test(value) && !STORABLE_DATA_RE.test(value.trimStart());
}

/** Field names that hold a URL (`logoUrl`, `groupLink`, `url`, `imageUrls`, ...). */
const URL_FIELD_RE = /(url|uri|link|href|src)s?$/i;
/** URL fields that end up in a link or an <iframe>: these never take inline data. */
const LINK_OR_EMBED_FIELD_RE = /(embed|map|video|link|post|facebook|youtube|portal|canonical|room|zoom|href)/i;
/** URL fields that may carry an uploaded document (CV, notice attachment). */
const FILE_FIELD_RE = /(cv|file|document|attachment|pdf|prospectus)/i;
const DOCUMENT_DATA_RE =
  /^data:application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)(;[a-z0-9-]+=[a-z0-9.+-]+)*;base64,/i;
const EXPLICIT_SCHEME_RE = /^[\s\u0000-\u001f]*([a-z][a-z0-9+.-]*):/i;
const LINK_SCHEMES: readonly string[] = ['http', 'https', 'mailto', 'tel'];

export const isUrlFieldName = (field: string): boolean => URL_FIELD_RE.test(field);

/**
 * Whether `value` may be stored in the URL field `field`. Values without a scheme (same-site
 * paths, anchors, plain file names) always pass. With a scheme only http(s), mailto and tel are
 * accepted, plus inline data where it is expected: a raster image in image fields (never in link
 * or embed fields) and a PDF / Word document in file fields.
 */
export function isAllowedUrlFieldValue(field: string, value: string): boolean {
  const scheme = EXPLICIT_SCHEME_RE.exec(value)?.[1].toLowerCase();
  if (!scheme || LINK_SCHEMES.includes(scheme)) return true;
  if (scheme !== 'data' || LINK_OR_EMBED_FIELD_RE.test(field)) return false;
  const data = value.trimStart();
  return INLINE_IMAGE_RE.test(data) || (FILE_FIELD_RE.test(field) && DOCUMENT_DATA_RE.test(data));
}

/**
 * Path (e.g. `settings.logoUrl`) of the first string anywhere inside `value` that may not be
 * stored, or null when the document is clean: a script URL or non-media data URL in any field,
 * or a URL field (see isAllowedUrlFieldValue) with a scheme or inline data it must not carry.
 * `field` is the name of the property holding `value` (array items inherit their array's name).
 */
export function findUnsafeString(value: unknown, path = '', field = ''): string | null {
  if (typeof value === 'string') {
    const unsafe = isUnsafeStoredString(value) || (isUrlFieldName(field) && !isAllowedUrlFieldValue(field, value));
    return unsafe ? path || '(value)' : null;
  }
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findUnsafeString(value[i], `${path}[${i}]`, field);
      if (found) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const found = findUnsafeString(child, path ? `${path}.${key}` : key, key);
    if (found) return found;
  }
  return null;
}
