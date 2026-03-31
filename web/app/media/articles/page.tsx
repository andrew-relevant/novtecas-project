import { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MediaListClient } from "../media-list-client";
import { fetchMediaItems } from "../fetch-media";

export const metadata: Metadata = {
  title: "Статьи",
  description: "Статьи и публикации компании Новтекас",
};

export default async function ArticlesPage() {
  const items = await fetchMediaItems();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Статьи</h1>
      <p className="mt-2 text-muted-foreground">
        Полезные статьи и материалы.
      </p>

      <MediaListClient items={items} currentType="article" />
    </div>
  );
}
