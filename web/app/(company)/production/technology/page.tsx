import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, PageTechnology } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";

export const metadata: Metadata = {
  title: "Технология укладки",
  description:
    "Технология укладки холодного асфальта — пошаговая инструкция по применению холодных асфальтобетонных смесей",
};

export default async function TechnologyPage() {
  const fallback: StrapiResponse<PageTechnology> = {
    data: {
      id: 0,
      documentId: "",
      Full_Text: null,
    },
    meta: {},
  };

  const { data } = await fetchStrapi<StrapiResponse<PageTechnology>>(
    "/page-technology",
    { params: { populate: "*" }, fallback },
  );

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Технология укладки</h1>
      <RichText content={data.Full_Text} className="mt-6" />
    </>
  );
}
