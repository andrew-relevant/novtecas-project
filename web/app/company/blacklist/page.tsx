import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import { StrapiResponse, PageBlacklist } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";

export const metadata: Metadata = {
  title: "Чёрный список",
  description: "Информация о недобросовестных контрагентах",
};

export default async function BlacklistPage() {
  const fallback: StrapiResponse<PageBlacklist> = {
    data: { id: 0, documentId: "", Text_Content: null },
    meta: {},
  };

  const { data } = await fetchStrapi<StrapiResponse<PageBlacklist>>(
    "/page-blacklist",
    { params: { "populate": "*" }, fallback },
  );

  const attrs = data;

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Чёрный список</h1>

      {attrs.Text_Content ? (
        <RichText content={attrs.Text_Content} className="mt-6" />
      ) : (
        <p className="mt-4 text-muted-foreground">
          Информация о недобросовестных контрагентах.
        </p>
      )}
    </>
  );
}
