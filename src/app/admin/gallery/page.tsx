import type { Metadata } from "next";
import { getGalleryImages, getGalleryStorageUsage, getGalleryFolders } from "./actions";
import { GalleryClient } from "./gallery-client";

export const metadata: Metadata = {
  title: "画像保管庫 | Loguly Admin",
};

export default async function GalleryPage() {
  const [images, storageUsage, folders] = await Promise.all([
    getGalleryImages(),
    getGalleryStorageUsage(),
    getGalleryFolders(),
  ]);

  return (
    <GalleryClient
      initialImages={images}
      initialStorageUsage={storageUsage}
      initialFolders={folders}
    />
  );
}
