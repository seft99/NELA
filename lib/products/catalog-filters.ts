import { isProductPurchasable } from "@/lib/products/inventory";
import type { JewelryAudience, JewelryType, Product } from "@/types/product";

export type CatalogSort = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export type CatalogFilterState = {
  query: string;
  availableOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  jewelryTypes: JewelryType[];
  productTypes: JewelryType[];
  ringSizes: string[];
  lengths: string[];
};

export const jewelryTypeLabels: Record<JewelryType, string> = {
  anillo: "Anillos",
  dije: "Dijes",
  argolla: "Argollas",
  pulso: "Pulsos",
  topo: "Topos",
  cadena: "Cadenas",
  arete: "Aretes",
  collar: "Collares",
  pulsera: "Pulseras",
  tobillera: "Tobilleras",
  "ear-cuff": "Ear cuffs",
};

export const jewelryAudienceLabels: Record<JewelryAudience, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  unisex: "Unisex",
};

export const jewelryFilterLabels: Partial<Record<JewelryType, string>> = {
  anillo: "Anillos",
  arete: "Aretes y topos",
  cadena: "Cadenas",
  dije: "Dijes",
  pulsera: "Pulseras",
};

const publicJewelryFilterOrder: JewelryType[] = ["anillo", "arete", "cadena", "dije", "pulsera"];

export function toPublicJewelryFilterType(type?: JewelryType): JewelryType | undefined {
  if (type === "topo" || type === "argolla" || type === "arete") return "arete";
  if (type === "pulso" || type === "pulsera") return "pulsera";
  return type && publicJewelryFilterOrder.includes(type) ? type : undefined;
}

export const emptyCatalogFilters: CatalogFilterState = {
  query: "",
  availableOnly: false,
  minPrice: null,
  maxPrice: null,
  jewelryTypes: [],
  productTypes: [],
  ringSizes: [],
  lengths: [],
};

export function normalizeCatalogSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.flatMap((value) => value?.trim() ? [value.trim()] : []))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

function matchesAny(selected: string[], values: Array<string | undefined>) {
  if (!selected.length) return true;
  const normalizedValues = new Set(values.flatMap((value) => value?.trim() ? [normalizeCatalogSearch(value)] : []));
  return selected.some((value) => normalizedValues.has(normalizeCatalogSearch(value)));
}

export function getCatalogFilterOptions(products: Product[]) {
  const prices = products.map((product) => product.price).filter(Number.isFinite);
  const availableJewelryTypes = new Set<JewelryType>(
    products
      .map((product) => toPublicJewelryFilterType(product.catalogAttributes?.jewelryType))
      .filter((type): type is JewelryType => Boolean(type)),
  );
  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    jewelryTypes: publicJewelryFilterOrder.filter((type) => availableJewelryTypes.has(type)),
    productTypes: unique(products.map((product) => product.catalogAttributes?.jewelryType)) as JewelryType[],
    ringSizes: unique(products.flatMap((product) => product.catalogAttributes?.ringSizes ?? [])),
    lengths: unique(products.flatMap((product) => product.catalogAttributes?.lengths ?? [])),
    hasAvailabilityDifference: products.some(isProductPurchasable)
      && products.some((product) => !isProductPurchasable(product)),
  };
}

function matchesJewelryType(selected: JewelryType[], productType?: JewelryType) {
  if (!selected.length) return true;
  const publicProductType = toPublicJewelryFilterType(productType);
  return Boolean(publicProductType && selected.includes(publicProductType));
}

export function filterCatalogProducts(products: Product[], filters: CatalogFilterState) {
  const query = normalizeCatalogSearch(filters.query);
  return products.filter((product) => {
    if (!product.visible) return false;
    const attributes = product.catalogAttributes;
    return (!query
        || normalizeCatalogSearch(product.name).includes(query)
        || normalizeCatalogSearch(product.reference ?? "").includes(query))
      && (!filters.availableOnly || isProductPurchasable(product))
      && (filters.minPrice === null || product.price >= filters.minPrice)
      && (filters.maxPrice === null || product.price <= filters.maxPrice)
      && matchesJewelryType(filters.jewelryTypes, attributes?.jewelryType)
      && matchesAny(filters.productTypes, [attributes?.jewelryType])
      && matchesAny(filters.ringSizes, attributes?.ringSizes ?? [])
      && matchesAny(filters.lengths, attributes?.lengths ?? []);
  });
}

export function sortCatalogProducts(products: Product[], sort: CatalogSort) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price || a.displayOrder - b.displayOrder;
    if (sort === "price-desc") return b.price - a.price || a.displayOrder - b.displayOrder;
    if (sort === "name-asc") return a.name.localeCompare(b.name, "es", { sensitivity: "base" }) || a.displayOrder - b.displayOrder;
    if (sort === "name-desc") return b.name.localeCompare(a.name, "es", { sensitivity: "base" }) || a.displayOrder - b.displayOrder;
    return Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder;
  });
}
