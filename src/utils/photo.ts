/**
 * Separate localStorage key for the artisan's profile photo (base64 data URI).
 * Stored separately to avoid bloating the main artisan JSON object.
 */
const PHOTO_KEY = 'jc_artisan_photo';

/**
 * Save the profile photo as a base64 data URI.
 */
export function saveArtisanPhoto(dataUri: string): void {
  try {
    localStorage.setItem(PHOTO_KEY, dataUri);
  } catch (e) {
    // Possible QuotaExceededError — silently ignore in prototype
    console.warn('Could not save photo to localStorage:', e);
  }
}

/**
 * Load the saved profile photo data URI, or null if not set.
 */
export function loadArtisanPhoto(): string | null {
  return localStorage.getItem(PHOTO_KEY);
}

/**
 * Delete the saved profile photo from localStorage.
 */
export function deleteArtisanPhoto(): void {
  localStorage.removeItem(PHOTO_KEY);
}

/**
 * Compress and resize an image File/Blob to a JPEG data URI.
 * Target: max 400×400 px, quality 0.75 — small enough for localStorage.
 */
export function compressImageToDataUri(
  file: File | Blob,
  maxSize = 400,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        // Scale down keeping aspect ratio
        if (w > maxSize || h > maxSize) {
          if (w >= h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
