import { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { fetchStrapi } from "@/lib/strapi";
import { PageContacts, StrapiResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контактная информация компании Новтекас",
};

const CONTACTS = {
  phones: ["8 (800) 707-04-71", "+7 (499) 504-41-63"],
  email: "asfalt@NovTecAs.ru",
  legalAddress:
    "119180, г. Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1",
  postalAddress: "445021, г. Тольятти, А/Я №3667",
  workingHours: "08:00–20:00",
} as const;

const MAP_CENTER = { lat: 55.7367, lng: 37.6186 };

export default async function ContactsPage() {
  const { data: pageContacts } = await fetchStrapi<StrapiResponse<PageContacts>>(
    "/page-contacts",
    { params: { "populate[departments]": "true" }, fallback: null },
  );

  const departments = pageContacts?.departments ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold">Контакты</h1>

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
                  {CONTACTS.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="block hover:underline"
                    >
                      {phone}
                    </a>
                  ))}
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
                  href={`mailto:${CONTACTS.email}`}
                  className="hover:underline"
                >
                  {CONTACTS.email}
                </a>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Юридический адрес</p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACTS.legalAddress}
                  </p>
                  <p className="mt-2 text-sm font-medium">Почтовый адрес</p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACTS.postalAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Пн–Вс: {CONTACTS.workingHours}</span>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-xl border">
            <iframe
              src={`https://yandex.ru/map-widget/v1/?ll=${MAP_CENTER.lng},${MAP_CENTER.lat}&z=16&pt=${MAP_CENTER.lng},${MAP_CENTER.lat},pm2rdm`}
              width="100%"
              height="300"
              frameBorder="0"
              allowFullScreen
              title="Карта — офис Новтекас"
              className="block"
            />
          </div>
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
