"use client";

import Link from "next/link";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">НОВТЕКАС</span>
        </Link>

        {/* Desktop nav */}
        <NavigationMenu className="hidden lg:flex">
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
                              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
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

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:88007070471"
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            <Phone className="h-4 w-4" />
            8 (800) 707-04-71
          </a>
          <Button size="sm" onClick={onOpenCallbackModal} variant="outline">
            Заказать звонок
          </Button>
          <Button size="sm" onClick={onOpenContactModal}>
            Заказать
          </Button>
        </div>

        {/* Mobile nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
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
                            className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  variant="outline"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenCallbackModal?.();
                  }}
                >
                  Заказать звонок
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenContactModal?.();
                  }}
                >
                  Заказать
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
