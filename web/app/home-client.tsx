"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/product-card";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import { DealerForm } from "@/components/forms/dealer-form";
import type { Product } from "@/lib/types";

export interface ApplicationAreaItem {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface HomeClientProps {
  featuredProducts: Product[];
  productsTitle?: string | null;
  productsSubtitle?: string | null;
  productsCtaLabel?: string | null;
  productsCtaHref?: string | null;
  dealersTitle?: string | null;
  dealersText?: string | null;
  dealersPhone?: string | null;
  dealersCtaLabel?: string | null;
}

export function HomeClient({
  featuredProducts,
  productsTitle,
  productsSubtitle,
  productsCtaLabel,
  productsCtaHref,
  dealersTitle,
  dealersText,
  dealersPhone,
  dealersCtaLabel,
}: HomeClientProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [dealerOpen, setDealerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();

  function handleBuyClick(productTitle: string) {
    setSelectedProduct(productTitle);
    setBuyOpen(true);
  }

  return (
    <>
      {/* Products section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            {productsTitle ?? "Продукция"}
          </h2>
          <div
            className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground [&>p]:m-0"
            dangerouslySetInnerHTML={{
              __html: productsSubtitle ?? "<p>Холодный и сухой асфальт от производителя — высокое качество, точная дозация компонентов, доставка по всей России</p>",
            }}
          />
          <div className="mt-10 flex flex-wrap items-stretch justify-center gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)]"
              >
                <ProductCard
                  product={product}
                  onBuyClick={handleBuyClick}
                />
              </div>
            ))}
          </div>
          {featuredProducts.length === 0 && (
            <p className="mt-8 text-center text-muted-foreground">
              Товары скоро появятся
            </p>
          )}
          {productsCtaHref && (
            <div className="mt-10 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href={productsCtaHref}>
                  {productsCtaLabel ?? "Вся продукция"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA dealers */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">
            {dealersTitle ?? "Ищем дилеров"}
          </h2>
          <div
            className="mx-auto mt-3 max-w-xl text-primary-foreground/80 [&>p]:m-0"
            dangerouslySetInnerHTML={{
              __html: dealersText ?? "<p>Приглашаем к сотрудничеству дилеров по всей России. Выгодные условия, маркетинговая поддержка, обучение.</p>",
            }}
          />
          <p className="mt-4 text-xl font-semibold">
            <a href={`tel:${(dealersPhone ?? "88007070471").replace(/[^+\d]/g, "")}`} className="hover:underline">
              {dealersPhone ?? "8 (800) 707-04-71"}
            </a>
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            onClick={() => setDealerOpen(true)}
          >
            {dealersCtaLabel ?? "Подать заявку на дилерство"}
          </Button>
        </div>
      </section>

      <ModalForm open={buyOpen} onOpenChange={setBuyOpen} title="Купить">
        <BuyForm
          productTitle={selectedProduct}
          onSuccess={() => setBuyOpen(false)}
        />
      </ModalForm>

      <ModalForm
        open={dealerOpen}
        onOpenChange={setDealerOpen}
        title="Заявка на дилерство"
      >
        <DealerForm onSuccess={() => setDealerOpen(false)} />
      </ModalForm>
    </>
  );
}

export function ApplicationAreasCarousel({
  title,
  areas,
}: {
  title?: string | null;
  areas: ApplicationAreaItem[];
}) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl font-bold">
          {title ?? "Области применения холодного асфальта"}
        </h2>
        <div className="mx-auto mt-10 max-w-[calc(100%-6rem)]">
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {areas.map((area) => (
                <CarouselItem
                  key={area.title}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="h-full overflow-hidden">
                    {area.imageUrl && (
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={area.imageUrl}
                          alt={area.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold">{area.title}</h3>
                      {area.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {area.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
