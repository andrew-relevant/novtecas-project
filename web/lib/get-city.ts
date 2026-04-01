import { headers } from "next/headers";
import { getCityBySlug } from "@/lib/cities";
import type { City } from "@/lib/cities";

export async function getCityFromHeaders(): Promise<City> {
  const hdrs = await headers();
  const slug = hdrs.get("x-city-slug") || "";
  return getCityBySlug(slug);
}
