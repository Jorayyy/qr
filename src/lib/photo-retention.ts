/** Never delete a photo uploaded this recently — a registration may be in flight. */
export const PHOTO_GRACE_MS = 60 * 60 * 1000;

/** Blob photos that no Visitor row references (and are past the grace window). */
export function selectOrphanPhotos(
  blobs: Array<{ pathname: string; uploadedAt: Date }>,
  referenced: Set<string>,
  now: Date
): string[] {
  return blobs
    .filter((blob) => !referenced.has(blob.pathname) && now.getTime() - blob.uploadedAt.getTime() > PHOTO_GRACE_MS)
    .map((blob) => blob.pathname);
}
