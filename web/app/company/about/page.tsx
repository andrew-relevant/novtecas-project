import { Metadata } from "next";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import { StrapiResponse, PageAbout } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";
import Image from "next/image";
import { CopyRequisitesButton } from "./copy-requisites-button";

export const metadata: Metadata = {
  title: "О компании",
  description: "Информация о компании Новтекас — производство дорожных покрытий",
};

export default async function AboutPage() {
  const fallback: StrapiResponse<PageAbout> = {
    data: {
      id: 0,
      documentId: "",
      Intro_Text: null,
      Full_Text: null,
      Sidebar_Image: null,
      Requisites_Table: null,
    },
    meta: {},
  };

  const { data } = await fetchStrapi<StrapiResponse<PageAbout>>(
    "/page-about",
    { params: { "populate": "*" }, fallback },
  );

  const attrs = data;
  const sidebarSrc = attrs.Sidebar_Image
    ? getStrapiMedia(attrs.Sidebar_Image.url)
    : null;

  const requisitesText = attrs.Requisites_Table
    ? attrs.Requisites_Table.map((row) =>
        `${row.label}: ${row.value}`,
      ).join("\n")
    : "";

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">О компании</h1>

      {sidebarSrc && (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={sidebarSrc}
            alt="О компании Новтекас"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        </div>
      )}

      {attrs.Intro_Text && (
        <p className="mt-6 text-lg text-muted-foreground">{attrs.Intro_Text}</p>
      )}

      <RichText content={attrs.Full_Text} className="mt-6" />

      {attrs.Requisites_Table && attrs.Requisites_Table.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Реквизиты</h2>
            <CopyRequisitesButton text={requisitesText} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <tbody>
                {attrs.Requisites_Table.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-4 py-2 font-bold text-muted-foreground">
                          {row.label}
                        </td>
                        <td className="px-4 py-2">{row.value}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
