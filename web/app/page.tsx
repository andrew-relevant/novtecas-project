import Link from "next/link";
import {
  Factory,
  Warehouse,
  Target,
  Award,
  FileCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchStrapi } from "@/lib/strapi";
import type {
  StrapiResponse,
  StrapiEntry,
  ProductAttributes,
  SiteSettingsAttributes,
} from "@/lib/types";
import { getStrapiMedia } from "@/lib/strapi";
import { HomeClient } from "./home-client";
import { HeroVideo } from "@/components/hero-video";

const ADVANTAGES = [
  { icon: Factory, title: "Собственное производство" },
  { icon: Warehouse, title: "Собственные склады" },
  { icon: Target, title: "Точная дозация компонентов" },
  { icon: Award, title: "Канадская технология Perma Patch" },
  { icon: FileCheck, title: "Полная сертификация продукции" },
  { icon: Truck, title: "Доставка по всей России (авто и ж/д)" },
];

const APPLICATION_AREAS = [
  "Ремонт дорожных ям",
  "Ликвидация колейности",
  "Укрытие коммуникаций",
  "Укладка стоков",
  "Ремонт аэропортов и ВПП",
  "Защита крыш",
  "Обновление переездов",
  "Защитный слой в нефтехранилищах",
  "Асфальтирование дорожного полотна",
  "Асфальтирование при низких температурах",
];

export default async function HomePage() {
  const [productsRes, settingsRes] = await Promise.all([
    fetchStrapi<StrapiResponse<StrapiEntry<ProductAttributes>[]>>("/products", {
      params: {
        "populate": "*",
        "filters[isFeatured][$eq]": "true",
        "pagination[pageSize]": "100",
      },
      fallback: { data: [] },
    }),
    fetchStrapi<StrapiResponse<StrapiEntry<SiteSettingsAttributes>>>("/site-setting", {
      params: { "populate": "*" },
      fallback: { data: null },
    }),
  ]);
  const products = productsRes.data ?? [];
  const settings = settingsRes.data?.attributes ?? null;

  const heroVideoUrl = getStrapiMedia(settings?.heroVideo?.data?.attributes?.url ?? null);
  const heroPosterUrl = getStrapiMedia(settings?.heroPoster?.data?.attributes?.url ?? null);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-zinc-900 text-white">
        <HeroVideo src={heroVideoUrl ?? undefined} posterSrc={heroPosterUrl ?? undefined} />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold leading-tight drop-shadow-lg md:text-5xl lg:text-6xl">
            Производство и продажа
            <br />
            дорожных покрытий
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-200 drop-shadow-md md:text-xl">
            Холодный асфальт в мешках от производителя
          </p>
          <Button size="lg" className="mt-8 shadow-xl" asChild>
            <Link href="/products">Заказать</Link>
          </Button>
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">О компании</h2>
            <p className="mt-4 text-muted-foreground">
              Компания «Новтекас» — один из ведущих российских производителей
              холодного асфальта. Мы производим высококачественные дорожные
              покрытия с использованием канадской технологии Perma&nbsp;Patch,
              обеспечивая долговечный ремонт дорог в любых климатических условиях.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/company/about">Подробнее о компании</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured products + CTA dealers (interactive parts) */}
      <HomeClient featuredProducts={products} />

      {/* Advantages */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Преимущества компании
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map(({ icon: Icon, title }) => (
              <Card key={title}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-medium">{title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application areas */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Области применения холодного асфальта
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {APPLICATION_AREAS.map((area) => (
              <Card key={area}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium">{area}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
