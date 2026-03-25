const STRAPI_URL =
  process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface FetchStrapiOptions {
  params?: Record<string, string>;
  fallback?: unknown;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchStrapi<T = unknown>(
  path: string,
  paramsOrOptions?: Record<string, string> | FetchStrapiOptions,
): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);

  let fallback: unknown | undefined;
  let params: Record<string, string> | undefined;

  if (paramsOrOptions && "fallback" in paramsOrOptions) {
    params = (paramsOrOptions as FetchStrapiOptions).params;
    fallback = (paramsOrOptions as FetchStrapiOptions).fallback;
  } else {
    params = paramsOrOptions as Record<string, string> | undefined;
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        if (res.status === 404 && fallback !== undefined) {
          return fallback as T;
        }
        throw new Error(`Strapi fetch error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isConnectionError =
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("fetch failed") ||
        lastError.cause?.toString().includes("ECONNREFUSED");

      if (isConnectionError && attempt < MAX_RETRIES) {
        console.warn(
          `[Strapi] Connection failed for ${path}, retry ${attempt + 1}/${MAX_RETRIES}...`,
        );
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (fallback !== undefined) {
        console.warn(`[Strapi] Using fallback for ${path}: ${lastError.message}`);
        return fallback as T;
      }

      throw lastError;
    }
  }

  throw lastError!;
}

export function getStrapiMedia(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("//")) return url;
  return url;
}
