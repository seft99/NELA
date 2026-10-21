"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/product";
import { isProductPurchasable } from "@/lib/products/inventory";
import { productInventoryLine, validateInventoryLines } from "@/lib/cart/inventory-client";

export function AddToCartButton({ product }: { product: Product }) {
  const { addProduct } = useCart();
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const hasRequiredVariants = product.variants?.some((variant) => variant.required) ?? false;

  if (!isProductPurchasable(product)) {
    return <button className="product-add-button" type="button" disabled>Agregar al carrito</button>;
  }

  if (hasRequiredVariants) {
    return (
      <Link className="product-add-button" href={`/productos/${product.slug}`}>
        <ShoppingBag size={15} aria-hidden="true" /> Agregar al carrito
      </Link>
    );
  }

  return (
    <button
      className={`product-add-button${added ? " is-added" : ""}`}
      type="button"
      disabled={checking || blocked}
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
      {checking ? "Confirmando…" : blocked ? "No disponible" : added ? "Añadido" : "Agregar al carrito"}
    </button>
  );
}
