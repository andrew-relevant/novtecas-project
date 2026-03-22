import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  PageProductionAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Gallery } from "@/components/gallery";

export const metadata: Metadata = {
  title: "Производство",
  description: "Производственные мощности компании Новтекас",
};

export default async function ProductionPage() {
  const fallback: StrapiResponse<StrapiEntry<PageProductionAttributes>> = {
    data: { id: 0, attributes: { Intro_Text: null, Gallery: { data: [] } } },
    meta: {},
  };

  const { data } = await fetchStrapi<
    StrapiResponse<StrapiEntry<PageProductionAttributes>>
  >("/page-production", { params: { "populate": "*" }, fallback });

  const attrs = data.attributes;

  const galleryItems = (attrs.Gallery?.data ?? []).map((img) => ({
    url: img.attributes.url,
    alt: img.attributes.alternativeText || "Производство",
    width: img.attributes.width,
    height: img.attributes.height,
  }));

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Производство</h1>

      {attrs.Intro_Text ? (
        <p className="mt-6 text-lg text-muted-foreground">{attrs.Intro_Text}</p>
      ) : (
        <p className="mt-6 text-muted-foreground">
          Информация о производстве будет добавлена в ближайшее время.
        </p>
      )}

      {galleryItems.length > 0 && (
        <div className="mt-8">
          <Gallery items={galleryItems} />
        </div>
      )}
    </>
  );
}
