"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Calculator } from "@/components/calculator";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import { ReviewForm } from "@/components/forms/review-form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import type { Product, Review } from "@/lib/types";

interface ProductDetailClientProps {
  productId: string;
  productTitle: string;
  reviews: Review[];
  relatedProducts: Product[];
}

export function ProductDetailClient({
  productId,
  productTitle,
  reviews,
  relatedProducts,
}: ProductDetailClientProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(productTitle);

  function handleBuyClick(title: string) {
    setSelectedProduct(title);
    setBuyOpen(true);
  }

  return (
    <>
      {/* Calculator */}
      <div className="mt-8">
        <Calculator />
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Сопутствующие товары</h2>
          <div className="mt-4 px-12">
            <Carousel opts={{ align: "start", loop: relatedProducts.length > 3 }}>
              <CarouselContent>
                {relatedProducts.map((rp) => (
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
        </section>
      )}

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">
          Отзывы{" "}
          {reviews.length > 0 && (
            <span className="text-base font-normal text-muted-foreground">
              ({reviews.length})
            </span>
          )}
        </h2>

        {reviews.length > 0 ? (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.author}</p>
                  {review.rating && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (review.rating ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.text}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString(
                    "ru-RU",
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">
            Отзывов пока нет. Будьте первым!
          </p>
        )}

        <div className="mt-6 rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">Оставить отзыв</h3>
          <ReviewForm productId={productId} />
        </div>
      </section>

      <ModalForm open={buyOpen} onOpenChange={setBuyOpen} title="Купить">
        <BuyForm
          productTitle={selectedProduct}
          onSuccess={() => setBuyOpen(false)}
        />
      </ModalForm>
    </>
  );
}
