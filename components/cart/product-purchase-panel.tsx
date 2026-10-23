"use client";

import { AlertCircle, Check, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isValidatingQuantity, setIsValidatingQuantity] = useState(false);
  const lastConfirmedQuantity = useRef(1);
  const quantityValidationRun = useRef(0);

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

  useEffect(() => {
    if (quantity <= lastConfirmedQuantity.current) {
      setIsValidatingQuantity(false);
      return;
    }

    const runId = ++quantityValidationRun.current;
    setIsValidatingQuantity(true);
    const timer = window.setTimeout(async () => {
      const validateQuantity = async (candidate: number) => validateInventoryLines([
        productInventoryLine(product, candidate, selectedVariants),
      ]);

      try {
        const validation = await validateQuantity(quantity);
        if (runId !== quantityValidationRun.current) return;

        if (validation.valid) {
          lastConfirmedQuantity.current = quantity;
          return;
        }

        // If several fast clicks crossed the stock limit, keep the highest
        // quantity that the inventory service still confirms instead of
        // forcing the customer all the way back to one unit.
        let validQuantity = lastConfirmedQuantity.current;
        let lowerBound = validQuantity + 1;
        let upperBound = quantity - 1;
        while (lowerBound <= upperBound) {
          const candidate = Math.ceil((lowerBound + upperBound) / 2);
          const candidateValidation = await validateQuantity(candidate);
          if (runId !== quantityValidationRun.current) return;
          if (candidateValidation.valid) {
            validQuantity = candidate;
            lowerBound = candidate + 1;
          } else {
            upperBound = candidate - 1;
          }
        }

        lastConfirmedQuantity.current = validQuantity;
        setQuantity(validQuantity);
        setFeedback({
          type: "error",
          message: validation.issues[0]?.message ?? "No hay más unidades disponibles.",
        });
      } catch (error) {
        if (runId !== quantityValidationRun.current) return;
        setQuantity(lastConfirmedQuantity.current);
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "No fue posible confirmar las existencias.",
        });
      } finally {
        if (runId === quantityValidationRun.current) setIsValidatingQuantity(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      if (runId === quantityValidationRun.current) quantityValidationRun.current += 1;
    };
  }, [product, quantity, selectedVariants]);

  const handleQuantityChange = (nextQuantity: number) => {
    const safeQuantity = Math.max(1, nextQuantity);
    const selectionError = (product.variants ?? []).find((variant) => variant.required && !selections[variant.id]);
    if (safeQuantity > quantity && selectionError) {
      setFeedback({ type: "error", message: `Selecciona ${selectionError.name.toLocaleLowerCase("es")} antes de aumentar la cantidad.` });
      return;
    }
    setQuantity(safeQuantity);
    if (safeQuantity <= lastConfirmedQuantity.current) {
      setFeedback(null);
    }
  };

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
              quantityValidationRun.current += 1;
              lastConfirmedQuantity.current = 1;
              setQuantity(1);
              setIsValidatingQuantity(false);
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
        <QuantitySelector
          quantity={quantity}
          onChange={handleQuantityChange}
          label={`Cantidad de ${product.name}`}
          max={selectedStock ?? undefined}
          disabled={selectedStock === 0}
          busy={isValidatingQuantity}
        />
      </div>
      <div className="purchase-actions">
        <button className="button button-outline purchase-add-button" type="button" onClick={() => void handleAdd()}>
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
      <p className="purchase-process-note">Compra coordinada por WhatsApp. Te confirmaremos disponibilidad y detalles de tu pedido.</p>
      <WhatsappPrivacyNotice className="purchase-privacy-note" legalOnly />
      <div className="purchase-feedback-region">
        {feedback ? (
          <div
            className={`purchase-feedback ${feedback.type}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.type === "success"
              ? <Check size={16} aria-hidden="true" />
              : <AlertCircle size={16} aria-hidden="true" />}
            <span>{feedback.message}</span>
            {feedback.type === "success" ? (
              <button type="button" onClick={openCart}>Ver carrito</button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
