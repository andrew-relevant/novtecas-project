import { Star } from "lucide-react";
import { ReviewForm } from "@/components/forms/review-form";
import type { Review } from "@/lib/types";

interface ReviewsSectionProps {
  productId: string;
  reviews: Review[];
}

export function ReviewsSection({ productId, reviews }: ReviewsSectionProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">
        Отзывы{" "}
        {reviews.length > 0 && (
          <span className="text-base font-normal text-muted-foreground">
            ({reviews.length})
          </span>
        )}
      </h2>

      {reviews.length > 0 ? (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{review.author}</p>
                {review.rating && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (review.rating ?? 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {review.text}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Отзывов пока нет. Будьте первым!
        </p>
      )}

      <div className="mt-6 rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Оставить отзыв</h3>
        <ReviewForm productId={productId} />
      </div>
    </section>
  );
}
