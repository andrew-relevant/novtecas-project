"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  company: "Компания",
  about: "О компании",
  production: "Производство",
  technology: "Технология укладки",
  hydrophobic: "Гидрофобный слой",
  documents: "Документы",
  partners: "Партнёры",
  blacklist: "Чёрный список",
  products: "Продукция",
  portfolio: "Портфолио",
  dealers: "Дилерам",
  media: "Полезное",
  contacts: "Контакты",
  privacy: "Политика конфиденциальности",
};

interface BreadcrumbsProps {
  currentTitle?: string;
}

export function Breadcrumbs({ currentTitle }: BreadcrumbsProps) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label =
            isLast && currentTitle
              ? currentTitle
              : SEGMENT_LABELS[segment] || decodeURIComponent(segment);

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
