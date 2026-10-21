"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { formatCOP } from "@/config/site";
import { getCartItemIssueMessage, getCategoryName } from "@/lib/cart/cart-utils";
import type { CartItem as CartItemType } from "@/types/cart";

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  onNavigate,
}: {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  const issueMessage = getCartItemIssueMessage(item.issue);

  return (
    <article className={`cart-item${item.issue ? " has-issue" : ""}`}>
      <Link className="cart-item-image" href={`/productos/${item.slug}`} onClick={onNavigate} tabIndex={item.issue === "product-removed" ? -1 : undefined}>
        <Image src={item.image.src} alt={item.image.alt} fill sizes="96px" />
      </Link>
      <div className="cart-item-copy">
        <div className="cart-item-heading">
          <div>
            <p>{getCategoryName(item.category)}</p>
            <h3>{item.name}</h3>
          </div>
          <button type="button" className="cart-remove" onClick={onRemove} aria-label={`Eliminar ${item.name} del carrito`}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
        {item.reference ? <p className="cart-reference">Ref. {item.reference}</p> : null}
        {item.selectedVariants.length ? (
          <dl className="cart-variants">
            {item.selectedVariants.map((variant) => (
              <div key={variant.variantId}>
                <dt>{variant.variantName}:</dt><dd>{variant.optionLabel}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {issueMessage ? <p className="cart-item-issue" role="alert">{issueMessage}</p> : null}
        <div className="cart-item-bottom">
          <QuantitySelector
            quantity={item.quantity}
            onChange={onQuantityChange}
            label={`Cantidad de ${item.name}`}
            disabled={Boolean(item.issue)}
            max={item.availableStock ?? undefined}
          />
          <div className="cart-item-price">
            <span>{formatCOP(item.unitPrice)} c/u</span>
            <strong>{item.issue ? "No incluido" : formatCOP(item.unitPrice * item.quantity)}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
