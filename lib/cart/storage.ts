import { createLineId, normalizeQuantity } from "@/lib/cart/cart-utils";
import { pickCustomerDetails } from "@/lib/products/public-details";
import type { CartItem, PersistedCart, SelectedVariant } from "@/types/cart";
import type { CategorySlug } from "@/types/product";

export const CART_STORAGE_KEY = "nela-cart";
export const CART_STORAGE_VERSION = 1 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCategory(value: unknown): value is CategorySlug {
  return value === "skincare" || value === "accesorios-plata" || value === "manillas-oro";
}

function parseSelectedVariants(value: unknown): SelectedVariant[] | null {
  if (!Array.isArray(value)) return null;
  const variants = value.filter(
    (item): item is SelectedVariant =>
      isRecord(item) &&
      typeof item.variantId === "string" &&
      typeof item.variantName === "string" &&
      typeof item.optionId === "string" &&
      typeof item.optionLabel === "string",
  );
  return variants.length === value.length ? variants : null;
}

function parseCartItem(value: unknown): CartItem | null {
  if (!isRecord(value) || !isRecord(value.image)) return null;
  const selectedVariants = parseSelectedVariants(value.selectedVariants);
  if (
    !selectedVariants ||
    typeof value.productId !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string" ||
    !isCategory(value.category) ||
    typeof value.image.src !== "string" ||
    typeof value.image.alt !== "string" ||
    typeof value.unitPrice !== "number" ||
    !Number.isFinite(value.unitPrice) ||
    value.unitPrice < 0 ||
    typeof value.quantity !== "number" ||
    !Number.isFinite(value.quantity)
  ) return null;

  return {
    lineId: createLineId(value.productId, selectedVariants),
    productId: value.productId,
    slug: value.slug,
    name: value.name,
    category: value.category,
    image: { src: value.image.src, alt: value.image.alt },
    reference: typeof value.reference === "string" ? value.reference : undefined,
    availableStock: value.availableStock === null
      ? null
      : typeof value.availableStock === "number" && Number.isFinite(value.availableStock)
        ? Math.max(0, Math.floor(value.availableStock))
        : null,
    ...pickCustomerDetails({
      category: value.category,
      presentation: typeof value.presentation === "string" ? value.presentation : undefined,
      quantityOrVolume: typeof value.quantityOrVolume === "string" ? value.quantityOrVolume : undefined,
      material: typeof value.material === "string" ? value.material : undefined,
      finish: typeof value.finish === "string" ? value.finish : undefined,
      measurements: typeof value.measurements === "string" ? value.measurements : undefined,
    }),
    unitPrice: value.unitPrice,
    quantity: normalizeQuantity(value.quantity),
    selectedVariants,
  };
}

export function parsePersistedCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== CART_STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return parsed.items.map(parseCartItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]) {
  const payload: PersistedCart = { version: CART_STORAGE_VERSION, items };
  return JSON.stringify(payload);
}
