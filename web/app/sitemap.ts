import type { MetadataRoute } from "next";
import { fetchStrapi } from "@/lib/strapi";
import type { StrapiResponse, StrapiEntry, ProductAttributes, PortfolioItemAttributes, MediaItemAttributes } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novtecas.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/company/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/company/production`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/company/documents`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/company/partners`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/company/blacklist`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/dealers`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/media`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const [products, portfolio, media] = await Promise.all([
      fetchStrapi<StrapiResponse<StrapiEntry<ProductAttributes>[]>>("/products", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
      fetchStrapi<StrapiResponse<StrapiEntry<PortfolioItemAttributes>[]>>("/portfolio-items", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
      fetchStrapi<StrapiResponse<StrapiEntry<MediaItemAttributes>[]>>("/media-items", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
    ]);

    dynamicPages = [
      ...products.data.map((p) => ({
        url: `${SITE_URL}/products/${p.attributes.Slug}`,
        lastModified: new Date(p.attributes.updatedAt ?? Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...portfolio.data.map((p) => ({
        url: `${SITE_URL}/portfolio/${p.attributes.Slug}`,
        lastModified: new Date(p.attributes.publishedAt ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...media.data.map((m) => ({
        url: `${SITE_URL}/media/${m.attributes.Slug}`,
        lastModified: new Date(m.attributes.publishedAt ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Strapi may be unavailable during build; static pages still get indexed
  }

  return [...staticPages, ...dynamicPages];
}
