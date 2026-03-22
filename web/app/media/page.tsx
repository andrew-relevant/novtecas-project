import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  MediaItemAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MediaListClient } from "./media-list-client";

export const metadata: Metadata = {
  title: "Полезное",
  description: "Новости, статьи и видеоматериалы компании Новтекас",
};

export default async function MediaPage() {
  const { data } = await fetchStrapi<
    StrapiResponse<StrapiEntry<MediaItemAttributes>[]>
  >("/media-items", {
    "populate": "*",
    "sort": "Date:desc",
    "pagination[pageSize]": "100",
  });

  const items = data.map((entry) => ({
    id: entry.id,
    title: entry.attributes.Title,
    slug: entry.attributes.Slug,
    date: entry.attributes.Date,
    type: entry.attributes.Type,
    excerpt: entry.attributes.Short_Text,
    imageUrl: entry.attributes.Image_Preview?.data?.attributes.url ?? null,
    imageAlt: entry.attributes.Image_Preview?.data?.attributes.alternativeText ?? entry.attributes.Title,
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
