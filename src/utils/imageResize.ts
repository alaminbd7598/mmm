/**
 * Browser-side image preparation for uploads that are stored inline (student photos).
 * Phone cameras produce 3–10 MB pictures; the server accepts 1.5 MB, so large pictures are
 * scaled down and re-encoded as JPEG before they are attached to a form.
 */

/** Decoded size the form aims for; safely below the server limit (MAX_PHOTO_BYTES). */
export const UPLOAD_PHOTO_TARGET_BYTES = 1_200_000;

const dataUrlBytes = (dataUrl: string): number => Math.floor(((dataUrl.split(',')[1] || '').length * 3) / 4);

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
 * The picture as a data URL no larger than `maxBytes` (when the browser can decode it).
 * Small pictures are returned unchanged; larger ones are scaled to at most `maxSide` pixels and
 * re-encoded with decreasing JPEG quality until they fit.
 */
export async function photoFileToDataUrl(
  file: Blob,
  maxBytes: number = UPLOAD_PHOTO_TARGET_BYTES,
  maxSide = 1600
): Promise<string> {
  const original = await readAsDataUrl(file);
  if (dataUrlBytes(original) <= maxBytes) return original;
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
      }
      side = Math.round(side * 0.75);
    }
  } catch {
    // Not decodable here: send it as it is and let the server's answer explain.
  }
  return original;
}
