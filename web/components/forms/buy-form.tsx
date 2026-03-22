"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { buyFormSchema, type BuyFormData } from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

interface BuyFormProps {
  productTitle?: string;
  onSuccess?: () => void;
}

export function BuyForm({ productTitle, onSuccess }: BuyFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuyFormData>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: { product: productTitle ?? "", consent: undefined },
  });

  const consent = watch("consent");

  async function onSubmit(data: BuyFormData) {
    try {
      const res = await fetch("/api/leads/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      trackEvent("lead_buy_submit");
      toast({ title: "Заявка отправлена", description: "Мы свяжемся с вами в ближайшее время" });
      reset();
      onSuccess?.();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось отправить заявку. Попробуйте ещё раз.", variant: "destructive" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="hidden">
        <Input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
      </div>
      {productTitle && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm font-medium">Товар: {productTitle}</p>
          <input type="hidden" {...register("product")} />
        </div>
      )}
      <div>
        <Label htmlFor="buy-name">Имя *</Label>
        <Input id="buy-name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="buy-phone">Телефон *</Label>
        <Input id="buy-phone" type="tel" {...register("phone")} />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="buy-email">Email</Label>
        <Input id="buy-email" type="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="buy-message">Комментарий</Label>
        <Textarea id="buy-message" {...register("message")} />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="buy-consent"
          checked={consent === true}
          onCheckedChange={(checked) => setValue("consent", checked === true ? true : (undefined as unknown as true))}
        />
        <Label htmlFor="buy-consent" className="text-xs leading-tight">
          Согласен на{" "}
          <Link href="/privacy" className="underline" target="_blank">
            обработку персональных данных
          </Link>
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Отправка..." : "Отправить заявку"}
      </Button>
    </form>
  );
}
