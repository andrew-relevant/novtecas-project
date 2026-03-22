import { Metadata } from "next";
import { fetchStrapi } from "@/lib/strapi";
import {
  StrapiResponse,
  StrapiEntry,
  PageAttributes,
} from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RichText } from "@/components/rich-text";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика обработки персональных данных компании Новтекас",
};

const FALLBACK_TEXT = `
<h2>Политика конфиденциальности</h2>
<p>
  Настоящая Политика конфиденциальности определяет порядок обработки и защиты
  персональных данных пользователей сайта novtecas.ru.
</p>
<p>
  Оставляя свои данные на сайте, вы соглашаетесь с условиями данной Политики
  и даёте согласие на обработку своих персональных данных в соответствии с
  Федеральным законом №152-ФЗ «О персональных данных».
</p>
<p>
  Мы гарантируем конфиденциальность и безопасность ваших данных. Для получения
  подробной информации свяжитесь с нами по электронной почте
  <a href="mailto:asfalt@NovTecAs.ru">asfalt@NovTecAs.ru</a>.
</p>
`;

export default async function PrivacyPage() {
  let content: string | null = null;

  try {
    const { data } = await fetchStrapi<
      StrapiResponse<StrapiEntry<PageAttributes>[]>
    >("/pages", {
      "filters[slug][$eq]": "privacy",
      "populate": "*",
    });

    if (data[0]) {
      content = data[0].attributes.content;
    }
  } catch {
    // CMS unavailable — use fallback
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Политика конфиденциальности</h1>

      <RichText
        content={content || FALLBACK_TEXT}
        className="mt-6"
      />
    </div>
  );
}
