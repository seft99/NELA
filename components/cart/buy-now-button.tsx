"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { useCart } from "@/hooks/use-cart";
import { validateProductSelection } from "@/lib/cart/cart-utils";
import { validatePurchaseInventory } from "@/lib/cart/cart-utils";
import { isProductPurchasable } from "@/lib/products/inventory";
import { createDirectPurchaseCheckout } from "@/lib/cart/whatsapp-checkout";
import { productInventoryLine, validateInventoryLines } from "@/lib/cart/inventory-client";
import type { SelectedVariant } from "@/types/cart";
import type { Product } from "@/types/product";

type PurchaseStatus = { type: "success" | "error"; message: string };

export function BuyNowButton({
  product,
  quantity = 1,
  selectedVariants = [],
  placement,
  onStatus,
  compact = false,
}: {
  product: Product;
  quantity?: number;
  selectedVariants?: SelectedVariant[];
  placement: "card" | "detail";
  onStatus?: (status: PurchaseStatus) => void;
  compact?: boolean;
}) {
  const { whatsappNumber, siteUrl } = useCart();
  const checkout = useMemo(
    () => createDirectPurchaseCheckout(whatsappNumber, product, quantity, selectedVariants, siteUrl),
    [product, quantity, selectedVariants, siteUrl, whatsappNumber],
  );
  const className = placement === "card"
    ? `product-add-button product-buy-button${compact ? " product-buy-button--compact" : ""}`
    : "button button-primary purchase-buy-button";
  const needsProductOptions = placement === "card" &&
    (product.variants?.some((variant) => variant.required) ?? false);

  if (!isProductPurchasable(product)) {
    return (
      <button className={className} type="button" disabled aria-label={`Comprar ${product.name}`}>
        {compact ? "No disponible" : "Comprar ahora"}
      </button>
    );
  }

  if (needsProductOptions) {
    return (
      <Link className={className} href={`/productos/${product.slug}`} aria-label={`Elegir opciones para comprar ${product.name}`}>
        <MessageCircle size={15} aria-hidden="true" /> {compact ? "Comprar" : "Comprar ahora"}
      </Link>
    );
  }

  const handleClick = async () => {
    const selectionError = validateProductSelection(product, selectedVariants);
    if (selectionError) {
      onStatus?.({ type: "error", message: selectionError });
      return;
    }
    const inventoryError = validatePurchaseInventory(product, quantity, selectedVariants);
    if (inventoryError) {
      onStatus?.({ type: "error", message: inventoryError });
      return;
    }
    try {
      const validation = await validateInventoryLines([
        productInventoryLine(product, quantity, selectedVariants),
      ]);
      if (!validation.valid) {
        onStatus?.({ type: "error", message: validation.issues[0]?.message ?? "El producto ya no está disponible." });
        return;
      }
    } catch (error) {
      onStatus?.({ type: "error", message: error instanceof Error ? error.message : "No fue posible confirmar las existencias." });
      return;
    }
    if (!checkout.isNumberValid) {
      onStatus?.({ type: "error", message: "El número oficial de WhatsApp aún no está configurado." });
      return;
    }
    window.open(checkout.url ?? undefined, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      className={className}
      type="button"
      onClick={handleClick}
      disabled={placement === "card" && !checkout.isNumberValid}
      title={!checkout.isNumberValid ? "WhatsApp aún no está configurado" : undefined}
      aria-label={`Comprar ${product.name} ahora por WhatsApp`}
    >
      <MessageCircle size={placement === "card" ? 15 : 17} aria-hidden="true" /> {compact ? "Comprar" : placement === "detail" ? "Comprar por WhatsApp" : "Comprar ahora"}
    </button>
  );
}
