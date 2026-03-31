"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/modal-form";
import { DealerForm } from "@/components/forms/dealer-form";
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

declare global {
  interface Window {
    ymaps: any;
  }
}

function loadYmapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }

    const existing = document.getElementById("ymaps-script");
    if (existing) {
      const check = setInterval(() => {
        if (window.ymaps) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";
    const script = document.createElement("script");
    script.id = "ymaps-script";
    script.src = `https://api-maps.yandex.ru/2.1/?${apiKey ? `apikey=${apiKey}&` : ""}lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.ymaps) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(script);
  });
}

function buildBalloonContent(dealer: Dealer): string {
  let html = `<div style="padding:4px;max-width:260px;font-family:system-ui,sans-serif">`;
  html += `<div style="font-weight:600;font-size:14px;margin-bottom:4px">${dealer.title}</div>`;
  if (dealer.city) {
    html += `<div style="color:#888;font-size:13px">${dealer.city}</div>`;
  }
  if (dealer.address) {
    html += `<div style="margin-top:6px;font-size:13px;display:flex;gap:4px"><span>📍</span><span>${dealer.address}</span></div>`;
  }
  if (dealer.phone) {
    html += `<div style="margin-top:4px;font-size:13px;display:flex;gap:4px"><span>📞</span><a href="tel:${dealer.phone}" style="color:#1a73e8">${dealer.phone}</a></div>`;
  }
  if (dealer.contactInfo) {
    html += `<div style="margin-top:4px;font-size:12px;color:#888">${dealer.contactInfo}</div>`;
  }
  html += `</div>`;
  return html;
}

export function DealersClient({ dealers }: DealersClientProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkMapRef = useRef<Map<number, any>>(new Map());
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const scrollCardIntoView = useCallback((id: number) => {
    const el = cardRefs.current.get(id);
    const container = listRef.current;
    if (!el || !container) return;

    const pad = 4;
    const elRect = el.getBoundingClientRect();
    const boxRect = container.getBoundingClientRect();
    const topDelta = elRect.top - boxRect.top;
    const bottomDelta = elRect.bottom - boxRect.bottom;

    if (topDelta < pad) {
      container.scrollBy({ top: topDelta - pad, behavior: "smooth" });
    } else if (bottomDelta > -pad) {
      container.scrollBy({ top: bottomDelta + pad, behavior: "smooth" });
    }
  }, []);

  const selectDealer = useCallback((id: number) => {
    setSelectedId(id);
    scrollCardIntoView(id);
  }, [scrollCardIntoView]);

  useEffect(() => {
    let destroyed = false;

    loadYmapsScript().then(() => {
      if (destroyed || !mapContainerRef.current) return;

      window.ymaps.ready(() => {
        if (destroyed || !mapContainerRef.current || mapInstanceRef.current) return;

        const map = new window.ymaps.Map(mapContainerRef.current, {
          center: [MOSCOW_CENTER.lat, MOSCOW_CENTER.lng],
          zoom: 5,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapInstanceRef.current = map;

        const withCoords = dealers.filter((d) => d.coordinates);

        withCoords.forEach((dealer) => {
          const placemark = new window.ymaps.Placemark(
            [dealer.coordinates!.lat, dealer.coordinates!.lng],
            {
              balloonContentBody: buildBalloonContent(dealer),
              hintContent: dealer.title,
            },
            { preset: "islands#redDotIcon" },
          );

          placemark.events.add("balloonopen", () => selectDealer(dealer.id));

          map.geoObjects.add(placemark);
          placemarkMapRef.current.set(dealer.id, placemark);
        });

        if (withCoords.length > 1) {
          const bounds = map.geoObjects.getBounds();
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
          }
        } else if (withCoords.length === 1) {
          map.setCenter(
            [withCoords[0].coordinates!.lat, withCoords[0].coordinates!.lng],
            10,
          );
        }
      });
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      placemarkMapRef.current.clear();
    };
  }, [dealers, selectDealer]);

  const handleCardClick = (dealer: Dealer) => {
    setSelectedId(dealer.id);

    if (!dealer.coordinates) return;

    const placemark = placemarkMapRef.current.get(dealer.id);
    const map = mapInstanceRef.current;
    if (placemark && map) {
      map.setCenter(
        [dealer.coordinates.lat, dealer.coordinates.lng],
        10,
        { duration: 300 },
      );
      setTimeout(() => placemark.balloon.open(), 350);
    }
  };

  return (
    <>
      <div className="mt-6">
        <Button size="lg" onClick={() => setFormOpen(true)}>
          Подать заявку на дилерство
        </Button>
      </div>

      <ModalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Заявка на дилерство"
      >
        <DealerForm onSuccess={() => setFormOpen(false)} />
      </ModalForm>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
      <div className="overflow-hidden rounded-xl border lg:flex-1">
        <div ref={mapContainerRef} style={{ width: "100%", height: 500 }} />
      </div>

      <aside ref={listRef} className="-mx-1 max-h-[500px] overflow-y-auto lg:w-80">
        <div className="space-y-3 px-1 py-1">
          {dealers.map((dealer) => (
            <Card
              key={dealer.id}
              ref={(el) => {
                cardRefs.current.set(dealer.id, el);
              }}
              className={cn(
                "cursor-pointer transition-shadow hover:shadow-md",
                selectedId === dealer.id && "ring-2 ring-primary",
              )}
              onClick={() => handleCardClick(dealer)}
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
                    <a
                      href={`tel:${dealer.phone}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
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
        </div>
      </aside>
    </div>
    </>
  );
}
