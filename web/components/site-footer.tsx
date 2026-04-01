import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { City } from "@/lib/cities";
import { getCityPhone, FALLBACK_PHONE } from "@/lib/cities";

const FOOTER_NAV = [
  { label: "О компании", href: "/about" },
  { label: "Продукция", href: "/products" },
  { label: "Портфолио", href: "/portfolio" },
  { label: "Дилерам", href: "/dealers" },
  { label: "Полезное", href: "/media" },
  { label: "Контакты", href: "/contacts" },
];

interface SiteFooterProps {
  city: City;
}

export function SiteFooter({ city }: SiteFooterProps) {
  const cityPhone = getCityPhone(city);
  const cityPhoneHref = `tel:${cityPhone.replace(/[^+\d]/g, "")}`;

  const displayAddress = city.address || city.warehouseAddress;

  return (
    <footer className="border-t bg-secondary">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Новтекас"
                width={400}
                height={130}
                className="h-16 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Производство и продажа дорожных покрытий. Холодный асфальт в мешках
              от производителя.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Навигация</h4>
            <nav className="flex flex-col gap-1.5">
              {FOOTER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">
              Контакты{city.name !== "Москва" ? ` в ${city.namePrepositional}` : ""}
            </h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href={cityPhoneHref}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {cityPhone}
              </a>
              {cityPhone !== FALLBACK_PHONE && (
                <a
                  href="tel:88007070471"
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {FALLBACK_PHONE}
                </a>
              )}
              <a
                href="mailto:asfalt@NovTecAs.ru"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                asfalt@NovTecAs.ru
              </a>
              {displayAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {city.postalCode ? `${city.postalCode}, ` : ""}
                    {city.name !== "Москва" ? `г. ${city.name}, ` : ""}
                    {displayAddress}
                  </span>
                </div>
              )}
              <p className="text-xs">Часы работы: 08:00–20:00</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Новтекас. Все права защищены.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Политика конфиденциальности
            </Link>
            <span>
              Разработка сайта —{" "}
              <a
                href="https://relevant.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Relevant
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
