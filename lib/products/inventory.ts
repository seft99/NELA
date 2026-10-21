import type { SelectedVariant } from "@/types/cart";
import type { Product } from "@/types/product";

type InventoryProduct = Pick<Product, "stock" | "purchaseEnabled" | "visible" | "variantInventory" | "available">;

export function normalizeStock(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

export function isProductPurchasable(product: InventoryProduct) {
  if (!product.visible || !product.purchaseEnabled) return false;
  return product.stock === undefined ? product.available : normalizeStock(product.stock) > 0;
}

export function getProductAvailability(product: InventoryProduct) {
  if (product.stock !== undefined && normalizeStock(product.stock) === 0) return { available: false, label: "Agotado" };
  if (product.stock === undefined && !product.available) return { available: false, label: "Agotado" };
  if (!product.purchaseEnabled || !product.visible) return { available: false, label: "No disponible" };
  return { available: true, label: "Disponible" };
}

export function getAvailableStock(
  product: InventoryProduct,
  selectedVariants: SelectedVariant[] = [],
) {
  const variantInventory = product.variantInventory ?? [];
  if (!variantInventory.length) return product.stock === undefined ? null : normalizeStock(product.stock);

  const selectedOptionIds = selectedVariants.map((selection) => selection.optionId).sort();
  const inventoryLine = variantInventory.find((line) => {
    const optionIds = [...line.optionIds].sort();
    return optionIds.length === selectedOptionIds.length &&
      optionIds.every((optionId, index) => optionId === selectedOptionIds[index]);
  });

  return inventoryLine ? normalizeStock(inventoryLine.stock) : 0;
}

export function derivePublicAvailability<T extends InventoryProduct>(product: T) {
  return { ...product, available: isProductPurchasable(product) };
}
