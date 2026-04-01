"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { City } from "@/lib/cities";

const FALLBACK: City = {
  id: 0,
  name: "Москва",
  slug: "",
  domain: "novtecas.ru",
  namePrepositional: "Москве",
  nameDative: "Москве",
  phones: ["+7 (499) 504-41-63"],
  postalCode: "445045",
  address: "ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1",
  warehouseAddress: "",
  mapCenter: { lat: 55.7322, lng: 37.6209 },
  isDefault: true,
};

interface CityContextValue {
  city: City;
  allCities: City[];
}

const CityContext = createContext<CityContextValue>({
  city: FALLBACK,
  allCities: [FALLBACK],
});

export function CityProvider({
  city,
  allCities,
  children,
}: {
  city: City;
  allCities: City[];
  children: ReactNode;
}) {
  return (
    <CityContext.Provider value={{ city, allCities }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): City {
  return useContext(CityContext).city;
}

export function useAllCities(): City[] {
  return useContext(CityContext).allCities;
}
