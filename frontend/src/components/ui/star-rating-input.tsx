"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "rounded p-0.5 transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            n <= value ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-500/50",
          )}
          aria-pressed={n <= value}
        >
          <Star className="h-6 w-6 fill-current" />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/25")}
        />
      ))}
    </div>
  );
}
