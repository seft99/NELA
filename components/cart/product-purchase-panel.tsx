"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";
import { useCart } from "@/hooks/use-cart";
import type { SelectedVariant, VariantSelections } from "@/types/cart";
import type { Product } from "@/types/product";
import { getAvailableStock, isProductPurchasable } from "@/lib/products/inventory";
import { productInventoryLine, validateInventoryLines } from "@/lib/cart/inventory-client";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { addProduct, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<VariantSelections>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedVariants = useMemo<SelectedVariant[]>(() => (product.variants ?? []).flatMap((variant) => {
    const optionId = selections[variant.id];
    const option = variant.options.find((item) => item.id === optionId);
    return option
      ? [{
          variantId: variant.id,
          variantName: variant.name,
          optionId: option.id,
          optionLabel: option.label,
        }]
      : [];
  }), [product.variants, selections]);
  const selectedStock = product.variantInventory?.length
    ? (selectedVariants.length ? getAvailableStock(product, selectedVariants) : undefined)
    : product.stock;

  const handleAdd = async () => {
    const selectionError = (product.variants ?? []).find((variant) => variant.required && !selections[variant.id]);
    if (selectionError) {
      setFeedback({ type: "error", message: `Selecciona ${selectionError.name.toLocaleLowerCase("es")}.` });
      return;
    }
    try {
      const validation = await validateInventoryLines([
        productInventoryLine(product, quantity, selectedVariants),
      ]);
      if (!validation.valid) {
        setFeedback({ type: "error", message: validation.issues[0]?.message ?? "El producto ya no está disponible." });
        return;
      }
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible confirmar las existencias." });
      return;
    }
    const result = addProduct(product, { quantity, selectedVariants });
    setFeedback(result.ok
      ? { type: "success", message: `${product.name} se agregó al carrito.` }
      : { type: "error", message: result.message });
  };

  if (!isProductPurchasable(product)) {
    return <span className="button button-disabled">Producto no disponible</span>;
  }

  return (
    <div className="purchase-panel">
      {(product.variants ?? []).map((variant) => (
        <label className="variant-field" key={variant.id}>
          <span>{variant.name}{variant.required ? " *" : ""}</span>
          <select
            value={selections[variant.id] ?? ""}
            required={variant.required}
            onChange={(event) => {
              setSelections((current) => ({ ...current, [variant.id]: event.target.value }));
              setFeedback(null);
            }}
          >
            <option value="">{variant.required ? "Selecciona una opción" : "Sin preferencia"}</option>
            {variant.options.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      ))}
      <div className="purchase-quantity-row">
        <span>Cantidad</span>
        <QuantitySelector quantity={quantity} onChange={setQuantity} label={`Cantidad de ${product.name}`} max={selectedStock ?? undefined} />
      </div>
      <div className="purchase-actions">
        <button className="button button-primary purchase-add-button" type="button" onClick={() => void handleAdd()}>
          <ShoppingBag size={17} aria-hidden="true" /> Agregar al carrito
        </button>
        <BuyNowButton
          product={product}
          quantity={quantity}
          selectedVariants={selectedVariants}
          placement="detail"
          onStatus={setFeedback}
        />
      </div>
      <WhatsappPrivacyNotice />
      {feedback ? (
        <div className={`purchase-feedback ${feedback.type}`} role="status">
          {feedback.type === "success" ? <Check size={16} aria-hidden="true" /> : null}
          <span>{feedback.message}</span>
          {feedback.type === "success" ? (
            <button type="button" onClick={openCart}>Ver carrito</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
