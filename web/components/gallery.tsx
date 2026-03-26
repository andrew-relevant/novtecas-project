"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStrapiMedia } from "@/lib/strapi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryItem {
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface GalleryProps {
  items: GalleryItem[];
}

export function Gallery({ items }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const prev = () =>
    setActiveIndex((i) => (i !== null ? (i - 1 + items.length) % items.length : 0));
  const next = () =>
    setActiveIndex((i) => (i !== null ? (i + 1) % items.length : 0));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item, index) => {
          const src = getStrapiMedia(item.url);
          if (!src) return null;
          return (
            <button
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
              onClick={() => setActiveIndex(index)}
            >
              <Image
                src={src}
                alt={item.alt}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            </button>
          );
        })}
      </div>

      <Dialog
        open={activeIndex !== null}
        onOpenChange={() => setActiveIndex(null)}
      >
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-black/70 [&>button]:[&_svg]:h-5 [&>button]:[&_svg]:w-5" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
          {activeIndex !== null && (
            <div className="relative flex items-center justify-center">
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={prev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              <div className="relative h-[80vh] w-full">
                {(() => {
                  const src = getStrapiMedia(items[activeIndex].url);
                  if (!src) return null;
                  return (
                    <Image
                      src={src}
                      alt={items[activeIndex].alt}
                      fill
                      className="rounded-lg object-contain"
                      sizes="(max-width: 768px) 100vw, 896px"
                    />
                  );
                })()}
              </div>

              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={next}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
