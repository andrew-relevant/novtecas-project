import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  MediaItemAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";
import { Gallery } from "@/components/gallery";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  news: "Новость",
  article: "Статья",
  video: "Видео",
};

interface MediaItemPageProps {
  params: Promise<{ slug: string }>;
}

async function getMediaItem(slug: string) {
  const { data } = await fetchStrapi<
    StrapiResponse<StrapiEntry<MediaItemAttributes>[]>
  >("/media-items", {
    "filters[Slug][$eq]": slug,
    "populate": "*",
  });

  return data[0] ?? null;
}

export async function generateMetadata({
  params,
}: MediaItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMediaItem(slug);
  if (!item) return { title: "Не найдено" };

  return {
    title: item.attributes.Title,
    description: item.attributes.Short_Text || undefined,
  };
}

export default async function MediaItemPage({ params }: MediaItemPageProps) {
  const { slug } = await params;
  const item = await getMediaItem(slug);
  if (!item) notFound();

  const attrs = item.attributes;

  const coverUrl = attrs.Image_Preview?.data
    ? getStrapiMedia(attrs.Image_Preview.data.attributes.url)
    : null;

  const galleryItems = (attrs.Gallery?.data ?? []).map((img) => ({
    url: img.attributes.url,
    alt: img.attributes.alternativeText || attrs.Title,
    width: img.attributes.width,
    height: img.attributes.height,
  }));

  const formattedDate = attrs.Date
    ? new Date(attrs.Date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs currentTitle={attrs.Title} />

      <article>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {TYPE_LABELS[attrs.Type] || attrs.Type}
          </Badge>
          {formattedDate && (
            <time className="text-sm text-muted-foreground">{formattedDate}</time>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold">{attrs.Title}</h1>

        {coverUrl && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={coverUrl}
              alt={attrs.Title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        <RichText content={attrs.Full_Text} className="mt-8" />

        {galleryItems.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">Галерея</h2>
            <Gallery items={galleryItems} />
          </div>
        )}
      </article>
    </div>
  );
}
