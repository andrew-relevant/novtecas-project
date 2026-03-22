import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "@/components/layout-client";
import { SiteFooter } from "@/components/site-footer";
import { YandexMetrika } from "@/components/yandex-metrika";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Новтекас — Производство и продажа дорожных покрытий",
    template: "%s | Новтекас",
  },
  description:
    "Новтекас — производство и продажа холодного асфальта в мешках. Каталог продукции, портфолио, дилерская сеть.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://novtecas.ru"),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Новтекас",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <YandexMetrika />
        <LayoutClient>{children}</LayoutClient>
        <SiteFooter />
      </body>
    </html>
  );
}
