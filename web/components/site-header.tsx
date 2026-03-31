"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const NAV_ITEMS = [
  {
    label: "Компания",
    href: "/company/about",
    children: [
      { label: "О компании", href: "/company/about" },
      { label: "Производство", href: "/company/production" },
      { label: "Технология укладки", href: "/company/production/technology", indent: true },
      { label: "Гидрофобный слой", href: "/company/production/hydrophobic", indent: true },
      { label: "Документы", href: "/company/documents" },
      { label: "Наши партнёры", href: "/company/partners" },
      { label: "Чёрный список", href: "/company/blacklist" },
    ],
  },
  {
    label: "Продукция",
    href: "/products",
  },
  {
    label: "Портфолио",
    href: "/portfolio",
  },
  {
    label: "Дилерам",
    href: "/dealers",
  },
  {
    label: "Полезное",
    href: "/media",
    children: [
      { label: "Новости", href: "/media?type=news" },
      { label: "Статьи", href: "/media?type=article" },
      { label: "Видео", href: "/media?type=video" },
    ],
  },
  {
    label: "Контакты",
    href: "/contacts",
  },
];

interface SiteHeaderProps {
  onOpenContactModal?: () => void;
  onOpenCallbackModal?: () => void;
}

export function SiteHeader({
  onOpenContactModal,
  onOpenCallbackModal,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY <= 0) {
      setVisible(true);
    } else if (currentY > lastScrollY.current) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-background/60 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Новтекас"
            width={480}
            height={156}
            className="h-20 w-auto -translate-y-1"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <NavigationMenu className="hidden xl:flex">
          <NavigationMenuList>
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuTrigger className="text-sm">
                    {item.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[240px] gap-1 p-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={child.href}
                              className={`block rounded-md px-3 py-2 text-sm hover:bg-accent ${
                                child.indent ? "pl-6 text-muted-foreground" : ""
                              }`}
                            >
                              {child.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <a
            href="tel:88007070471"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium"
          >
            <Phone className="h-4 w-4" />
            8 (800) 707-04-71
          </a>
          <Button size="sm" onClick={onOpenCallbackModal}>
            Заказать звонок
          </Button>
        </div>

        {/* Mobile nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="xl:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Меню</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px]">
            <div className="flex flex-col gap-4 pt-8">
              <a
                href="tel:88007070471"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                8 (800) 707-04-71
              </a>
              <p className="text-xs text-muted-foreground">08:00–20:00</p>
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <div className="ml-4 flex flex-col">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground ${
                              child.indent ? "ml-4" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenCallbackModal?.();
                  }}
                >
                  Заказать звонок
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
