"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import type { Product, ProductCategory } from "@/lib/types";

interface ProductsClientProps {
  products: Product[];
  categories: ProductCategory[];
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter(
      (p) => p.category?.slug === activeCategory,
    );
  }, [products, activeCategory]);

  function handleBuyClick(title: string) {
    setSelectedProduct(title);
    setBuyOpen(true);
  }

  return (
    <>
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="mt-6"
      >
        <TabsList className="inline-flex h-auto flex-wrap gap-1 rounded-lg">
          <TabsTrigger value="all">Все</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.slug}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuyClick={handleBuyClick}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-muted-foreground">
          Товары в этой категории не найдены
        </p>
      )}

      <ModalForm open={buyOpen} onOpenChange={setBuyOpen} title="Купить">
        <BuyForm
          productTitle={selectedProduct}
          onSuccess={() => setBuyOpen(false)}
        />
      </ModalForm>
    </>
  );
}
