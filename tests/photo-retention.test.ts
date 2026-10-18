import { describe, expect, it } from "vitest";
import { PHOTO_GRACE_MS, selectOrphanPhotos } from "@/lib/photo-retention";

const now = new Date("2026-10-18T12:00:00Z");
const old = (pathname: string) => ({ pathname, uploadedAt: new Date(now.getTime() - PHOTO_GRACE_MS - 1) });
const fresh = (pathname: string) => ({ pathname, uploadedAt: new Date(now.getTime() - 1000) });

describe("selectOrphanPhotos", () => {
  it("keeps photos a visitor row still references", () => {
    const referenced = new Set(["visitors/a/face.jpg"]);
    expect(selectOrphanPhotos([old("visitors/a/face.jpg")], referenced, now)).toEqual([]);
  });

  it("selects unreferenced photos past the grace window", () => {
    const blobs = [old("visitors/x/face.jpg"), old("visitors/x/id.jpg")];
    expect(selectOrphanPhotos(blobs, new Set(), now)).toEqual([
      "visitors/x/face.jpg",
      "visitors/x/id.jpg",
    ]);
  });

  it("keeps a just-uploaded photo that has no visitor row yet", () => {
    expect(selectOrphanPhotos([fresh("visitors/y/face.jpg")], new Set(), now)).toEqual([]);
  });

  it("deletes only the unreferenced photos in a mixed page", () => {
    const blobs = [old("visitors/a/id.jpg"), old("visitors/b/face.jpg"), fresh("visitors/b/id.jpg")];
    const referenced = new Set(["visitors/a/id.jpg"]);
    expect(selectOrphanPhotos(blobs, referenced, now)).toEqual(["visitors/b/face.jpg"]);
  });
});
