import type { Metadata } from "next";
import { getGalleryImages, getGalleryFolders } from "./actions";
import { GalleryClient } from "./gallery-client";

export const metadata: Metadata = {
  title: "画像保管庫 | Loguly Admin",
};

export default async function GalleryPage() {
  const [images, folders] = await Promise.all([
    getGalleryImages(),
    getGalleryFolders(),
  ]);

  return (
    <GalleryClient
      initialImages={images}
      initialFolders={folders}
    />
  );
}
