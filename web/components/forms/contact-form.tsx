"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

interface ContactFormProps {
  onSuccess?: () => void;
}

export function ContactForm({ onSuccess }: ContactFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { consent: undefined },
  });

  const consent = watch("consent");

  async function onSubmit(data: ContactFormData) {
    try {
      const res = await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      trackEvent("contact_submit");
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
      <div>
        <Label htmlFor="contact-name">Имя *</Label>
        <Input id="contact-name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact-phone">Телефон *</Label>
        <Input id="contact-phone" type="tel" {...register("phone")} />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" type="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact-message">Сообщение</Label>
        <Textarea id="contact-message" {...register("message")} />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="contact-consent"
          checked={consent === true}
          onCheckedChange={(checked) => setValue("consent", checked === true ? true : (undefined as unknown as true))}
        />
        <Label htmlFor="contact-consent" className="text-xs leading-tight">
          Согласен на{" "}
          <Link href="/privacy" className="underline" target="_blank">
            обработку персональных данных
          </Link>
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Отправка..." : "Отправить"}
      </Button>
    </form>
  );
}
