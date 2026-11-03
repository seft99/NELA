import type { CategorySlug, JewelryType } from "@/types/product";

export type InventoryVariantLine = {
  id: string;
  label: string;
  optionIds: string[];
  stock: number;
};

export type InventoryProduct = {
  id: string;
  revision: string;
  name: string;
  reference?: string;
  category: CategorySlug;
  jewelryType?: JewelryType;
  image?: {
    src: string;
    alt: string;
  };
  price: number;
  stock: number;
  purchaseEnabled: boolean;
  visible: boolean;
  variantInventory: InventoryVariantLine[];
};
