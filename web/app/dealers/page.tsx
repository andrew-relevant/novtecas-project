import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import type { StrapiResponse, Dealer, PageDealers } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DealersClient } from "./dealers-client";

export const metadata: Metadata = {
  title: "Дилерам",
  description: "Карта и список официальных дилеров Новтекас",
};

export default async function DealersPage() {
  const pageFallback: StrapiResponse<PageDealers> = {
    data: { id: 0, documentId: "", Intro_Text: null },
    meta: {},
  };

  const [dealersRes, pageRes] = await Promise.all([
    fetchStrapi<StrapiResponse<Dealer[]>>("/dealers", {
      params: {
        "populate": "*",
        "pagination[pageSize]": "100",
      },
      fallback: { data: [], meta: {} },
    }),
    fetchStrapi<StrapiResponse<PageDealers>>(
      "/page-dealers",
      { params: { "populate": "*" }, fallback: pageFallback },
    ),
  ]);

  const dealers = dealersRes.data
    .filter((d) => d.isActive)
    .map((d) => ({
      id: d.id,
      title: d.Title,
      city: d.City,
      address: d.Address,
      phone: d.Phone,
      coordinates: d.Coordinates,
      contactInfo: d.Contact_Info,
    }));

  const introText = pageRes.data.Intro_Text;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Дилерам</h1>

      {introText && (
        <p className="mt-4 text-lg text-muted-foreground">{introText}</p>
      )}

      <DealersClient dealers={dealers} />
    </div>
  );
}
