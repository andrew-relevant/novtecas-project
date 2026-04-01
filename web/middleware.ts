import { NextRequest, NextResponse } from "next/server";

const BASE_DOMAIN = "novtecas.ru";
const CITY_COOKIE = "city-slug";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const clean = hostname.split(":")[0];

  let citySlug = "";
  const isLocal = clean === "localhost" || clean === "127.0.0.1";

  const queryCity = request.nextUrl.searchParams.get("city");

  if (queryCity !== null && isLocal) {
    citySlug = queryCity;
  } else if (!isLocal) {
    if (clean.endsWith(`.${BASE_DOMAIN}`)) {
      const sub = clean.replace(`.${BASE_DOMAIN}`, "");
      if (sub !== "cms" && sub !== "www") {
        citySlug = sub;
      }
    }
  } else {
    const fromCookie = request.cookies.get(CITY_COOKIE)?.value;
    if (fromCookie) citySlug = fromCookie;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-city-slug", citySlug);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.set(CITY_COOKIE, citySlug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|logo.svg|robots.txt|sitemap.xml).*)"],
};
