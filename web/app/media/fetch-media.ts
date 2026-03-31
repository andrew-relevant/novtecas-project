import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, MediaItem } from "@/lib/types";

export async function fetchMediaItems() {
  const { data } = await fetchStrapi<StrapiResponse<MediaItem[]>>(
    "/media-items",
    {
      params: {
        populate: "*",
        "sort": "Date:desc",
        "pagination[pageSize]": "100",
      },
      fallback: { data: [], meta: {} },
    },
  );

  return data.map((entry) => ({
    id: entry.id,
    title: entry.Title,
    slug: entry.Slug,
    date: entry.Date,
    type: entry.Type as "news" | "article" | "video",
    excerpt: entry.Short_Text,
    imageUrl: entry.Image_Preview?.url ?? null,
    imageAlt: entry.Image_Preview?.alternativeText ?? entry.Title,
  }));
}
