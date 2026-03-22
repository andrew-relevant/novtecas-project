"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Dealer {
  id: number;
  title: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  coordinates: { lat: number; lng: number } | null;
  contactInfo: string | null;
}

interface DealersClientProps {
  dealers: Dealer[];
}

const MOSCOW_CENTER = { lat: 55.7558, lng: 37.6173 };

function buildMapUrl(dealers: Dealer[]): string {
  const base = "https://yandex.ru/map-widget/v1/";
  const params = new URLSearchParams({
    ll: `${MOSCOW_CENTER.lng},${MOSCOW_CENTER.lat}`,
    z: "5",
  });

  const pts = dealers
    .filter((d) => d.coordinates)
    .map((d) => `${d.coordinates!.lng},${d.coordinates!.lat},pm2rdm`)
    .join("~");

  if (pts) {
    params.set("pt", pts);
  }

  return `${base}?${params.toString()}`;
}

export function DealersClient({ dealers }: DealersClientProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="mt-8 flex flex-col gap-6 lg:flex-row">
      <div className="overflow-hidden rounded-xl border lg:flex-1">
        <iframe
          src={buildMapUrl(dealers)}
          width="100%"
          height="500"
          frameBorder="0"
          allowFullScreen
          className="block"
          title="Карта дилеров"
        />
      </div>

      <aside className="max-h-[500px] space-y-3 overflow-y-auto lg:w-80">
        {dealers.map((dealer) => (
          <Card
            key={dealer.id}
            className={cn(
              "cursor-pointer transition-shadow hover:shadow-md",
              selectedId === dealer.id && "ring-2 ring-primary",
            )}
            onClick={() => setSelectedId(dealer.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{dealer.title}</CardTitle>
              {dealer.city && (
                <p className="text-sm text-muted-foreground">{dealer.city}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {dealer.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {dealer.address}
                </p>
              )}
              {dealer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${dealer.phone}`} className="hover:underline">
                    {dealer.phone}
                  </a>
                </p>
              )}
              {dealer.contactInfo && (
                <p className="text-muted-foreground">{dealer.contactInfo}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {dealers.length === 0 && (
          <p className="text-muted-foreground">Дилеры пока не добавлены.</p>
        )}
      </aside>
    </div>
  );
}
