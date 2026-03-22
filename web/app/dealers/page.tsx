import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  DealerAttributes,
  PageDealersAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DealersClient } from "./dealers-client";

export const metadata: Metadata = {
  title: "Дилерам",
  description: "Карта и список официальных дилеров Новтекас",
};

export default async function DealersPage() {
  const pageFallback: StrapiResponse<StrapiEntry<PageDealersAttributes>> = {
    data: { id: 0, attributes: { Intro_Text: null } },
    meta: {},
  };

  const [dealersRes, pageRes] = await Promise.all([
    fetchStrapi<StrapiResponse<StrapiEntry<DealerAttributes>[]>>("/dealers", {
      params: {
        "populate": "*",
        "pagination[pageSize]": "100",
      },
      fallback: { data: [], meta: {} },
    }),
    fetchStrapi<StrapiResponse<StrapiEntry<PageDealersAttributes>>>(
      "/page-dealers",
      { params: { "populate": "*" }, fallback: pageFallback },
    ),
  ]);

  const dealers = dealersRes.data
    .filter((d) => d.attributes.isActive)
    .map((d) => ({
      id: d.id,
      title: d.attributes.Title,
      city: d.attributes.City,
      address: d.attributes.Address,
      phone: d.attributes.Phone,
      coordinates: d.attributes.Coordinates,
      contactInfo: d.attributes.Contact_Info,
    }));

  const introText = pageRes.data.attributes.Intro_Text;

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
