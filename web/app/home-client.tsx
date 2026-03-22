"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import { DealerForm } from "@/components/forms/dealer-form";
import type { StrapiEntry, ProductAttributes } from "@/lib/types";

interface HomeClientProps {
  featuredProducts: StrapiEntry<ProductAttributes>[];
}

export function HomeClient({ featuredProducts }: HomeClientProps) {
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">Продукция</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Холодный и сухой асфальт от производителя — высокое качество, точная
            дозация компонентов, доставка по всей России
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyClick={handleBuyClick}
              />
            ))}
          </div>
          {featuredProducts.length === 0 && (
            <p className="mt-8 text-center text-muted-foreground">
              Товары скоро появятся
            </p>
          )}
        </div>
      </section>

      {/* CTA dealers */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ищем дилеров</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Приглашаем к сотрудничеству дилеров по всей России. Выгодные условия,
            маркетинговая поддержка, обучение.
          </p>
          <p className="mt-4 text-xl font-semibold">
            <a href="tel:88007070471" className="hover:underline">
              8 (800) 707-04-71
            </a>
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            onClick={() => setDealerOpen(true)}
          >
            Подать заявку на дилерство
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
