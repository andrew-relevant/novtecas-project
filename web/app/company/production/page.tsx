import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, PageProduction } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";
import { Gallery } from "@/components/gallery";

export const metadata: Metadata = {
  title: "Производство",
  description:
    "Производство холодного асфальта — собственное производство с минимальными затратами на оборудование",
};

export default async function ProductionPage() {
  const fallback: StrapiResponse<PageProduction> = {
    data: {
      id: 0,
      documentId: "",
      Intro_Text: null,
      Full_Text: null,
      Gallery: [],
    },
    meta: {},
  };

  const { data } = await fetchStrapi<StrapiResponse<PageProduction>>(
    "/page-production",
    { params: { populate: "*" }, fallback },
  );

  const attrs = data;

  const galleryItems = (attrs.Gallery ?? []).map((img) => ({
    url: img.url,
    alt: img.alternativeText || "Производство",
    width: img.width,
    height: img.height,
  }));

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Производство</h1>

      {attrs.Intro_Text && (
        <p className="mt-6 text-lg text-muted-foreground">
          {attrs.Intro_Text}
        </p>
      )}

      <RichText content={attrs.Full_Text} className="mt-6" />

      {galleryItems.length > 0 && (
        <div className="mt-8">
          <Gallery items={galleryItems} />
        </div>
      )}
    </>
  );
}
