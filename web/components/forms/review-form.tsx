"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { reviewFormSchema, type ReviewFormData } from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";
import { Star } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 5, consent: undefined },
  });

  const consent = watch("consent");
  const rating = watch("rating") ?? 0;

  async function onSubmit(data: ReviewFormData) {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, productId }),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      trackEvent("review_submit");
      toast({ title: "Отзыв отправлен", description: "Спасибо за ваш отзыв! Он появится после модерации." });
      reset();
      onSuccess?.();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось отправить отзыв. Попробуйте ещё раз.", variant: "destructive" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="hidden">
        <Input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="review-author">Имя *</Label>
        <Input id="review-author" {...register("author")} />
        {errors.author && <p className="mt-1 text-xs text-destructive">{errors.author.message}</p>}
      </div>
      <div>
        <Label>Оценка</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="rounded p-0.5 hover:scale-110"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setValue("rating", star)}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="review-text">Текст отзыва *</Label>
        <Textarea id="review-text" {...register("text")} rows={4} />
        {errors.text && <p className="mt-1 text-xs text-destructive">{errors.text.message}</p>}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="review-consent"
          checked={consent === true}
          onCheckedChange={(checked) => setValue("consent", checked === true ? true : (undefined as unknown as true))}
        />
        <Label htmlFor="review-consent" className="text-xs leading-tight">
          Согласен на{" "}
          <Link href="/privacy" className="underline" target="_blank">
            обработку персональных данных
          </Link>
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Отправка..." : "Отправить отзыв"}
      </Button>
    </form>
  );
}
