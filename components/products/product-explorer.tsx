"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { ProductGrid } from "./product-grid";

type SortOption = "featured" | "price-asc" | "price-desc" | "name";

export function ProductExplorer({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products
      .filter((product) => !normalizedQuery || product.name.toLocaleLowerCase("es").includes(normalizedQuery))
      .filter((product) => !availableOnly || product.available)
      .sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "name") return a.name.localeCompare(b.name, "es");
        return Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder;
      });
  }, [availableOnly, products, query, sort]);

  return (
    <div id="catalogo" className="catalog-section">
      <div className="catalog-controls">
        <label className="search-control">
          <span className="sr-only">Buscar productos</span>
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre" />
        </label>
        <label className="availability-control">
          <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />
          Solo disponibles
        </label>
        <label className="sort-control">
          <span>Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre</option>
          </select>
        </label>
      </div>
      {visibleProducts.length ? (
        <ProductGrid products={visibleProducts} />
      ) : (
        <div className="empty-state compact">
          <h2>No encontramos coincidencias.</h2>
          <p>Prueba otra búsqueda o cambia los filtros.</p>
        </div>
      )}
    </div>
  );
}
