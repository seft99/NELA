"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createCartItem,
  getCartSubtotal,
  getCartUnitCount,
  normalizeQuantity,
  reconcileCartItems,
  validatePurchaseInventory,
  validateProductSelection,
} from "@/lib/cart/cart-utils";
import { CART_STORAGE_KEY, parsePersistedCart, serializeCart } from "@/lib/cart/storage";
import type { AddToCartInput, CartItem, CartNotice } from "@/types/cart";
import type { Product } from "@/types/product";

type CartState = {
  items: CartItem[];
  notices: CartNotice[];
  hydrated: boolean;
};

type CartAction =
  | { type: "hydrate"; items: CartItem[]; notices: CartNotice[] }
  | { type: "add"; item: CartItem }
  | { type: "quantity"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string }
  | { type: "dismiss-notices" };

function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "hydrate") {
    return { items: action.items, notices: action.notices, hydrated: true };
  }
  if (action.type === "add") {
    const existing = state.items.find((item) => item.lineId === action.item.lineId);
    const items = existing
      ? state.items.map((item) =>
          item.lineId === action.item.lineId
            ? { ...action.item, quantity: item.quantity + action.item.quantity }
            : item,
        )
      : [...state.items, action.item];
    return { ...state, items };
  }
  if (action.type === "quantity") {
    return {
      ...state,
      items: state.items.map((item) =>
        item.lineId === action.lineId ? { ...item, quantity: normalizeQuantity(action.quantity) } : item,
      ),
    };
  }
  if (action.type === "remove") {
    return {
      ...state,
      items: state.items.filter((item) => item.lineId !== action.lineId),
      notices: state.notices.filter((notice) => !notice.id.startsWith(`${action.lineId}:`)),
    };
  }
  if (action.type === "dismiss-notices") return { ...state, notices: [] };
  return state;
}

type AddResult = { ok: true } | { ok: false; message: string };

export type CartContextValue = {
  items: CartItem[];
  notices: CartNotice[];
  hydrated: boolean;
  isOpen: boolean;
  totalUnits: number;
  subtotal: number;
  whatsappNumber: string;
  siteUrl: string;
  announcement: string;
  addProduct: (product: Product, input?: Partial<AddToCartInput>) => AddResult;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
  dismissNotices: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  catalog,
  whatsappNumber,
  siteUrl,
}: {
  children: ReactNode;
  catalog: Product[];
  whatsappNumber: string;
  siteUrl: string;
}) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], notices: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const hydrateFromStorage = useCallback((raw: string | null) => {
    const reconciled = reconcileCartItems(parsePersistedCart(raw), catalog);
    dispatch({ type: "hydrate", ...reconciled });
  }, [catalog]);

  useEffect(() => {
    hydrateFromStorage(window.localStorage.getItem(CART_STORAGE_KEY));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) hydrateFromStorage(event.newValue);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(state.items));
    } catch (error) {
      console.warn("No fue posible guardar el carrito en este navegador.", error);
    }
  }, [state.hydrated, state.items]);

  const openCart = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    if (open) openCart();
    else closeCart();
  }, [closeCart, openCart]);

  const addProduct = useCallback((product: Product, input: Partial<AddToCartInput> = {}): AddResult => {
    const quantity = input.quantity ?? 1;
    const selectedVariants = input.selectedVariants ?? [];
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { ok: false, message: "La cantidad debe ser al menos 1." };
    }
    const selectionError = validateProductSelection(product, selectedVariants);
    if (selectionError) return { ok: false, message: selectionError };

    const candidate = createCartItem(product, quantity, selectedVariants);
    const existingQuantity = state.items.find((item) => item.lineId === candidate.lineId)?.quantity ?? 0;
    const inventoryError = validatePurchaseInventory(product, existingQuantity + quantity, selectedVariants);
    if (inventoryError) return { ok: false, message: inventoryError };

    dispatch({ type: "add", item: candidate });
    setAnnouncement(`${product.name} se agregó al carrito.`);
    return { ok: true };
  }, [state.items]);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return;
    const item = state.items.find((candidate) => candidate.lineId === lineId);
    if (!item || (item.availableStock !== null && quantity > item.availableStock)) {
      setAnnouncement("La cantidad solicitada supera las existencias disponibles.");
      return;
    }
    dispatch({ type: "quantity", lineId, quantity });
    setAnnouncement("Cantidad actualizada.");
  }, [state.items]);

  const removeItem = useCallback((lineId: string) => {
    dispatch({ type: "remove", lineId });
    setAnnouncement("Producto eliminado del carrito.");
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items: state.items,
    notices: state.notices,
    hydrated: state.hydrated,
    isOpen,
    totalUnits: getCartUnitCount(state.items),
    subtotal: getCartSubtotal(state.items),
    whatsappNumber,
    siteUrl,
    announcement,
    addProduct,
    updateQuantity,
    removeItem,
    openCart,
    closeCart,
    setCartOpen,
    dismissNotices: () => dispatch({ type: "dismiss-notices" }),
  }), [
    addProduct,
    announcement,
    closeCart,
    isOpen,
    openCart,
    removeItem,
    setCartOpen,
    state.hydrated,
    state.items,
    state.notices,
    siteUrl,
    updateQuantity,
    whatsappNumber,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </CartContext.Provider>
  );
}
