import { parse } from "exifr";

export interface OrderedPhoto {
  file: File;
  capturedAt: Date | null;
}

// "Grid, ordered by EXIF timestamp where available, falling back to
// file order" (session-pack.md, Session 5b) — photos taken earlier
// with the phone's own camera app, not our capture, so EXIF is the
// only signal of when they were actually shot. Per-file try/catch: one
// photo missing EXIF (a screenshot, a re-exported image) shouldn't
// break ordering for the rest of the batch.
export async function orderPhotosByExif(files: File[]): Promise<OrderedPhoto[]> {
  const withMeta = await Promise.all(
    files.map(async (file, originalIndex) => {
      let capturedAt: Date | null;
      try {
        const exif = (await parse(file, { pick: ["DateTimeOriginal"] })) as { DateTimeOriginal?: Date } | undefined;
        capturedAt = exif?.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal : null;
      } catch {
        capturedAt = null;
      }
      return { file, capturedAt, originalIndex };
    }),
  );

  return withMeta
    .sort((a, b) => {
      if (a.capturedAt && b.capturedAt) return a.capturedAt.getTime() - b.capturedAt.getTime();
      if (a.capturedAt) return -1;
      if (b.capturedAt) return 1;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ file, capturedAt }) => ({ file, capturedAt }));
}
