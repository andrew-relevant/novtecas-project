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
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

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
        <DialogContent className="max-w-[95vw] border-none bg-transparent p-0 shadow-none sm:max-w-5xl [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">
            {images[selectedIndex].alt}
          </DialogTitle>
          <DialogClose className="absolute -top-2 right-0 z-50 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white sm:-right-4 sm:-top-4">
            <X className="h-5 w-5" />
            <span className="sr-only">Закрыть</span>
          </DialogClose>
          <button
            type="button"
            className="relative mx-auto h-[85vh] w-full cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <Image
              src={images[selectedIndex].src}
              alt={images[selectedIndex].alt}
              fill
              className="rounded-lg object-contain"
              sizes="95vw"
            />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
