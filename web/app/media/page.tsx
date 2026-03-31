import { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MediaListClient } from "./media-list-client";
import { fetchMediaItems } from "./fetch-media";

export const metadata: Metadata = {
  title: "Полезное",
  description: "Новости, статьи и видеоматериалы компании Новтекас",
};

export default async function MediaPage() {
  const items = await fetchMediaItems();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Полезное</h1>
      <p className="mt-2 text-muted-foreground">
        Новости, статьи и публикации компании.
      </p>

      <MediaListClient items={items} currentType="all" />
    </div>
  );
}
