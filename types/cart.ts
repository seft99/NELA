import type { CategorySlug, ProductCustomerDetails, ProductVariant } from "@/types/product";

export type SelectedVariant = {
  variantId: string;
  variantName: string;
  optionId: string;
  optionLabel: string;
};

export type CartItemIssue = "product-removed" | "product-unavailable" | "variant-invalid" | "stock-exceeded";

export type CartItem = ProductCustomerDetails & {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  category: CategorySlug;
  image: { src: string; alt: string };
  reference?: string;
  /** Se omite en el catálogo público; la API del servidor valida el límite real. */
  availableStock: number | null;
  unitPrice: number;
  quantity: number;
  selectedVariants: SelectedVariant[];
  issue?: CartItemIssue;
};

export type AddToCartInput = {
  quantity: number;
  selectedVariants?: SelectedVariant[];
};

export type CartNotice = {
  id: string;
  message: string;
};

export type PersistedCart = {
  version: 1;
  items: CartItem[];
};

export type VariantSelections = Record<ProductVariant["id"], string>;
