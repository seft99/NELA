import type { Product } from "@/types/product";
import { ProductGrid } from "./product-grid";

export function CatalogProductGrid({ products }: { products: Product[] }) {
  return <ProductGrid products={products} className="catalog-product-grid" />;
}
