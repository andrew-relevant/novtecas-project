import { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, MapPin, Phone, Warehouse } from "lucide-react";
import { fetchStrapi } from "@/lib/strapi";
import { PageContacts, StrapiResponse } from "@/lib/types";
import { getCityFromHeaders } from "@/lib/get-city";
import { getCityPhone, getCityPhoneHref, FALLBACK_PHONE } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контактная информация компании Новтекас",
};

export default async function ContactsPage() {
  const [city, { data: pageContacts }] = await Promise.all([
    getCityFromHeaders(),
    fetchStrapi<StrapiResponse<PageContacts>>("/page-contacts", {
      params: { "populate[departments]": "true" },
      fallback: { data: null },
    }),
  ]);

  const departments = pageContacts?.departments ?? [];
  const cityPhone = getCityPhone(city);
  const cityPhoneHref = getCityPhoneHref(city);
  const displayAddress = city.address || city.warehouseAddress;

  const mapCoords = city.mapCenter;
  const mapSrc = mapCoords
    ? `https://yandex.ru/map-widget/v1/?ll=${mapCoords.lng},${mapCoords.lat}&z=16&pt=${mapCoords.lng},${mapCoords.lat},pm2rdm`
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">
        Контакты{city.name !== "Москва" ? ` в ${city.namePrepositional}` : ""}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Свяжитесь с нами</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="space-y-1">
                  <a
                    href={cityPhoneHref}
                    className="block font-medium hover:underline"
                  >
                    {cityPhone}
                  </a>
                  {city.phones.slice(1).map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="block hover:underline"
                    >
                      {phone}
                    </a>
                  ))}
                  {cityPhone !== FALLBACK_PHONE && (
                    <a
                      href="tel:88007070471"
                      className="block text-muted-foreground hover:underline"
                    >
                      {FALLBACK_PHONE} (бесплатный)
                    </a>
                  )}
                  {departments.length > 0 && (
                    <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                      {departments.map((dept) => (
                        <p key={dept.id}>
                          {dept.name} — доп. номер ({dept.extension})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <a
                  href="mailto:asfalt@NovTecAs.ru"
                  className="hover:underline"
                >
                  asfalt@NovTecAs.ru
                </a>
              </div>

              {displayAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Адрес</p>
                    <p className="text-sm text-muted-foreground">
                      {city.postalCode ? `${city.postalCode}, ` : ""}
                      {city.name !== "Москва" ? `г. ${city.name}, ` : ""}
                      {displayAddress}
                    </p>
                  </div>
                </div>
              )}

              {city.warehouseAddress && city.address && (
                <div className="flex items-start gap-3">
                  <Warehouse className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Склад</p>
                    <p className="text-sm text-muted-foreground">
                      {city.warehouseAddress}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Пн–Вс: 08:00–20:00</span>
              </div>
            </CardContent>
          </Card>

          {mapSrc && (
            <div className="overflow-hidden rounded-xl border">
              <iframe
                src={mapSrc}
                width="100%"
                height="300"
                frameBorder="0"
                allowFullScreen
                title={`Карта — офис Новтекас в ${city.namePrepositional}`}
                className="block"
              />
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Напишите нам</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
