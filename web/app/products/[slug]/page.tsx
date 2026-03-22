import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Gallery } from "@/components/gallery";
import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { fetchStrapi, getStrapiMedia } from "@/lib/strapi";
import type {
  StrapiResponse,
  StrapiEntry,
  ProductAttributes,
} from "@/lib/types";
import { ProductDetailClient } from "./product-detail-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const res = await fetchStrapi<StrapiResponse<StrapiEntry<ProductAttributes>[]>>(
    "/products",
    {
      params: {
        "filters[Slug][$eq]": slug,
        "populate[Image]": "*",
        "populate[Gallery]": "*",
        "populate[category]": "*",
        "populate[Related_Products][populate]": "*",
        "populate[reviews]": "*",
        "populate[seo][populate]": "*",
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

  const { Title, Short_Description, seo, Image: img } = product.attributes;
  const ogImage = getStrapiMedia(
    seo?.ogImage?.data?.attributes?.url ??
      img?.data?.attributes?.url ??
      null,
  );

  return {
    title: seo?.metaTitle ?? Title,
    description: seo?.metaDescription ?? Short_Description ?? undefined,
    openGraph: {
      title: seo?.metaTitle ?? Title,
      description: seo?.metaDescription ?? Short_Description ?? undefined,
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
    Short_Description,
    Price_Rub,
    Unit_of_Measure,
    Weight,
    Image: mainImage,
    Gallery: gallery,
    Full_Description,
    Specs,
    isCustomOrder,
    priceTiers,
    Related_Products,
    reviews,
  } = product.attributes;

  const mainImageUrl = getStrapiMedia(mainImage?.data?.attributes?.url ?? null);

  const galleryItems = (gallery?.data ?? []).map((item) => ({
    url: item.attributes.url,
    alt: item.attributes.alternativeText ?? Title,
    width: item.attributes.width,
    height: item.attributes.height,
  }));

  const publishedReviews = (reviews?.data ?? []).filter(
    (r) => r.attributes.isPublished,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs currentTitle={Title} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: image + gallery */}
        <div>
          {mainImageUrl && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={mainImageUrl}
                alt={Title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          )}
          {galleryItems.length > 0 && (
            <div className="mt-4">
              <Gallery items={galleryItems} />
            </div>
          )}
        </div>

        {/* Right: product info */}
        <div>
          <h1 className="text-3xl font-bold">{Title}</h1>
          {isCustomOrder && (
            <Badge variant="secondary" className="mt-2">
              Под заказ
            </Badge>
          )}
          {Short_Description && (
            <p className="mt-3 text-muted-foreground">{Short_Description}</p>
          )}

          <div className="mt-6 space-y-2">
            {Price_Rub != null && (
              <p className="text-2xl font-bold">
                {Price_Rub.toLocaleString("ru-RU")} ₽
                {Unit_of_Measure && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{Unit_of_Measure}
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Уточняйте актуальную цену у менеджера
            </p>
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

      {/* Full description */}
      {Full_Description && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Описание</h2>
          <RichText content={Full_Description} />
        </section>
      )}

      {/* Client-side interactive parts */}
      <ProductDetailClient
        productId={product.id}
        productTitle={Title}
        reviews={publishedReviews}
        relatedProducts={Related_Products?.data ?? []}
      />
    </div>
  );
}
