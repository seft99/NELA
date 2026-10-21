import type { CartItem, SelectedVariant } from "@/types/cart";
import type { Product } from "@/types/product";

type InventoryLine = {
  lineId: string;
  productId: string;
  quantity: number;
  selectedVariants: SelectedVariant[];
};

export async function validateInventoryLines(lines: InventoryLine[]) {
  const response = await fetch("/api/catalog/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  const payload = await response.json() as {
    valid?: boolean;
    issues?: Array<{ lineId: string; message: string }>;
    error?: string;
  };
  if (!response.ok || payload.valid === undefined) {
    throw new Error(payload.error || "No fue posible confirmar las existencias.");
  }
  return { valid: payload.valid, issues: payload.issues ?? [] };
}

export function productInventoryLine(
  product: Product,
  quantity: number,
  selectedVariants: SelectedVariant[],
): InventoryLine {
  return { lineId: product.id, productId: product.id, quantity, selectedVariants };
}

export function cartInventoryLines(items: CartItem[]): InventoryLine[] {
  return items.map((item) => ({
    lineId: item.lineId,
    productId: item.productId,
    quantity: item.quantity,
    selectedVariants: item.selectedVariants,
  }));
}
