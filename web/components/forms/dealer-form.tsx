"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  dealerFormSchema,
  type DealerFormData,
  DEALER_ATTACHMENT_MAX_SIZE,
  DEALER_ATTACHMENT_ACCEPTED_TYPES,
  DEALER_ATTACHMENT_ACCEPT,
} from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { Download, Paperclip, X } from "lucide-react";

interface DealerFormProps {
  onSuccess?: () => void;
}

export function DealerForm({ onSuccess }: DealerFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DealerFormData>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: { name: "", phone: "", consent: false },
  });

  const consent = watch("consent");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (!DEALER_ATTACHMENT_ACCEPTED_TYPES.includes(selected.type)) {
      setFileError("Допустимые форматы: .docx, .doc, .pdf");
      setFile(null);
      return;
    }
    if (selected.size > DEALER_ATTACHMENT_MAX_SIZE) {
      setFileError("Максимальный размер файла — 10 МБ");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function removeFile() {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: DealerFormData) {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone", data.phone);
      if (data.email) formData.append("email", data.email);
      if (data.company) formData.append("company", data.company);
      if (data.message) formData.append("message", data.message);
      formData.append("consent", String(data.consent));
      if (data.honeypot) formData.append("honeypot", data.honeypot);
      if (file) formData.append("attachment", file);

      const res = await fetch("/api/leads/dealer", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      trackEvent("lead_dealer_submit");
      toast({ title: "Заявка отправлена", description: "Мы свяжемся с вами в ближайшее время" });
      reset();
      removeFile();
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
        <Label htmlFor="dealer-name">Имя *</Label>
        <Input id="dealer-name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="dealer-phone">Телефон *</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="dealer-phone"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="dealer-email">Email</Label>
        <Input id="dealer-email" type="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="dealer-company">Компания</Label>
        <Input id="dealer-company" {...register("company")} />
      </div>
      <div>
        <Label htmlFor="dealer-message">Комментарий</Label>
        <Textarea id="dealer-message" {...register("message")} />
      </div>

      <div className="space-y-2">
        <Label>Анкета дилера</Label>
        <p className="text-sm text-muted-foreground">
          Приложите заполненную анкету к форме, и наши менеджеры свяжутся с вами.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="/files/anketa-dilera.docx"
            download
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Скачать шаблон анкеты
          </a>
        </div>
        <div>
          {file ? (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={removeFile}
                className="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="dealer-attachment"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Paperclip className="h-4 w-4" />
              Прикрепить заполненную анкету (.docx, .doc, .pdf)
            </label>
          )}
          <input
            ref={fileInputRef}
            id="dealer-attachment"
            type="file"
            accept={DEALER_ATTACHMENT_ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
          />
          {fileError && <p className="mt-1 text-xs text-destructive">{fileError}</p>}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="dealer-consent"
          checked={consent === true}
          onCheckedChange={(checked) => setValue("consent", checked === true)}
        />
        <Label htmlFor="dealer-consent" className="text-xs leading-tight">
          Согласен на{" "}
          <Link href="/privacy" className="underline" target="_blank">
            обработку персональных данных
          </Link>
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Отправка..." : "Подать заявку на дилерство"}
      </Button>
    </form>
  );
}
