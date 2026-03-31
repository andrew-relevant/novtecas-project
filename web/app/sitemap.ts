import type { MetadataRoute } from "next";
import { fetchStrapi } from "@/lib/strapi";
import type {
  StrapiResponse,
  Product,
  PortfolioItem,
  MediaItem,
} from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novtecas.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/production`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/documents`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/partners`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blacklist`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/dealers`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/media`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/media/news`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/media/articles`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/media/videos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const [products, portfolio, media] = await Promise.all([
      fetchStrapi<StrapiResponse<Product[]>>("/products", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
      fetchStrapi<StrapiResponse<PortfolioItem[]>>("/portfolio-items", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
      fetchStrapi<StrapiResponse<MediaItem[]>>("/media-items", {
        "fields[0]": "Slug",
        "fields[1]": "updatedAt",
        "pagination[pageSize]": "200",
      }),
    ]);

    dynamicPages = [
      ...products.data.map((p) => ({
        url: `${SITE_URL}/products/${p.Slug}`,
        lastModified: new Date(p.updatedAt ?? Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...portfolio.data.map((p) => ({
        url: `${SITE_URL}/portfolio/${p.Slug}`,
        lastModified: new Date(p.publishedAt ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...media.data.map((m) => ({
        url: `${SITE_URL}/media/${m.Slug}`,
        lastModified: new Date(m.publishedAt ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Strapi may be unavailable during build; static pages still get indexed
  }

  return [...staticPages, ...dynamicPages];
}
