import { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MediaListClient } from "../media-list-client";
import { fetchMediaItems } from "../fetch-media";

export const metadata: Metadata = {
  title: "Видео",
  description: "Видеоматериалы компании Новтекас",
};

export default async function VideosPage() {
  const items = await fetchMediaItems();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Видео</h1>
      <p className="mt-2 text-muted-foreground">
        Видеоматериалы о продукции и технологиях.
      </p>

      <MediaListClient items={items} currentType="video" />
    </div>
  );
}
