import Link from "next/link";
import {
  Factory,
  Warehouse,
  Target,
  FileCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchStrapi } from "@/lib/strapi";
import type { StrapiResponse, Product, HomePage } from "@/lib/types";
import { getStrapiMedia } from "@/lib/strapi";
import { HomeClient, ApplicationAreasCarousel } from "./home-client";
import { HeroVideo } from "@/components/hero-video";

function MapleLeaf({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <path d="M32,62a1,1,0,0,1-1-1V15a1,1,0,0,1,2,0V61A1,1,0,0,1,32,62Z" />
      <path d="M46.144,57.5a2.053,2.053,0,0,1-.5-.061l-9.89-2.473a1,1,0,1,1,.484-1.94L46.133,55.5l-2.5-5a2,2,0,0,1,1.193-2.8l13.083-4.089-2.775-2.22a1.993,1.993,0,0,1-.352-2.761L59,33H52a2,2,0,0,1-2-2V26.685l-7.664,4.18a2,2,0,0,1-2.923-2.131l3.3-17.326-4.676,1.335a1.994,1.994,0,0,1-2.3-.951L32,5.059l-3.74,6.733a1.993,1.993,0,0,1-2.3.951l-4.675-1.336,3.3,17.328a2,2,0,0,1-2.923,2.13L14,26.685V31a2,2,0,0,1-2,2H5l4.219,5.625a1.992,1.992,0,0,1-.351,2.761l-2.775,2.22L19.176,47.7a2,2,0,0,1,1.193,2.8l-2.5,5,9.891-2.472a1,1,0,1,1,.484,1.94l-9.89,2.473a2,2,0,0,1-2.274-2.836l2.5-5L5.5,45.516a2,2,0,0,1-.654-3.471l2.775-2.22L3.4,34.2A2,2,0,0,1,5,31h7V26.685a2,2,0,0,1,2.957-1.756l7.664,4.18-3.3-17.327a2,2,0,0,1,2.514-2.3l4.676,1.336,3.741-6.733a2,2,0,0,1,3.5,0l3.74,6.733,4.677-1.336a2,2,0,0,1,2.514,2.3l-3.3,17.327,7.665-4.18A2,2,0,0,1,52,26.685V31h7a2,2,0,0,1,1.6,3.2l-4.219,5.625,2.776,2.22a2,2,0,0,1-.653,3.471L45.42,49.6l2.5,5a2,2,0,0,1-1.778,2.9Z" />
    </svg>
  );
}

const ICON_MAP: Record<string, LucideIcon | typeof MapleLeaf> = {
  Factory,
  Warehouse,
  Target,
  MapleLeaf,
  Award: MapleLeaf,
  FileCheck,
  Truck,
};

const FALLBACK_ADVANTAGES = [
  { iconKey: "Factory", title: "Собственное производство" },
  { iconKey: "Warehouse", title: "Собственные склады" },
  { iconKey: "Target", title: "Точная дозация компонентов" },
  { iconKey: "MapleLeaf", title: "Канадская технология Perma Patch" },
  { iconKey: "FileCheck", title: "Полная сертификация продукции" },
  { iconKey: "Truck", title: "Доставка по всей России (авто и ж/д)" },
];

const FALLBACK_APPLICATION_AREAS = [
  { title: "Ремонт дорожных ям", description: "Асфальт с использованием концентрата – отличный выбор при необходимости отремонтировать выбоины и ямы на любых типах дорог в кратчайшие сроки." },
  { title: "Ликвидация колейности", description: "Асфальт марки Perma Patch используют федеральные и региональные органы, а также частные компании для решения проблемы колейности." },
  { title: "Укрытие коммуникаций", description: "Асфальт Perma Patch хорошо подойдет, если нужно покрыть коммуникационные каналы на дорогах." },
  { title: "Укладка стоков", description: "Для укладки зон вокруг люков и водоотводов перманентно используется холодный асфальт." },
  { title: "Ремонт аэропортов и ВПП", description: "Холодный асфальт – наиболее быстрый и бюджетный способ в любое время года вернуть функциональность взлетно-посадочным полосам." },
  { title: "Защита крыш", description: "На плоских крышах нежилых помещений холодный асфальт используется как дополнительный слой, защищающий от негативного воздействия воды и снега." },
  { title: "Обновление переездов", description: "Данный тип концентрата подходит для экстренного и долговечного ремонта ж/д переездов любой степени поврежденности." },
  { title: "Защитный слой в нефтехранилищах", description: "Perma Patch может быть использован в качестве изолирующего материала для резервуаров и хранилищ нефтепродуктов в терминалах." },
  { title: "Асфальтирование дорожного полотна", description: "Холодный асфальт данной марки подходит для основного покрытия дорожных полотен 2 и 3 категории." },
  { title: "Асфальтирование при низких температурах", description: "Покрытие способно уплотняться даже при -27°С, сохраняя подвижность и качество материала." },
];

export default async function HomePage() {
  const [productsRes,     homeRes] = await Promise.all([
    fetchStrapi<StrapiResponse<Product[]>>("/products", {
      params: {
        "populate": "*",
        "filters[isFeatured][$eq]": "true",
        "pagination[pageSize]": "100",
        "sort[0]": "sortOrder:asc",
      },
      fallback: { data: [] },
    }),
    fetchStrapi<StrapiResponse<HomePage>>("/home-page", {
      params: {
        "populate[heroVideo]": "true",
        "populate[heroPoster]": "true",
        "populate[advantages]": "true",
        "populate[applicationAreas][populate][image]": "true",
      },
      fallback: { data: null },
    }),
  ]);

  const products = productsRes.data ?? [];
  const home = homeRes.data;

  const heroVideoUrl = getStrapiMedia(home?.heroVideo?.url ?? null);
  const heroPosterUrl = getStrapiMedia(home?.heroPoster?.url ?? null);

  const advantages =
    home?.advantages && home.advantages.length > 0
      ? home.advantages
      : FALLBACK_ADVANTAGES;

  const applicationAreas =
    home?.applicationAreas && home.applicationAreas.length > 0
      ? home.applicationAreas.map((area) => ({
          ...area,
          imageUrl: getStrapiMedia(area.image?.url ?? null),
        }))
      : FALLBACK_APPLICATION_AREAS.map((a) => ({
          title: a.title,
          description: a.description,
          imageUrl: null as string | null,
        }));

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-zinc-900 text-white">
        <HeroVideo src={heroVideoUrl ?? undefined} posterSrc={heroPosterUrl ?? undefined} />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold leading-tight drop-shadow-lg md:text-5xl lg:text-6xl">
            {home?.heroTitle ?? (
              <>
                Производство и продажа
                <br />
                дорожных покрытий
              </>
            )}
          </h1>
          <div
            className="mx-auto mt-4 max-w-2xl text-lg text-zinc-200 drop-shadow-md md:text-xl [&>p]:m-0"
            dangerouslySetInnerHTML={{
              __html: home?.heroSubtitle ?? "<p>Холодный асфальт в мешках от производителя</p>",
            }}
          />
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">
              {home?.aboutTitle ?? "О компании"}
            </h2>
            <div
              className="mt-4 text-muted-foreground [&>p]:m-0"
              dangerouslySetInnerHTML={{
                __html: home?.aboutText ?? "<p>Компания «Новтекас» — один из ведущих российских производителей холодного асфальта. Мы производим высококачественные дорожные покрытия с использованием канадской технологии Perma\u00a0Patch, обеспечивая долговечный ремонт дорог в любых климатических условиях.</p>",
              }}
            />
            <Button variant="outline" className="mt-6" asChild>
              <Link href={home?.aboutCtaHref ?? "/about"}>
                {home?.aboutCtaLabel ?? "Подробнее о компании"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured products + CTA dealers (interactive parts) */}
      <HomeClient
        featuredProducts={products}
        productsTitle={home?.productsTitle}
        productsSubtitle={home?.productsSubtitle}
        productsCtaLabel={home?.productsCtaLabel}
        productsCtaHref={home?.productsCtaHref}
        dealersTitle={home?.dealersTitle}
        dealersText={home?.dealersText}
        dealersPhone={home?.dealersPhone}
        dealersCtaLabel={home?.dealersCtaLabel}
      />

      {/* Advantages */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            {home?.advantagesTitle ?? "Преимущества компании"}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((adv) => {
              const Icon = ICON_MAP[adv.iconKey ?? ""] ?? Factory;
              return (
                <Card key={adv.title}>
                  <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-12 w-12" />
                    </div>
                    <p className="font-medium">{adv.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application areas */}
      <ApplicationAreasCarousel
        title={home?.applicationAreasTitle}
        areas={applicationAreas}
      />
    </>
  );
}
