import type { Product } from "@/types/product";
import type { CatalogExplorerContext } from "@/config/catalog-explorer";
import { ProductGrid } from "./product-grid";

export function CatalogProductGrid({
  products,
  context,
}: {
  products: Product[];
  context: CatalogExplorerContext;
}) {
  return (
    <ProductGrid
      products={products}
      className={`catalog-product-grid catalog-product-grid--${context}`}
      compactMobileActions
    />
  );
}
