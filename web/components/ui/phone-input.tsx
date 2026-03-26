"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const MASK = "+7 (___) ___-__-__";
const MASK_CHARS = MASK.split("");
const DIGIT_SLOTS = MASK_CHARS
  .map((ch, i) => (ch === "_" ? i : -1))
  .filter((i) => i !== -1);

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  let result = MASK;
  for (let i = 0; i < digits.length; i++) {
    result = result.replace("_", digits[i]);
  }
  const lastFilledSlot = digits.length > 0 ? DIGIT_SLOTS[digits.length - 1] : 3;
  return result.slice(0, lastFilledSlot + 1);
}

function extractDigits(masked: string): string {
  const withoutPrefix = masked.replace(/^\+7\s*/, "");
  return withoutPrefix.replace(/\D/g, "");
}

interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, onBlur, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    const displayValue = value ? applyMask(extractDigits(value)) : "";

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const input = e.target.value;

      if (input === "" || input === "+" || input === "+7") {
        onChange?.("");
        return;
      }

      const digits = extractDigits(input);
      const masked = applyMask(digits);
      onChange?.(masked);

      requestAnimationFrame(() => {
        const el = innerRef.current;
        if (!el) return;
        const filledCount = digits.length;
        if (filledCount > 0 && filledCount <= 10) {
          const cursorPos = DIGIT_SLOTS[filledCount - 1] + 1;
          el.setSelectionRange(cursorPos, cursorPos);
        }
      });
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      const el = e.currentTarget;
      const pos = el.selectionStart ?? 0;

      if (e.key === "Backspace" && pos <= 4 && displayValue.length <= 4) {
        e.preventDefault();
        onChange?.("");
        return;
      }

      if (e.key === "Backspace" && pos > 0) {
        e.preventDefault();
        const digits = extractDigits(displayValue);
        if (digits.length > 0) {
          const newDigits = digits.slice(0, -1);
          const masked = newDigits.length > 0 ? applyMask(newDigits) : "";
          onChange?.(masked);
        }
      }
    }

    function handleFocus() {
      if (!displayValue) {
        onChange?.("+7 (");
        requestAnimationFrame(() => {
          innerRef.current?.setSelectionRange(4, 4);
        });
      }
    }

    function handleBlur() {
      if (displayValue === "+7 (" || displayValue === "+7 " || displayValue === "+7") {
        onChange?.("");
      }
      onBlur?.();
    }

    return (
      <input
        type="tel"
        inputMode="tel"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={combinedRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="+7 (___) ___-__-__"
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
