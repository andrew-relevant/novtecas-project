"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalcIcon } from "lucide-react";

const DENSITY = 2000; // кг/м³

interface CalculatorProps {
  onOrder?: (data: { volume: number; mass: number; bags: number; bagWeight: number }) => void;
}

export function Calculator({ onOrder }: CalculatorProps) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [bagWeight, setBagWeight] = useState<30 | 50>(30);

  const result = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);

    if (!l || !w || !d || l <= 0 || w <= 0 || d <= 0) return null;

    const volume = l * w * (d / 100);
    const mass = volume * DENSITY;
    const bags = Math.ceil(mass / bagWeight);

    return { volume: Math.round(volume * 1000) / 1000, mass: Math.round(mass), bags };
  }, [length, width, depth, bagWeight]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalcIcon className="h-5 w-5" />
          Калькулятор расхода
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="calc-length">Длина участка (м)</Label>
            <Input
              id="calc-length"
              type="number"
              min={0}
              step={0.1}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="calc-width">Ширина участка (м)</Label>
            <Input
              id="calc-width"
              type="number"
              min={0}
              step={0.1}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="calc-depth">Глубина / толщина (см)</Label>
            <Input
              id="calc-depth"
              type="number"
              min={0}
              step={0.5}
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Label>Вес мешка:</Label>
          <div className="flex gap-2">
            <Button
              variant={bagWeight === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setBagWeight(30)}
            >
              30 кг
            </Button>
            <Button
              variant={bagWeight === 50 ? "default" : "outline"}
              size="sm"
              onClick={() => setBagWeight(50)}
            >
              50 кг
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Объём</p>
                <p className="text-lg font-semibold">{result.volume} м³</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Масса</p>
                <p className="text-lg font-semibold">
                  {result.mass.toLocaleString("ru-RU")} кг
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Количество мешков</p>
                <p className="text-lg font-semibold">
                  {result.bags} шт. ({bagWeight} кг)
                </p>
              </div>
            </div>
            {onOrder && (
              <Button
                className="mt-3 w-full"
                onClick={() =>
                  onOrder({
                    volume: result.volume,
                    mass: result.mass,
                    bags: result.bags,
                    bagWeight,
                  })
                }
              >
                Заказать расчётное количество
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
