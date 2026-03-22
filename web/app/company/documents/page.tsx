import { Metadata } from "next";
import Image from "next/image";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  DocumentAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Документы",
  description: "Сертификаты, лицензии и техническая документация Новтекас",
};

export default async function DocumentsPage() {
  const { data } = await fetchStrapi<
    StrapiResponse<StrapiEntry<DocumentAttributes>[]>
  >("/documents", {
    params: { "populate": "*" },
    fallback: { data: [], meta: {} },
  });

  const grouped = new Map<string, StrapiEntry<DocumentAttributes>[]>();

  for (const doc of data) {
    const category = doc.attributes.Category || "Прочее";
    const existing = grouped.get(category) ?? [];
    existing.push(doc);
    grouped.set(category, existing);
  }

  return (
    <>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Документы</h1>
      <p className="mt-2 text-muted-foreground">
        Сертификаты, лицензии и техническая документация.
      </p>

      {Array.from(grouped.entries()).map(([category, docs]) => (
        <section key={category} className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{category}</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => {
              const previewUrl = doc.attributes.Preview_Image?.data
                ? getStrapiMedia(doc.attributes.Preview_Image.data.attributes.url)
                : null;
              const fileUrl = doc.attributes.File?.data
                ? getStrapiMedia(doc.attributes.File.data.attributes.url)
                : null;

              return (
                <Card key={doc.id}>
                  {previewUrl ? (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                      <Image
                        src={previewUrl}
                        alt={doc.attributes.Title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-t-lg bg-muted">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {doc.attributes.Title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {fileUrl && (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Скачать
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {data.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          Документы пока не добавлены.
        </p>
      )}
    </>
  );
}
