"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { callbackFormSchema, type CallbackFormData } from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

interface CallbackFormProps {
  onSuccess?: () => void;
}

export function CallbackForm({ onSuccess }: CallbackFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CallbackFormData>({
    resolver: zodResolver(callbackFormSchema),
    defaultValues: { name: "", phone: "", consent: false },
  });

  const consent = watch("consent");

  async function onSubmit(data: CallbackFormData) {
    try {
      const res = await fetch("/api/leads/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      trackEvent("lead_callback_submit");
      toast({ title: "Заявка отправлена", description: "Мы перезвоним вам в ближайшее время" });
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
      <div>
        <Label htmlFor="cb-name">Имя *</Label>
        <Input id="cb-name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="cb-phone">Телефон *</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="cb-phone"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="cb-message">Сообщение</Label>
        <Textarea id="cb-message" {...register("message")} />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="cb-consent"
          checked={consent === true}
          onCheckedChange={(checked) => setValue("consent", checked === true)}
        />
        <Label htmlFor="cb-consent" className="text-xs leading-tight">
          Согласен на{" "}
          <Link href="/privacy" className="underline" target="_blank">
            обработку персональных данных
          </Link>
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Отправка..." : "Заказать звонок"}
      </Button>
    </form>
  );
}
