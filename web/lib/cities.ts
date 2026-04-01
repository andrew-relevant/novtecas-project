import { fetchStrapi } from "@/lib/strapi";

export interface City {
  id: number;
  name: string;
  slug: string;
  domain: string;
  namePrepositional: string;
  nameDative: string;
  phones: string[];
  postalCode: string;
  address: string;
  warehouseAddress: string;
  mapCenter: { lat: number; lng: number } | null;
  isDefault: boolean;
}

interface StrapiCity {
  id: number;
  documentId: string;
  name: string;
  slug: string | null;
  domain: string;
  namePrepositional: string | null;
  nameDative: string | null;
  phones: string[] | null;
  postalCode: string | null;
  address: string | null;
  warehouseAddress: string | null;
  mapLat: number | null;
  mapLng: number | null;
  sortOrder: number;
  isDefault: boolean;
}

function strapiCityToCity(sc: StrapiCity): City {
  return {
    id: sc.id,
    name: sc.name,
    slug: sc.slug || "",
    domain: sc.domain,
    namePrepositional: sc.namePrepositional || sc.name,
    nameDative: sc.nameDative || sc.name,
    phones: sc.phones || [],
    postalCode: sc.postalCode || "",
    address: sc.address || "",
    warehouseAddress: sc.warehouseAddress || "",
    mapCenter: sc.mapLat != null && sc.mapLng != null ? { lat: sc.mapLat, lng: sc.mapLng } : null,
    isDefault: sc.isDefault,
  };
}

const FALLBACK_DEFAULT: City = {
  id: 0,
  name: "Москва",
  slug: "",
  domain: "novtecas.ru",
  namePrepositional: "Москве",
  nameDative: "Москве",
  phones: ["+7 (499) 504-41-63"],
  postalCode: "445045",
  address: "ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1",
  warehouseAddress: "",
  mapCenter: { lat: 55.7322, lng: 37.6209 },
  isDefault: true,
};

let _citiesCache: City[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export async function fetchCities(): Promise<City[]> {
  const now = Date.now();
  if (_citiesCache && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _citiesCache;
  }

  try {
    const resp = await fetchStrapi<{ data: StrapiCity[] }>("/cities", {
      params: {
        "pagination[pageSize]": "100",
        "sort[0]": "sortOrder:asc",
        "sort[1]": "name:asc",
      },
      fallback: { data: [] },
    });

    const cities = (resp.data || []).map(strapiCityToCity);
    if (cities.length > 0) {
      _citiesCache = cities;
      _cacheTimestamp = now;
      return cities;
    }
  } catch {
    // Strapi unavailable — use cache or fallback
  }

  return _citiesCache || [FALLBACK_DEFAULT];
}

export async function getCityBySlug(slug: string): Promise<City> {
  const cities = await fetchCities();
  if (!slug) return cities.find((c) => c.isDefault) || cities[0];
  return cities.find((c) => c.slug === slug) || cities.find((c) => c.isDefault) || cities[0];
}

export function extractCitySlugFromHostname(hostname: string): string {
  const BASE_DOMAIN = "novtecas.ru";
  const clean = hostname.split(":")[0];

  if (clean === "localhost" || clean === "127.0.0.1") return "";

  const parts = clean.split(".");

  if (parts.length <= 2) return "";

  if (clean.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = clean.replace(`.${BASE_DOMAIN}`, "");
    if (sub === "cms" || sub === "www") return "";
    return sub;
  }

  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub === "cms" || sub === "www") return "";
    return sub;
  }

  return "";
}

export function buildCityUrl(city: City, path: string = "/"): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      const url = new URL(path, window.location.origin);
      url.searchParams.set("city", city.slug);
      return url.toString();
    }
    return `${window.location.protocol}//${city.domain}${path}`;
  }
  return `https://${city.domain}${path}`;
}

export const FALLBACK_PHONE = "8 (800) 707-04-71";

export function getCityPhone(city: City): string {
  return city.phones[0] || FALLBACK_PHONE;
}

export function getCityPhoneHref(city: City): string {
  const phone = getCityPhone(city);
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
