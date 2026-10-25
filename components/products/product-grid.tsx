import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  className = "",
  compactMobileActions = false,
  compactDesktopBuy = false,
}: {
  products: Product[];
  className?: string;
  compactMobileActions?: boolean;
  compactDesktopBuy?: boolean;
}) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <p className="eyebrow">Colección en preparación</p>
        <h2>Muy pronto encontrarás nuevos detalles aquí.</h2>
        <p>El catálogo se actualizará cuando se publiquen productos visibles desde Sanity.</p>
      </div>
    );
  }
  return (
    <div className={`product-grid${className ? ` ${className}` : ""}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          compactMobileActions={compactMobileActions}
          compactDesktopBuy={compactDesktopBuy}
        />
      ))}
    </div>
  );
}
