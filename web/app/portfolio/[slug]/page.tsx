import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";
import { Gallery } from "@/components/gallery";
import { VideoGallery } from "@/components/video-embed";
import { fetchStrapi } from "@/lib/strapi";
import type { StrapiResponse, PortfolioItem } from "@/lib/types";

interface PortfolioItemPageProps {
  params: Promise<{ slug: string }>;
}

async function getPortfolioItem(slug: string) {
  const res = await fetchStrapi<StrapiResponse<PortfolioItem[]>>(
    "/portfolio-items",
    {
      params: {
        "filters[Slug][$eq]": slug,
        "populate": "*",
      },
      fallback: { data: [], meta: {} },
    },
  );

  return res.data[0] ?? null;
}

export async function generateMetadata({
  params,
}: PortfolioItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) return { title: "Проект не найден" };

  return {
    title: item.Title,
    description: item.Short_Text ?? undefined,
  };
}

export default async function PortfolioItemPage({
  params,
}: PortfolioItemPageProps) {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) notFound();

  const { Title, Date: date, Full_Text, Gallery: gallery, Videos: videos } = item;

  const galleryItems = (gallery ?? []).map((g) => ({
    url: g.url,
    alt: g.alternativeText ?? Title,
    width: g.width,
    height: g.height,
  }));

  const videoItems = videos ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs currentTitle={Title} />

      <article>
        <h1 className="text-3xl font-bold">{Title}</h1>
        {date && (
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {Full_Text && (
          <div className="mt-8">
            <RichText content={Full_Text} />
          </div>
        )}

        {videoItems.length > 0 && (
          <div className="mt-6">
            <VideoGallery videos={videoItems} />
          </div>
        )}

        {galleryItems.length > 0 && (
          <div className="mt-6">
            <Gallery items={galleryItems} />
          </div>
        )}
      </article>
    </div>
  );
}
