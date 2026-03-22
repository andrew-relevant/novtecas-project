import { Breadcrumbs } from "@/components/breadcrumbs";
import { Calculator } from "@/components/calculator";
import { fetchStrapi } from "@/lib/strapi";
import type {
  StrapiResponse,
  StrapiEntry,
  ProductAttributes,
  ProductCategoryAttributes,
} from "@/lib/types";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const [productsRes, categoriesRes] = await Promise.all([
    fetchStrapi<StrapiResponse<StrapiEntry<ProductAttributes>[]>>("/products", {
      "populate": "*",
      "pagination[pageSize]": "100",
      "sort[0]": "Title:asc",
    }),
    fetchStrapi<StrapiResponse<StrapiEntry<ProductCategoryAttributes>[]>>(
      "/product-categories",
      { "pagination[pageSize]": "100" },
    ),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Каталог продукции</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Холодный и сухой асфальт от производителя. Выберите нужную категорию и
        рассчитайте необходимое количество с помощью калькулятора.
      </p>

      <div className="mt-8">
        <Calculator />
      </div>

      <ProductsClient
        products={productsRes.data}
        categories={categoriesRes.data}
      />
    </div>
  );
}
