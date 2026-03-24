import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, MediaItem } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MediaListClient } from "./media-list-client";

export const metadata: Metadata = {
  title: "Полезное",
  description: "Новости, статьи и видеоматериалы компании Новтекас",
};

export default async function MediaPage() {
  const { data } = await fetchStrapi<StrapiResponse<MediaItem[]>>(
    "/media-items",
    {
      params: {
        "populate": "*",
        "sort": "Date:desc",
        "pagination[pageSize]": "100",
      },
      fallback: { data: [], meta: {} },
    },
  );

  const items = data.map((entry) => ({
    id: entry.id,
    title: entry.Title,
    slug: entry.Slug,
    date: entry.Date,
    type: entry.Type,
    excerpt: entry.Short_Text,
    imageUrl: entry.Image_Preview?.url ?? null,
    imageAlt: entry.Image_Preview?.alternativeText ?? entry.Title,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Полезное</h1>
      <p className="mt-2 text-muted-foreground">
        Новости, статьи и публикации компании.
      </p>

      <MediaListClient items={items} />
    </div>
  );
}
