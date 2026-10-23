"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  quantity,
  onChange,
  label = "Cantidad",
  disabled = false,
  max,
  busy = false,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  label?: string;
  disabled?: boolean;
  max?: number;
  busy?: boolean;
}) {
  return (
    <div
      className={`quantity-selector${busy ? " is-validating" : ""}`}
      role="group"
      aria-label={label}
      aria-busy={busy}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={disabled || quantity <= 1}
        aria-label={`Reducir ${label.toLocaleLowerCase("es")}`}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${quantity}`}>
        <span key={quantity}>{quantity}</span>
      </output>
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
