import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Calculator } from "@/components/calculator";
import { ProductCarousel } from "@/components/product-carousel";
import { RichText } from "@/components/rich-text";

import { Badge } from "@/components/ui/badge";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import type { StrapiResponse, Product } from "@/lib/types";
import { RelatedProducts } from "@/components/related-products";
import { ReviewsSection } from "@/components/reviews-section";
import { BuyButton } from "@/components/buy-button";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const res = await fetchStrapi<StrapiResponse<Product[]>>(
    "/products",
    {
      params: {
        "filters[Slug][$eq]": slug,
        "populate[Image]": "true",
        "populate[Gallery]": "true",
        "populate[category]": "true",
        "populate[priceTiers]": "true",
        "populate[Related_Products][populate][Image]": "true",
        "populate[reviews]": "true",
        "populate[seo][populate][ogImage]": "true",
      },
      fallback: { data: [], meta: {} },
    },
  );

  return res.data[0] ?? null;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Товар не найден" };

  const { Title, Short_Description_Preview, seo, Image: img } = product;
  const ogImage = getStrapiMedia(
    seo?.ogImage?.url ?? img?.url ?? null,
  );

  return {
    title: seo?.metaTitle ?? Title,
    description: seo?.metaDescription ?? Short_Description_Preview ?? undefined,
    openGraph: {
      title: seo?.metaTitle ?? Title,
      description: seo?.metaDescription ?? Short_Description_Preview ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const {
    Title,
    H1,
    Short_Description_Preview,
    Short_Description,
    Price_Rub,
    Unit_of_Measure,
    Weight,
    Image: mainImage,
    Gallery: gallery,
    Full_Description,
    Specs,
    priceTiers,
    Related_Products,
    reviews,
    Show_Price_Note,
    Price_Note,
  } = product;

  const carouselImages = (() => {
    if (gallery && gallery.length > 0) {
      return gallery
        .map((item) => {
          const src = getStrapiMedia(item.url);
          if (!src) return null;
          return {
            src,
            alt: item.alternativeText ?? Title,
            width: item.width,
            height: item.height,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }
    const fallbackSrc = getStrapiMedia(mainImage?.url ?? null);
    if (fallbackSrc && mainImage) {
      return [
        {
          src: fallbackSrc,
          alt: Title,
          width: mainImage.width,
          height: mainImage.height,
        },
      ];
    }
    return [];
  })();

  const publishedReviews = (reviews ?? []).filter((r) => r.isPublished);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs currentTitle={Title} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: image + gallery */}
        <div>
          <ProductCarousel images={carouselImages} />
        </div>

        {/* Right: product info */}
        <div>
          <h1 className="text-3xl font-bold">{H1 || Title}</h1>
          {Short_Description && (
            <div className="mt-3 text-muted-foreground">
              <RichText content={Short_Description} />
            </div>
          )}

          {Weight && (
            <p className="mt-4 text-sm text-muted-foreground">
              Вес: <span className="font-medium text-foreground">{Weight}</span>
            </p>
          )}

          <div className="mt-4">
            <div className="flex items-center gap-4">
              {Price_Rub != null && (
                <p className="font-medium">
                  <span className="text-3xl font-bold">
                    {Price_Rub.toLocaleString("ru-RU")} ₽
                  </span>
                  {Unit_of_Measure && (
                    <span className="text-sm text-muted-foreground">
                      /{Unit_of_Measure}
                    </span>
                  )}
                </p>
              )}
              <BuyButton productTitle={Title} />
            </div>
            {Show_Price_Note && Price_Note && (
              <div className="mt-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {Price_Note}
                </Badge>
              </div>
            )}
          </div>

          {priceTiers && priceTiers.length > 0 && (
            <div className="mt-4 rounded-lg border p-4">
              <p className="mb-2 text-sm font-semibold">Тиражное ценообразование:</p>
              <ul className="space-y-1 text-sm">
                {priceTiers.map((tier) => (
                  <li key={tier.id} className="flex justify-between">
                    <span>{tier.label}</span>
                    <span className="font-medium">
                      {tier.price.toLocaleString("ru-RU")} ₽
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specs table */}
          {Specs && Object.keys(Specs).length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Характеристики</h2>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(Specs).map(([key, value]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {key}
                      </td>
                      <td className="py-2 font-medium">{value}</td>
                    </tr>
                  ))}
                  {Weight && (
                    <tr className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">Вес</td>
                      <td className="py-2 font-medium">{Weight}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Calculator />
      </div>

      {/* Full description */}
      {Full_Description && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Описание</h2>
          <RichText content={Full_Description} />
        </section>
      )}

      <RelatedProducts products={Related_Products ?? []} />

      <ReviewsSection
        productId={product.documentId}
        reviews={publishedReviews}
      />
    </div>
  );
}
