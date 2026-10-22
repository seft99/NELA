export type CategorySlug = "skincare" | "accesorios-plata" | "manillas-oro";

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductVariantOption = {
  id: string;
  label: string;
};

export type ProductVariantInventory = {
  id: string;
  label: string;
  optionIds: string[];
  stock: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  required?: boolean;
  options: ProductVariantOption[];
};

export type ProductCustomerDetails = {
  presentation?: string;
  quantityOrVolume?: string;
  material?: string;
  finish?: string;
  measurements?: string;
};

export type JewelryAudience = "mujer" | "hombre" | "unisex";

export type JewelryType =
  | "anillo"
  | "dije"
  | "argolla"
  | "pulso"
  | "topo"
  | "cadena"
  | "arete"
  | "collar"
  | "pulsera"
  | "tobillera"
  | "ear-cuff";

export type JewelryCatalogAttributes = {
  audience?: JewelryAudience;
  jewelryType?: JewelryType;
  ringSizes?: string[];
  lengths?: string[];
  weaveType?: string;
  motif?: string;
  stone?: string;
  hasStone?: boolean;
};

export type Product = ProductCustomerDetails & {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  price: number;
  currency?: "COP";
  images: ProductImage[];
  reference?: string;
  variants?: ProductVariant[];
  /** Clasificación comercial verificada para filtros; nunca se deriva de imágenes o nombres. */
  catalogAttributes?: JewelryCatalogAttributes;
  variantInventory?: ProductVariantInventory[];
  featured: boolean;
  /** Solo está presente en procesos internos del servidor y en el panel administrativo. */
  stock?: number;
  purchaseEnabled: boolean;
  /** Estado público derivado de stock, purchaseEnabled y visible. */
  available: boolean;
  visible: boolean;
  displayOrder: number;
  isDemo?: boolean;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  tone: "skincare" | "silver" | "gold";
};
