/**
 * Browser-side image preparation for uploads that are stored inline (student photos).
 * Phone cameras produce 3–10 MB pictures; the server accepts 1.5 MB, so large pictures are
 * scaled down and re-encoded as JPEG before they are attached to a form.
 */
import { MAX_PHOTO_BYTES } from '../server/contracts';

/**
 * Decoded size the form aims for: ample for a passport-style photo and far below the server limit
 * (MAX_PHOTO_BYTES), because every stored photo counts against the site's upload storage.
 */
export const UPLOAD_PHOTO_TARGET_BYTES = 350_000;

/** Thrown when a picture is still above the size the server accepts after every attempt to shrink it. */
export class PhotoTooLargeError extends Error {
  constructor() {
    super('The photo is too large.');
    this.name = 'PhotoTooLargeError';
  }
}

export const dataUrlBytes = (dataUrl: string): number => Math.floor(((dataUrl.split(',')[1] || '').length * 3) / 4);

const readAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('unreadable file')));
    reader.onerror = () => reject(new Error('unreadable file'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('not an image'));
    img.src = src;
  });

/**
 * What to attach when no re-encoding reached the target size: the smallest version that the
 * server would still accept (`limitBytes`), else nothing. Throws PhotoTooLargeError in that case,
 * so the form can say so at once instead of sending a file that is certain to be refused.
 */
export function smallestAcceptable(candidates: readonly string[], limitBytes: number): string {
  let best: string | null = null;
  for (const candidate of candidates) {
    if (dataUrlBytes(candidate) > limitBytes) continue;
    if (best === null || dataUrlBytes(candidate) < dataUrlBytes(best)) best = candidate;
  }
  if (best === null) throw new PhotoTooLargeError();
  return best;
}

/**
 * The picture as a data URL no larger than `maxBytes` (when the browser can decode it).
 * Small pictures are returned unchanged; larger ones are scaled to at most `maxSide` pixels and
 * re-encoded with decreasing JPEG quality until they fit. A picture that cannot be brought under
 * `limitBytes` (the server's limit) is rejected with PhotoTooLargeError.
 */
export async function photoFileToDataUrl(
  file: Blob,
  maxBytes: number = UPLOAD_PHOTO_TARGET_BYTES,
  maxSide = 1200,
  limitBytes: number = MAX_PHOTO_BYTES
): Promise<string> {
  const original = await readAsDataUrl(file);
  if (dataUrlBytes(original) <= maxBytes) return original;
  /** Smallest re-encoding so far, in case none reaches the target. */
  let smallest: string | null = null;
  try {
    const img = await loadImage(original);
    let side = maxSide;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58]) {
        const encoded = canvas.toDataURL('image/jpeg', quality);
        if (dataUrlBytes(encoded) <= maxBytes) return encoded;
        if (smallest === null || dataUrlBytes(encoded) < dataUrlBytes(smallest)) smallest = encoded;
      }
      side = Math.round(side * 0.75);
    }
  } catch {
    // Not decodable in this browser: the original is used if the server would accept its size.
  }
  return smallestAcceptable(smallest === null ? [original] : [smallest, original], limitBytes);
}
