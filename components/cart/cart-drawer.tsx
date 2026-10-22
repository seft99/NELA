"use client";

import Link from "next/link";
import { MessageCircle, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CartItem } from "@/components/cart/cart-item";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCOP } from "@/config/site";
import { useCart } from "@/hooks/use-cart";
import { createOrderCheckout } from "@/lib/cart/whatsapp-checkout";
import { cartInventoryLines, validateInventoryLines } from "@/lib/cart/inventory-client";

export function CartDrawer() {
  const {
    items,
    notices,
    hydrated,
    isOpen,
    subtotal,
    totalUnits,
    whatsappNumber,
    siteUrl,
    closeCart,
    setCartOpen,
    updateQuantity,
    removeItem,
    dismissNotices,
  } = useCart();
  const [checkoutStatus, setCheckoutStatus] = useState<{ type: "checking" | "error"; message: string } | null>(null);
  const checkout = useMemo(
    () => createOrderCheckout(whatsappNumber, items, siteUrl),
    [items, siteUrl, whatsappNumber],
  );
  const hasIssues = items.some((item) => Boolean(item.issue));
  const canCheckout = hydrated && items.length > 0 && !hasIssues && checkout.isNumberValid && checkout.inventoryValid;

  const sendOrder = async () => {
    if (!canCheckout) return;
    setCheckoutStatus({ type: "checking", message: "Confirmando existencias…" });
    try {
      const validation = await validateInventoryLines(cartInventoryLines(items));
      if (!validation.valid) {
        setCheckoutStatus({ type: "error", message: validation.issues[0]?.message ?? "Revisa el inventario antes de continuar." });
        return;
      }
      window.open(checkout.url ?? undefined, "_blank", "noopener,noreferrer");
      setCheckoutStatus(null);
    } catch (error) {
      setCheckoutStatus({ type: "error", message: error instanceof Error ? error.message : "No fue posible confirmar las existencias." });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent className="cart-drawer" side="right" showCloseButton={false}>
        <SheetHeader className="cart-drawer-header">
          <div>
            <SheetTitle>Tu carrito</SheetTitle>
            <SheetDescription>Revisa los productos que has seleccionado.</SheetDescription>
          </div>
          <SheetClose className="cart-close" aria-label="Cerrar carrito">
            <X size={20} aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        {!hydrated ? (
          <div className="cart-loading" role="status">Preparando tu carrito…</div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <span><ShoppingBag size={30} strokeWidth={1.3} aria-hidden="true" /></span>
            <h2>Tu carrito está vacío.</h2>
            <p>Descubre nuestro catálogo de plata ley 925 y encuentra tus próximos favoritos.</p>
            <Link href="/accesorios-plata#catalogo" className="button button-outline" onClick={closeCart}>Explorar productos</Link>
          </div>
        ) : (
          <>
            <div className="cart-scroll-area">
              {notices.length ? (
                <div className="cart-notices" role="status">
                  <div>
                    {notices.map((notice) => <p key={notice.id}>{notice.message}</p>)}
                  </div>
                  <button type="button" onClick={dismissNotices}>Entendido</button>
                </div>
              ) : null}
              <div className="cart-items">
                {items.map((item) => (
                  <CartItem
                    key={item.lineId}
                    item={item}
                    onNavigate={closeCart}
                    onQuantityChange={(quantity) => updateQuantity(item.lineId, quantity)}
                    onRemove={() => removeItem(item.lineId)}
                  />
                ))}
              </div>
            </div>
            <footer className="cart-summary">
              <div className="cart-summary-row"><span>Subtotal de productos</span><strong>{formatCOP(subtotal)}</strong></div>
              <div className="cart-summary-row"><span>Envío</span><strong>Por confirmar</strong></div>
              <div className="cart-summary-row cart-total"><span>Total estimado de productos</span><strong>{formatCOP(subtotal)}</strong></div>
              <p>El valor del envío y la disponibilidad final se confirmarán por WhatsApp.</p>
              {hasIssues ? (
                <p className="cart-checkout-warning" role="alert">Retira o corrige los productos señalados antes de enviar el pedido.</p>
              ) : null}
              {checkoutStatus ? (
                <p className={`cart-checkout-warning${checkoutStatus.type === "checking" ? " checking" : ""}`} role={checkoutStatus.type === "error" ? "alert" : "status"}>
                  {checkoutStatus.message}
                </p>
              ) : null}
              {!checkout.isNumberValid ? (
                <p className="cart-checkout-warning" role="alert">El número oficial de WhatsApp aún no está configurado.</p>
              ) : null}
              <WhatsappPrivacyNotice />
              <button
                className={`button button-primary cart-checkout${!canCheckout ? " button-disabled" : ""}`}
                type="button"
                aria-disabled={!canCheckout}
                disabled={!canCheckout || checkoutStatus?.type === "checking"}
                onClick={() => void sendOrder()}
              >
                <MessageCircle size={18} aria-hidden="true" /> Enviar pedido por WhatsApp
              </button>
              <span className="cart-unit-note">{totalUnits} {totalUnits === 1 ? "producto seleccionado" : "productos seleccionados"}</span>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
