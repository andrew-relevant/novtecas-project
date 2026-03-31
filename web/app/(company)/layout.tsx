"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Factory,
  FileText,
  Handshake,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string }[];
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: "/about", label: "О компании", icon: Building2 },
  {
    href: "/production",
    label: "Производство",
    icon: Factory,
    children: [
      { href: "/production/technology", label: "Технология укладки" },
      { href: "/production/hydrophobic", label: "Гидрофобный слой" },
    ],
  },
  { href: "/documents", label: "Документы", icon: FileText },
  { href: "/partners", label: "Партнёры", icon: Handshake },
  { href: "/blacklist", label: "Чёрный список", icon: ShieldAlert },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="hidden w-60 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {SIDEBAR_LINKS.map(({ href, label, icon: Icon, children: sub }) => {
              const isActive = pathname === href;
              const isParentActive = pathname.startsWith(href);
              return (
                <div key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                  {sub && isParentActive && (
                    <div className="ml-7 mt-1 space-y-1 border-l pl-3">
                      {sub.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            pathname === child.href
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-wrap gap-2 md:hidden">
          {SIDEBAR_LINKS.flatMap(({ href, label, icon: Icon, children: sub }) => {
            const items = [
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent",
                  pathname === href && "border-primary bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>,
            ];
            if (sub) {
              for (const child of sub) {
                items.push(
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent",
                      pathname === child.href && "border-primary bg-primary/10 text-primary",
                    )}
                  >
                    {child.label}
                  </Link>,
                );
              }
            }
            return items;
          })}
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
