import imageCompression from "browser-image-compression";

export interface CompressedPhoto {
  photo: Blob;
  thumbnail: Blob;
  photoSizeBytes: number;
}

// Entirely client-side, before any network call (session-pack.md,
// Session 5a) — resize to a 1600px long edge, WebP re-encode targeting
// ≤200KB, plus a 320px thumbnail for the session-summary/progress-strip
// work Session 5b adds on top. browser-image-compression is the
// library blueprint.md's stack table names for this (Part 1), not a
// hand-rolled Canvas resize.
export async function compressAnimalPhoto(file: File): Promise<CompressedPhoto> {
  const photo = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.2,
    fileType: "image/webp",
    useWebWorker: true,
  });

  const thumbnail = await imageCompression(file, {
    maxWidthOrHeight: 320,
    maxSizeMB: 0.05,
    fileType: "image/webp",
    useWebWorker: true,
  });

  return { photo, thumbnail, photoSizeBytes: photo.size };
}
