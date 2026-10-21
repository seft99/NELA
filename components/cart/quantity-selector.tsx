"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  quantity,
  onChange,
  label = "Cantidad",
  disabled = false,
  max,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  label?: string;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <div className="quantity-selector" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={disabled || quantity <= 1}
        aria-label={`Reducir ${label.toLocaleLowerCase("es")}`}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${quantity}`}>{quantity}</output>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || (max !== undefined && quantity >= max)}
        aria-label={`Aumentar ${label.toLocaleLowerCase("es")}`}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
