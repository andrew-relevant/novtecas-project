"use client";

import Link from "next/link";
import Image from "next/image";
import { getStrapiMedia } from "@/lib/strapi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Newspaper, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "news" | "article" | "video";

interface MediaItem {
  id: number;
  title: string;
  slug: string;
  date: string | null;
  type: MediaType;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string;
}

interface MediaListClientProps {
  items: MediaItem[];
  currentType: MediaType | "all";
}

const TYPE_LABELS: Record<MediaType, string> = {
  news: "Новости",
  article: "Статьи",
  video: "Видео",
};

const TYPE_ICONS: Record<MediaType, React.ElementType> = {
  news: Newspaper,
  article: FileText,
  video: Video,
};

const TABS: { label: string; href: string; value: MediaType | "all" }[] = [
  { label: "Все", href: "/media", value: "all" },
  { label: "Новости", href: "/media/news", value: "news" },
  { label: "Статьи", href: "/media/articles", value: "article" },
  { label: "Видео", href: "/media/videos", value: "video" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MediaListClient({ items, currentType }: MediaListClientProps) {
  const filtered =
    currentType === "all" ? items : items.filter((i) => i.type === currentType);

  return (
    <div className="mt-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              currentType === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const imgSrc = getStrapiMedia(item.imageUrl);
            const Icon = TYPE_ICONS[item.type];

            return (
              <Link key={item.id} href={`/media/${item.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  {imgSrc ? (
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <Image
                        src={imgSrc}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-t-lg bg-muted">
                      <Icon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{TYPE_LABELS[item.type]}</Badge>
                      {item.date && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.date)}
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-2 text-base leading-tight">
                      {item.title}
                    </CardTitle>
                  </CardHeader>

                  {item.excerpt && (
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {item.excerpt}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">Публикации не найдены.</p>
      )}
    </div>
  );
}
