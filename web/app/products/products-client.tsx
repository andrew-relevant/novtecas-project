"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";
import type {
  StrapiEntry,
  ProductAttributes,
  ProductCategoryAttributes,
} from "@/lib/types";

interface ProductsClientProps {
  products: StrapiEntry<ProductAttributes>[];
  categories: StrapiEntry<ProductCategoryAttributes>[];
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter(
      (p) => p.attributes.category?.data?.attributes.slug === activeCategory,
    );
  }, [products, activeCategory]);

  const inStock = filtered.filter((p) => !p.attributes.isCustomOrder);
  const customOrder = filtered.filter((p) => p.attributes.isCustomOrder);

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
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all">Все</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.attributes.slug}>
              {cat.attributes.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {inStock.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold">В наличии</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {inStock.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyClick={handleBuyClick}
              />
            ))}
          </div>
        </div>
      )}

      {customOrder.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Под заказ</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customOrder.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyClick={handleBuyClick}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
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
