import type { SilverCollectionSlug } from "@/config/silver-collections";
import type { CatalogSort } from "@/lib/products/catalog-filters";

export type CatalogExplorerContext = "all" | SilverCollectionSlug;

type CatalogExplorerConfig = {
  search: boolean;
  category: boolean;
  price: boolean;
  ringSize: boolean;
  length: boolean;
  earringType: boolean;
  sortOptions: readonly CatalogSort[];
};

const completeSortOptions = ["default", "price-asc", "price-desc", "name-asc", "name-desc"] as const;

export const catalogExplorerConfigs: Record<CatalogExplorerContext, CatalogExplorerConfig> = {
  all: {
    search: true,
    category: true,
    price: true,
    ringSize: false,
    length: false,
    earringType: false,
    sortOptions: completeSortOptions,
  },
  anillos: {
    search: true,
    category: false,
    price: false,
    ringSize: true,
    length: false,
    earringType: false,
    sortOptions: completeSortOptions,
  },
  "aretes-y-topos": {
    search: false,
    category: false,
    price: false,
    ringSize: false,
    length: false,
    earringType: true,
    sortOptions: ["default"],
  },
  cadenas: {
    search: true,
    category: false,
    price: false,
    ringSize: false,
    length: true,
    earringType: false,
    sortOptions: ["default", "price-asc", "price-desc"],
  },
  dijes: {
    search: true,
    category: false,
    price: false,
    ringSize: false,
    length: false,
    earringType: false,
    sortOptions: completeSortOptions,
  },
  pulseras: {
    search: false,
    category: false,
    price: false,
    ringSize: false,
    length: false,
    earringType: false,
    sortOptions: ["default"],
  },
};
