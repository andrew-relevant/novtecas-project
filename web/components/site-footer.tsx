import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FOOTER_NAV = [
  { label: "О компании", href: "/company/about" },
  { label: "Продукция", href: "/products" },
  { label: "Портфолио", href: "/portfolio" },
  { label: "Дилерам", href: "/dealers" },
  { label: "Полезное", href: "/media" },
  { label: "Контакты", href: "/contacts" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Новтекас"
                width={200}
                height={53}
                className="h-12 w-auto dark:invert"
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
            <h4 className="mb-3 text-sm font-semibold">Контакты</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href="tel:88007070471"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                8 (800) 707-04-71
              </a>
              <a
                href="tel:+74995044163"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +7 (499) 504-41-63
              </a>
              <a
                href="mailto:asfalt@NovTecAs.ru"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                asfalt@NovTecAs.ru
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  119180, г. Москва<br/> ул. Большая Полянка, д. 51А/9, этаж 8,
                  помещение&nbsp;1
                </span>
              </div>
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
