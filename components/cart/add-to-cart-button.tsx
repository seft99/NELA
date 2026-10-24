"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/product";
import { isProductPurchasable } from "@/lib/products/inventory";
import { productInventoryLine, validateInventoryLines } from "@/lib/cart/inventory-client";

export function AddToCartButton({
  product,
  compact = false,
  mobileCompact = false,
}: {
  product: Product;
  compact?: boolean;
  mobileCompact?: boolean;
}) {
  const { addProduct } = useCart();
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const hasRequiredVariants = product.variants?.some((variant) => variant.required) ?? false;
  const className = `product-add-button${compact ? " product-add-button--compact" : ""}${mobileCompact ? " product-button--mobile-compact" : ""}`;
  const defaultLabel = compact
    ? "Carrito"
    : mobileCompact
      ? (
          <>
            <span className="product-button-label product-button-label--desktop">Agregar al carrito</span>
            <span className="product-button-label product-button-label--mobile">Carrito</span>
          </>
        )
      : "Agregar al carrito";

  if (!isProductPurchasable(product)) {
    return (
      <button className={className} type="button" disabled aria-label={`Agregar ${product.name} al carrito`}>
        No disponible
      </button>
    );
  }

  if (hasRequiredVariants) {
    return (
      <Link
        className={className}
        href={`/productos/${product.slug}`}
        aria-label={`Elegir opciones y agregar ${product.name} al carrito`}
      >
        <ShoppingBag size={15} aria-hidden="true" /> {defaultLabel}
      </Link>
    );
  }

  return (
    <button
      className={`${className}${added ? " is-added" : ""}`}
      type="button"
      disabled={checking || blocked}
      aria-label={`Agregar ${product.name} al carrito`}
      onClick={async () => {
        setChecking(true);
        setBlocked(false);
        try {
          const validation = await validateInventoryLines([productInventoryLine(product, 1, [])]);
          if (!validation.valid) {
            setBlocked(true);
            return;
          }
          const result = addProduct(product);
          setAdded(result.ok);
          setBlocked(!result.ok);
        } catch {
          setBlocked(true);
        } finally {
          setChecking(false);
        }
      }}
    >
      {added ? <Check size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
      {checking
        ? "Confirmando…"
        : blocked
          ? "No disponible"
          : added
            ? "Añadido"
            : defaultLabel}
    </button>
  );
}
