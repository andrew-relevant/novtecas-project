"use client";

import { useState } from "react";
import { MapPin, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useCity, useAllCities } from "@/lib/city-context";
import { buildCityUrl, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function CitySelector() {
  const city = useCity();
  const allCities = useAllCities();
  const [open, setOpen] = useState(false);

  function handleSelect(selected: City) {
    setOpen(false);
    if (selected.slug === city.slug) return;

    const currentPath = window.location.pathname + window.location.search;
    window.location.href = buildCityUrl(selected, currentPath);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="gap-1.5 px-2 text-sm font-medium"
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="max-w-[120px] truncate">{city.name}</span>
          <ChevronsUpDown className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Найти город..." />
          <CommandList>
            <CommandEmpty>Город не найден</CommandEmpty>
            <CommandGroup>
              {allCities.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => handleSelect(c)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      c.slug === city.slug ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
