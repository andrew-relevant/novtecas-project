import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import type {
  StrapiResponse,
  StrapiEntry,
  PortfolioItemAttributes,
} from "@/lib/types";

export default async function PortfolioPage() {
  const { data: items } = await fetchStrapi<
    StrapiResponse<StrapiEntry<PortfolioItemAttributes>[]>
  >("/portfolio-items", {
    "populate": "*",
    "sort[0]": "Date:desc",
    "pagination[pageSize]": "100",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Портфолио</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Реализованные проекты компании Новтекас
      </p>

      {items.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const { Title, Slug, Date: date, Short_Text, Image_Preview } =
              item.attributes;
            const imageUrl = getStrapiMedia(
              Image_Preview?.data?.attributes?.url ?? null,
            );

            return (
              <Link key={item.id} href={`/portfolio/${Slug}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={Title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <h2 className="mt-1 line-clamp-2 font-semibold group-hover:text-primary">
                      {Title}
                    </h2>
                    {Short_Text && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {Short_Text}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-center text-muted-foreground">
          Проекты скоро появятся
        </p>
      )}
    </div>
  );
}
