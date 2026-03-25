import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { getStrapiMedia } from "@/lib/strapi";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onBuyClick?: (productTitle: string) => void;
}

export function ProductCard({ product, onBuyClick }: ProductCardProps) {
  const { Title, Slug, Short_Description, Price_Rub, Unit_of_Measure, Image: img } =
    product;
  const imageUrl = getStrapiMedia(img?.url ?? null);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/products/${Slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={Title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Нет фото
            </div>
          )}

        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${Slug}`}>
          <h3 className="line-clamp-2 font-semibold hover:text-primary">
            {Title}
          </h3>
        </Link>
        {Short_Description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {Short_Description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">
            {Price_Rub ? (
              <>
                {Price_Rub.toLocaleString("ru-RU")} ₽
                {Unit_of_Measure && (
                  <span className="text-muted-foreground">
                    /{Unit_of_Measure}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Цена по запросу</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onBuyClick?.(Title);
            }}
          >
            Купить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
