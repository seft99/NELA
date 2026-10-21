import { formatCOP } from "@/config/site";
import {
  getCartSubtotal,
  getCartUnitCount,
  getCategoryName,
  normalizeQuantity,
  validatePurchaseInventory,
} from "@/lib/cart/cart-utils";
import { getAbsoluteProductUrl } from "@/lib/products/product-url";
import { getPublicProductDetails, pickCustomerDetails } from "@/lib/products/public-details";
import { isValidWhatsappNumber, normalizeWhatsappNumber } from "@/lib/whatsapp";
import type { CartItem, SelectedVariant } from "@/types/cart";
import type { Product, ProductCustomerDetails } from "@/types/product";

function createWhatsappCheckout(number: string, message: string, inventoryValid = true) {
  const normalizedNumber = normalizeWhatsappNumber(number);
  const isNumberValid = isValidWhatsappNumber(normalizedNumber);
  const encodedMessage = encodeURIComponent(message);

  return {
    number: normalizedNumber,
    message,
    isNumberValid,
    inventoryValid,
    url: isNumberValid && inventoryValid
      ? `https://wa.me/${normalizedNumber}?text=${encodedMessage}`
      : null,
  };
}

function formatVariants(selectedVariants: SelectedVariant[]) {
  return selectedVariants
    .map((variant) => `${variant.variantName}: ${variant.optionLabel}`)
    .join(", ");
}

type WhatsappProductDetails = ProductCustomerDetails & {
  name: string;
  reference?: string;
  category: Product["category"];
  slug: string;
  quantity: number;
  unitPrice: number;
  selectedVariants: SelectedVariant[];
};

export function formatProductForWhatsapp(
  product: WhatsappProductDetails,
  siteUrl: string,
  options: { boldLinkLabel?: boolean } = {},
) {
  const quantity = normalizeQuantity(product.quantity);
  const variants = formatVariants(product.selectedVariants);
  const characteristics = [
    ...getPublicProductDetails(product).map((detail) => `${detail.label}: ${detail.value}`),
    variants,
  ].filter(Boolean).join(", ");
  const productUrl = getAbsoluteProductUrl(siteUrl, product.slug);
  return [
    `Nombre: ${product.name}`,
    product.reference ? `Referencia: ${product.reference}` : null,
    `Categoría: ${getCategoryName(product.category)}`,
    characteristics ? `Características: ${characteristics}` : null,
    `Cantidad: ${quantity}`,
    `Precio unitario: ${formatCOP(product.unitPrice)} COP`,
    `Subtotal: ${formatCOP(product.unitPrice * quantity)} COP`,
    productUrl ? "" : null,
    productUrl ? (options.boldLinkLabel ? "*Ver producto:*" : "Ver producto:") : null,
    productUrl,
  ].filter((line): line is string => line !== null).join("\n");
}

export function createDirectPurchaseMessage(
  product: Product,
  quantity: number,
  selectedVariants: SelectedVariant[] = [],
  siteUrl = "",
) {
  const safeQuantity = normalizeQuantity(quantity);
  return [
    "Hola, NELA Joyería ♡",
    "",
    "Estoy interesada en comprar este producto:",
    "",
    "*PRODUCTO SELECCIONADO*",
    "",
    formatProductForWhatsapp({
      name: product.name,
      reference: product.reference,
      category: product.category,
      slug: product.slug,
      quantity: safeQuantity,
      unitPrice: product.price,
      selectedVariants,
      ...pickCustomerDetails(product),
    }, siteUrl, { boldLinkLabel: true }),
    "",
    "¿Podrían confirmarme su disponibilidad, el valor del envío y los medios de pago?",
    "",
    "¡Muchas gracias!",
  ].join("\n");
}

export function createDirectPurchaseCheckout(
  number: string,
  product: Product,
  quantity: number,
  selectedVariants: SelectedVariant[] = [],
  siteUrl = "",
) {
  const inventoryValid = validatePurchaseInventory(product, quantity, selectedVariants) === null;
  return createWhatsappCheckout(
    number,
    createDirectPurchaseMessage(product, quantity, selectedVariants, siteUrl),
    inventoryValid,
  );
}

export function createOrderMessage(items: CartItem[], siteUrl = "") {
  const validItems = items.filter((item) => !item.issue);
  const productBlocks = validItems.map((item, index) => {
    return [
      `*${index + 1}. ${item.name}*`,
      formatProductForWhatsapp(item, siteUrl),
    ].join("\n");
  });

  return [
    "Hola, NELA Joyería ♡",
    "",
    "Quisiera realizar un pedido con los siguientes productos:",
    "",
    "*MI PEDIDO*",
    "",
    productBlocks.join("\n\n"),
    "",
    "---------------------",
    "",
    "*RESUMEN DEL PEDIDO*",
    "",
    `Productos diferentes: ${validItems.length}`,
    `Total de unidades: ${getCartUnitCount(validItems)}`,
    `Subtotal estimado: ${formatCOP(getCartSubtotal(validItems))} COP`,
    "Envío: Por confirmar",
    "",
    "¿Podrían confirmarme la disponibilidad de los productos, el valor del envío y los medios de pago?",
    "",
    "¡Muchas gracias!",
  ].join("\n");
}

export function createOrderCheckout(number: string, items: CartItem[], siteUrl = "") {
  const inventoryValid = items.length > 0 && items.every(
    (item) => !item.issue && (item.availableStock === null || normalizeQuantity(item.quantity) <= item.availableStock),
  );
  return createWhatsappCheckout(number, createOrderMessage(items, siteUrl), inventoryValid);
}
