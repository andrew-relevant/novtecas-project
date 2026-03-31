import { Metadata } from "next";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import { StrapiResponse, DocumentEntry } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ImageLightbox } from "./image-lightbox";

export const metadata: Metadata = {
  title: "Документы",
  description: "Сертификаты, лицензии и техническая документация Новтекас",
};

export default async function DocumentsPage() {
  const { data } = await fetchStrapi<StrapiResponse<DocumentEntry[]>>(
    "/documents",
    {
      params: { "populate": "*" },
      fallback: { data: [], meta: {} },
    },
  );

  const grouped = new Map<string, DocumentEntry[]>();

  for (const doc of data) {
    const category = doc.Category || "Прочее";
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
              const previewUrl = doc.Preview_Image
                ? getStrapiMedia(doc.Preview_Image.url)
                : null;
              const fileUrl = doc.File
                ? getStrapiMedia(doc.File.url)
                : null;

              return (
                <Card key={doc.id} className="flex flex-col">
                  {previewUrl ? (
                    <ImageLightbox src={previewUrl} alt={doc.Title} />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-t-lg bg-muted">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-normal">
                      {doc.Title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="mt-auto">
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
