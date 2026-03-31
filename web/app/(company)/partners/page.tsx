import { Metadata } from "next";
import Image from "next/image";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import { StrapiResponse, Partner } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Партнёры",
  description: "Наши партнёры — компании, с которыми мы сотрудничаем",
};

export default async function PartnersPage() {
  const { data } = await fetchStrapi<StrapiResponse<Partner[]>>("/partners", {
    params: { "populate": "*" },
    fallback: { data: [], meta: {} },
  });

  const activePartners = data.filter((p) => p.isActive);

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Наши партнёры</h1>
      <p className="mt-2 text-muted-foreground">
        Компании, с которыми мы сотрудничаем.
      </p>

      {activePartners.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {activePartners.map((partner) => {
            const logoUrl = partner.logo
              ? getStrapiMedia(partner.logo.url)
              : null;

            const content = (
              <Card className="flex h-full flex-col items-center justify-center p-6 transition-shadow hover:shadow-md">
                {logoUrl ? (
                  <div className="relative mb-4 h-20 w-full">
                    <Image
                      src={logoUrl}
                      alt={partner.name}
                      fill
                      className="object-contain"
                      sizes="200px"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-20 w-full items-center justify-center rounded bg-muted">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                )}
                <CardContent className="p-0 text-center">
                  <p className="font-medium">{partner.name}</p>
                  {partner.url && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      Перейти на сайт
                    </span>
                  )}
                </CardContent>
              </Card>
            );

            return partner.url ? (
              <a
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <div key={partner.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">
          Информация о партнёрах пока не добавлена.
        </p>
      )}
    </>
  );
}
