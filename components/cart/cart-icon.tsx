"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/use-cart";

export function CartIcon() {
  const { hydrated, openCart, totalUnits } = useCart();
  const visibleCount = hydrated ? totalUnits : 0;
  const previousCountRef = useRef(visibleCount);
  const hydratedRef = useRef(false);
  const pulseTimerRef = useRef<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const label = visibleCount
    ? `Abrir carrito, ${visibleCount} ${visibleCount === 1 ? "producto" : "productos"}`
    : "Abrir carrito";

  useEffect(() => {
    if (!hydrated) return;
    if (hydratedRef.current && visibleCount > previousCountRef.current) {
      setPulse(false);
      window.requestAnimationFrame(() => setPulse(true));
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => {
        setPulse(false);
        pulseTimerRef.current = null;
      }, 520);
    }
    hydratedRef.current = true;
    previousCountRef.current = visibleCount;
  }, [hydrated, visibleCount]);

  useEffect(() => () => {
    if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
  }, []);

  return (
    <button className="icon-button cart-icon-button" type="button" onClick={openCart} aria-label={label}>
      <ShoppingBag size={20} strokeWidth={1.7} aria-hidden="true" />
      {visibleCount ? <span className={`cart-count${pulse ? " is-pulsing" : ""}`} aria-hidden="true">{visibleCount}</span> : null}
    </button>
  );
}
