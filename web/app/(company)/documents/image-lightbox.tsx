"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageLightboxProps {
  src: string;
  alt: string;
}

export function ImageLightbox({ src, alt }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-t-lg"
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top transition-transform hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-black/70 [&>button]:[&_svg]:h-5 [&>button]:[&_svg]:w-5"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative h-[80vh] w-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="rounded-lg object-contain"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
