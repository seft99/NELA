import { getProductAvailability } from "@/lib/products/inventory";
import type { JewelryType, Product, ProductImage } from "@/types/product";

export type SearchCatalogProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: ProductImage;
  reference?: string;
  categoryLabel: string;
  availabilityLabel: string;
  available: boolean;
  searchText: string;
  displayOrder: number;
};

const searchCategoryLabels: Partial<Record<JewelryType, string>> = {
  anillo: "Anillos",
  argolla: "Aretes y topos",
  arete: "Aretes y topos",
  topo: "Aretes y topos",
  "ear-cuff": "Aretes y topos",
  cadena: "Cadenas",
  collar: "Cadenas",
  dije: "Dijes",
  pulso: "Pulseras",
  pulsera: "Pulseras",
  tobillera: "Pulseras",
};

export function normalizeProductSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

export function getProductSearchCategoryLabel(product: Product) {
  const jewelryType = product.catalogAttributes?.jewelryType;
  return (jewelryType ? searchCategoryLabels[jewelryType] : undefined)
    ?? "Joyas de plata ley 925";
}

function getProductSearchParts(product: Product) {
  const attributes = product.catalogAttributes;
  return [
    product.name,
    product.reference,
    getProductSearchCategoryLabel(product),
    attributes?.jewelryType,
    product.shortDescription,
    product.description,
    product.material,
    product.finish,
    product.measurements,
    product.presentation,
    product.quantityOrVolume,
    attributes?.stone,
    attributes?.motif,
    attributes?.weaveType,
    ...(attributes?.ringSizes ?? []),
    ...(attributes?.lengths ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));
}

export function getNormalizedProductSearchText(product: Product) {
  return normalizeProductSearch(getProductSearchParts(product).join(" "));
}

export function matchesProductSearch(product: Product, query: string) {
  const normalizedQuery = normalizeProductSearch(query);
  if (!normalizedQuery) return true;
  const searchable = getNormalizedProductSearchText(product);
  return normalizedQuery.split(" ").every((term) => searchable.includes(term));
}

export function createSearchCatalogProduct(product: Product): SearchCatalogProduct {
  const availability = getProductAvailability(product);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.images[0],
    reference: product.reference,
    categoryLabel: getProductSearchCategoryLabel(product),
    availabilityLabel: availability.label,
    available: availability.available,
    searchText: getNormalizedProductSearchText(product),
    displayOrder: product.displayOrder,
  };
}

function getSearchScore(product: SearchCatalogProduct, query: string) {
  const normalizedQuery = normalizeProductSearch(query);
  if (!normalizedQuery) return -1;
  const terms = normalizedQuery.split(" ");
  if (!terms.every((term) => product.searchText.includes(term))) return -1;

  const name = normalizeProductSearch(product.name);
  const reference = normalizeProductSearch(product.reference ?? "");
  const category = normalizeProductSearch(product.categoryLabel);
  let score = 300;
  if (name === normalizedQuery) score += 900;
  else if (name.startsWith(normalizedQuery)) score += 700;
  else if (name.includes(normalizedQuery)) score += 540;
  else if (name.split(" ").some((word) => word.startsWith(normalizedQuery))) score += 480;
  if (reference === normalizedQuery) score += 850;
  else if (reference.startsWith(normalizedQuery)) score += 620;
  if (category === normalizedQuery) score += 420;
  else if (category.startsWith(normalizedQuery)) score += 320;
  score += terms.filter((term) => name.split(" ").some((word) => word.startsWith(term))).length * 45;
  return score;
}

export function rankSearchCatalogProducts(products: SearchCatalogProduct[], query: string) {
  return products
    .map((product) => ({ product, score: getSearchScore(product, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score
      || Number(b.product.available) - Number(a.product.available)
      || a.product.displayOrder - b.product.displayOrder
      || a.product.name.localeCompare(b.product.name, "es", { sensitivity: "base" }))
    .map((entry) => entry.product);
}
