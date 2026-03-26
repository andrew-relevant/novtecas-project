"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface ProductCarouselProps {
  images: CarouselImage[];
}

export function ProductCarousel({ images }: ProductCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const onApiInit = (emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  };

  const prev = () =>
    setSelectedIndex((i) => (i - 1 + images.length) % images.length);
  const next = () =>
    setSelectedIndex((i) => (i + 1) % images.length);

  if (images.length === 0) return null;

  return (
    <>
      <Carousel
        setApi={onApiInit}
        opts={{ loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={index}>
              <button
                type="button"
                className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted"
                onClick={() => {
                  setSelectedIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={index === 0}
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="-left-3 lg:-left-5" />
            <CarouselNext className="-right-3 lg:-right-5" />
          </>
        )}
      </Carousel>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-black/70 [&>button]:[&_svg]:h-5 [&>button]:[&_svg]:w-5"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            {images[selectedIndex].alt}
          </DialogTitle>
          <div className="relative flex items-center justify-center">
            {images.length > 1 && (
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
              <Image
                src={images[selectedIndex].src}
                alt={images[selectedIndex].alt}
                fill
                className="rounded-lg object-contain"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>

            {images.length > 1 && (
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
        </DialogContent>
      </Dialog>
    </>
  );
}
