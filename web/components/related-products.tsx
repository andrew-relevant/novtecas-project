"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { Product } from "@/lib/types";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>();

  if (products.length === 0) return null;

  function handleBuyClick(title: string) {
    setSelectedProduct(title);
    setBuyOpen(true);
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">Сопутствующие товары</h2>
      <div className="mt-4 px-12">
        <Carousel opts={{ align: "start", loop: products.length > 3 }}>
          <CarouselContent>
            {products.map((rp) => (
              <CarouselItem
                key={rp.id}
                className="basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <ProductCard product={rp} onBuyClick={handleBuyClick} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </Carousel>
      </div>

      <ModalForm open={buyOpen} onOpenChange={setBuyOpen} title="Купить">
        <BuyForm
          productTitle={selectedProduct}
          onSuccess={() => setBuyOpen(false)}
        />
      </ModalForm>
    </section>
  );
}
