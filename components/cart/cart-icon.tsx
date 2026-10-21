"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function CartIcon() {
  const { hydrated, openCart, totalUnits } = useCart();
  const visibleCount = hydrated ? totalUnits : 0;
  const label = visibleCount
    ? `Abrir carrito, ${visibleCount} ${visibleCount === 1 ? "producto" : "productos"}`
    : "Abrir carrito";

  return (
    <button className="icon-button cart-icon-button" type="button" onClick={openCart} aria-label={label}>
      <ShoppingBag size={20} strokeWidth={1.7} aria-hidden="true" />
      {visibleCount ? <span className="cart-count" aria-hidden="true">{visibleCount}</span> : null}
    </button>
  );
}
