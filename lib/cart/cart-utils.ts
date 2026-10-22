import type { CartItem, CartNotice, SelectedVariant } from "@/types/cart";
import type { CategorySlug, Product } from "@/types/product";
import { pickCustomerDetails } from "@/lib/products/public-details";
import { getAvailableStock, isProductPurchasable } from "@/lib/products/inventory";

const CATEGORY_NAMES: Record<CategorySlug, string> = {
  skincare: "Skincare",
  "accesorios-plata": "Accesorios de Plata Ley 925",
  "manillas-oro": "Manillas de Oro",
};

export function getCategoryName(category: CategorySlug) {
  return CATEGORY_NAMES[category];
}

export function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

export function createLineId(productId: string, selectedVariants: SelectedVariant[] = []) {
  const variantKey = [...selectedVariants]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((selection) => `${selection.variantId}:${selection.optionId}`)
    .join("|");
  return variantKey ? `${productId}::${variantKey}` : productId;
}

export function validateProductSelection(product: Product, selectedVariants: SelectedVariant[] = []) {
  const productVariants = product.variants ?? [];

  for (const variant of productVariants) {
    const selection = selectedVariants.find((item) => item.variantId === variant.id);
    if (variant.required && !selection) return `Selecciona ${variant.name.toLocaleLowerCase("es")}.`;
    if (selection && !variant.options.some((option) => option.id === selection.optionId)) {
      return `La opción de ${variant.name.toLocaleLowerCase("es")} ya no está disponible.`;
    }
  }

  const unknownSelection = selectedVariants.some(
    (selection) => !productVariants.some((variant) => variant.id === selection.variantId),
  );
  return unknownSelection ? "Una de las opciones seleccionadas ya no está disponible." : null;
}

export function validatePurchaseInventory(
  product: Product,
  quantity: number,
  selectedVariants: SelectedVariant[] = [],
) {
  if (!product.visible) return "Este producto ya no está visible en el catálogo.";
  if (!product.purchaseEnabled) return "Las compras de este producto están pausadas por ahora.";
  if (!isProductPurchasable(product)) return "Este producto está agotado.";
  const availableStock = getAvailableStock(product, selectedVariants);
  if (availableStock === 0) return "La variante seleccionada está agotada.";
  if (availableStock !== null && normalizeQuantity(quantity) > availableStock) return "La cantidad solicitada supera las existencias disponibles.";
  return null;
}

export function createCartItem(
  product: Product,
  quantity: number,
  selectedVariants: SelectedVariant[] = [],
): CartItem {
  const image = product.images[0] ?? {
    src: "/images/editorial/hero-nela-demo.png",
    alt: `Vista de ${product.name}`,
  };

  return {
    lineId: createLineId(product.id, selectedVariants),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    image,
    reference: product.reference,
    availableStock: getAvailableStock(product, selectedVariants),
    ...pickCustomerDetails(product),
    unitPrice: product.price,
    quantity: normalizeQuantity(quantity),
    selectedVariants,
  };
}

export function getCartUnitCount(items: CartItem[]) {
  return items.reduce((total, item) => total + normalizeQuantity(item.quantity), 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + (item.issue ? 0 : item.unitPrice * normalizeQuantity(item.quantity)),
    0,
  );
}

export function reconcileCartItems(items: CartItem[], catalog: Product[]) {
  const productsById = new Map(catalog.map((product) => [product.id, product]));
  const notices: CartNotice[] = [];

  const reconciled = items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      notices.push({
        id: `${item.lineId}:removed`,
        message: `${item.name} ya no aparece en el catálogo y no se incluirá en el pedido.`,
      });
      return { ...item, issue: "product-removed" as const };
    }

    const selectionError = validateProductSelection(product, item.selectedVariants);
    let issue: CartItem["issue"];
    const availableStock = getAvailableStock(product, item.selectedVariants);
    if (!isProductPurchasable(product) || availableStock === 0) issue = "product-unavailable";
    else if (selectionError) issue = "variant-invalid";
    else if (availableStock !== null && item.quantity > availableStock) issue = "stock-exceeded";

    if (item.unitPrice !== product.price) {
      notices.push({
        id: `${item.lineId}:price`,
        message: `Actualizamos el precio de ${product.name} según el catálogo vigente.`,
      });
    }
    if (issue === "product-unavailable") {
      notices.push({
        id: `${item.lineId}:unavailable`,
        message: `${product.name} no está disponible por ahora y no se incluirá en el pedido.`,
      });
    }
    if (issue === "variant-invalid") {
      notices.push({
        id: `${item.lineId}:variant`,
        message: `${product.name} necesita que revises sus opciones antes de enviar el pedido.`,
      });
    }
    if (issue === "stock-exceeded") {
      notices.push({
        id: `${item.lineId}:stock`,
        message: `${product.name} supera las existencias disponibles. Reduce la cantidad para continuar.`,
      });
    }

    return {
      ...item,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images[0] ?? item.image,
      reference: product.reference,
      availableStock,
      ...pickCustomerDetails(product),
      unitPrice: product.price,
      quantity: normalizeQuantity(item.quantity),
      issue,
    };
  });

  const mergedItems = [...reconciled.reduce((lines, item) => {
    const existing = lines.get(item.lineId);
    lines.set(item.lineId, existing
      ? { ...item, quantity: normalizeQuantity(existing.quantity + item.quantity) }
      : item);
    return lines;
  }, new Map<string, CartItem>()).values()];

  const uniqueNotices = [...new Map(notices.map((notice) => [notice.id, notice])).values()];
  return { items: mergedItems, notices: uniqueNotices };
}

export function getCartItemIssueMessage(issue: CartItem["issue"]) {
  if (issue === "product-removed") return "Este producto ya no está en el catálogo.";
  if (issue === "product-unavailable") return "No disponible por ahora.";
  if (issue === "variant-invalid") return "Revisa las opciones de este producto.";
  if (issue === "stock-exceeded") return "Reduce la cantidad para continuar.";
  return null;
}
