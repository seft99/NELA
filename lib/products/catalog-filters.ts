import { isProductPurchasable } from "@/lib/products/inventory";
import type { JewelryAudience, JewelryType, Product } from "@/types/product";

export type CatalogSort = "featured" | "price-asc" | "price-desc" | "name";

export type CatalogFilterState = {
  query: string;
  availableOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  priceRanges: string[];
  audiences: JewelryAudience[];
  jewelryTypes: JewelryType[];
  ringSizes: string[];
  lengths: string[];
  weaveTypes: string[];
  motifs: string[];
  stones: string[];
  finishes: string[];
};

export const jewelryAudienceLabels: Record<JewelryAudience, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  unisex: "Unisex",
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

export const jewelryFilterLabels: Partial<Record<JewelryType, string>> = {
  anillo: "Anillos",
  arete: "Aretes y topos",
  cadena: "Cadenas",
  dije: "Dijes",
  pulsera: "Pulseras",
};

const publicJewelryFilterOrder: JewelryType[] = ["anillo", "arete", "cadena", "dije", "pulsera"];

function toPublicJewelryFilterType(type?: JewelryType): JewelryType | undefined {
  if (type === "topo") return "arete" satisfies JewelryType;
  return type && publicJewelryFilterOrder.includes(type) ? type : undefined;
}

export const emptyCatalogFilters: CatalogFilterState = {
  query: "",
  availableOnly: false,
  minPrice: null,
  maxPrice: null,
  priceRanges: [],
  audiences: [],
  jewelryTypes: [],
  ringSizes: [],
  lengths: [],
  weaveTypes: [],
  motifs: [],
  stones: [],
  finishes: [],
};

export type CatalogPriceRange = {
  id: string;
  minExclusive: number;
  maxInclusive: number;
};

const catalogPriceBands: CatalogPriceRange[] = [
  { id: "hasta-80000", minExclusive: -1, maxInclusive: 80000 },
  { id: "80000-100000", minExclusive: 80000, maxInclusive: 100000 },
  { id: "100000-120000", minExclusive: 100000, maxInclusive: 120000 },
  { id: "120000-150000", minExclusive: 120000, maxInclusive: 150000 },
  { id: "150000-200000", minExclusive: 150000, maxInclusive: 200000 },
  { id: "200000-300000", minExclusive: 200000, maxInclusive: 300000 },
  { id: "300000-500000", minExclusive: 300000, maxInclusive: 500000 },
  { id: "500000-1000000", minExclusive: 500000, maxInclusive: 1000000 },
  { id: "1000000-2000000", minExclusive: 1000000, maxInclusive: 2000000 },
  { id: "mas-2000000", minExclusive: 2000000, maxInclusive: Number.POSITIVE_INFINITY },
];

function clean(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.flatMap((value) => value?.trim() ? [value.trim()] : []))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

function matchesAny(selected: string[], values: Array<string | undefined>) {
  if (!selected.length) return true;
  const normalizedValues = new Set(values.flatMap((value) => value?.trim() ? [clean(value)] : []));
  return selected.some((value) => normalizedValues.has(clean(value)));
}

export function getCatalogPriceRanges(products: Product[]) {
  return catalogPriceBands.filter((range) => products.some(
    (product) => product.price > range.minExclusive && product.price <= range.maxInclusive,
  ));
}

function matchesPriceRanges(price: number, selected: string[]) {
  if (!selected.length) return true;
  return catalogPriceBands.some((range) => selected.includes(range.id)
    && price > range.minExclusive
    && price <= range.maxInclusive);
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
    audiences: unique(products.map((product) => product.catalogAttributes?.audience)) as JewelryAudience[],
    jewelryTypes: publicJewelryFilterOrder.filter((type) => availableJewelryTypes.has(type)),
    ringSizes: unique(products.flatMap((product) => product.catalogAttributes?.ringSizes ?? [])),
    lengths: unique(products.flatMap((product) => product.catalogAttributes?.lengths ?? [])),
    weaveTypes: unique(products.map((product) => product.catalogAttributes?.weaveType)),
    motifs: unique(products.map((product) => product.catalogAttributes?.motif)),
    stones: unique(products.map((product) => product.catalogAttributes?.stone)),
    finishes: unique(products.map((product) => product.finish)),
  };
}

function matchesJewelryType(selected: JewelryType[], productType?: JewelryType) {
  if (!selected.length) return true;
  const publicProductType = toPublicJewelryFilterType(productType);
  if (!publicProductType) return false;
  return selected.some((type) => toPublicJewelryFilterType(type) === publicProductType);
}

export function filterCatalogProducts(products: Product[], filters: CatalogFilterState) {
  const query = clean(filters.query);
  return products.filter((product) => {
    const attributes = product.catalogAttributes;
    return (!query || clean(product.name).includes(query) || clean(product.reference ?? "").includes(query))
      && (!filters.availableOnly || isProductPurchasable(product))
      && (filters.minPrice === null || product.price >= filters.minPrice)
      && (filters.maxPrice === null || product.price <= filters.maxPrice)
      && matchesPriceRanges(product.price, filters.priceRanges)
      && matchesAny(filters.audiences, [attributes?.audience])
      && matchesJewelryType(filters.jewelryTypes, attributes?.jewelryType)
      && matchesAny(filters.ringSizes, attributes?.ringSizes ?? [])
      && matchesAny(filters.lengths, attributes?.lengths ?? [])
      && matchesAny(filters.weaveTypes, [attributes?.weaveType])
      && matchesAny(filters.motifs, [attributes?.motif])
      && matchesAny(filters.stones, [attributes?.stone])
      && matchesAny(filters.finishes, [product.finish]);
  });
}

export function sortCatalogProducts(products: Product[], sort: CatalogSort) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "name") return a.name.localeCompare(b.name, "es");
    return Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder;
  });
}
