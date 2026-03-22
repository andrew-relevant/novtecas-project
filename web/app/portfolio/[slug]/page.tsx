import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";
import { Gallery } from "@/components/gallery";
import { fetchStrapi } from "@/lib/strapi";
import type {
  StrapiResponse,
  StrapiEntry,
  PortfolioItemAttributes,
} from "@/lib/types";

interface PortfolioItemPageProps {
  params: Promise<{ slug: string }>;
}

async function getPortfolioItem(slug: string) {
  const res = await fetchStrapi<
    StrapiResponse<StrapiEntry<PortfolioItemAttributes>[]>
  >("/portfolio-items", {
    params: {
      "filters[Slug][$eq]": slug,
      "populate": "*",
    },
    fallback: { data: [], meta: {} },
  });

  return res.data[0] ?? null;
}

export async function generateMetadata({
  params,
}: PortfolioItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) return { title: "Проект не найден" };

  return {
    title: item.attributes.Title,
    description: item.attributes.Short_Text ?? undefined,
  };
}

export default async function PortfolioItemPage({
  params,
}: PortfolioItemPageProps) {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) notFound();

  const { Title, Date: date, Full_Text, Gallery: gallery } = item.attributes;

  const galleryItems = (gallery?.data ?? []).map((g) => ({
    url: g.attributes.url,
    alt: g.attributes.alternativeText ?? Title,
    width: g.attributes.width,
    height: g.attributes.height,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs currentTitle={Title} />

      <article className="mx-auto max-w-3xl">
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

        {galleryItems.length > 0 && (
          <div className="mt-6">
            <Gallery items={galleryItems} />
          </div>
        )}

        {Full_Text && (
          <div className="mt-8">
            <RichText content={Full_Text} />
          </div>
        )}
      </article>
    </div>
  );
}
