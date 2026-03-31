import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, PageHydrophobic } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";

export const metadata: Metadata = {
  title: "Гидрофобный слой",
  description:
    "Гидрофобный слой в нефтеналивных терминалах — применение холодного асфальта для гидроизоляции резервуаров",
};

export default async function HydrophobicPage() {
  const fallback: StrapiResponse<PageHydrophobic> = {
    data: {
      id: 0,
      documentId: "",
      Full_Text: null,
    },
    meta: {},
  };

  const { data } = await fetchStrapi<StrapiResponse<PageHydrophobic>>(
    "/page-hydrophobic",
    { params: { populate: "*" }, fallback },
  );

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Гидрофобный слой</h1>
      <RichText content={data.Full_Text} className="mt-6" />
    </>
  );
}
