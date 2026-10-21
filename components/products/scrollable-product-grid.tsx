"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { ProductGrid } from "./product-grid";

export function ScrollableProductGrid({ products, resetKey }: { products: Product[]; resetKey: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const grid = viewport.querySelector<HTMLElement>(".product-grid");
    if (!grid) return;

    const measure = () => {
      const cards = Array.from(grid.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && child.offsetParent !== null,
      );
      const firstTop = cards[0]?.offsetTop;
      if (firstTop === undefined) {
        viewport.style.removeProperty("--catalog-scroll-height");
        setIsScrollable(false);
        return;
      }

      const firstRowCount = cards.findIndex((card) => Math.abs(card.offsetTop - firstTop) > 1);
      const columns = firstRowCount === -1 ? cards.length : firstRowCount;
      const visibleCapacity = columns * 2;

      if (!columns || cards.length <= visibleCapacity) {
        viewport.style.removeProperty("--catalog-scroll-height");
        setIsScrollable(false);
        return;
      }

      const gridTop = grid.getBoundingClientRect().top;
      const secondRowBottom = Math.max(
        ...cards.slice(columns, visibleCapacity).map((card) => card.getBoundingClientRect().bottom - gridTop),
      );
      viewport.style.setProperty("--catalog-scroll-height", `${Math.ceil(secondRowBottom)}px`);
      setIsScrollable(true);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(grid);
    Array.from(grid.children).forEach((child) => resizeObserver.observe(child));
    measure();

    return () => resizeObserver.disconnect();
  }, [products]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = 0;
    const frame = requestAnimationFrame(() => {
      viewport.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [resetKey]);

  return (
    <>
      <div
        ref={viewportRef}
        className={`catalog-grid-viewport${isScrollable ? " is-scrollable" : ""}`}
        role={isScrollable ? "region" : undefined}
        aria-label={isScrollable ? "Productos del catálogo con desplazamiento vertical" : undefined}
        tabIndex={isScrollable ? 0 : undefined}
      >
        <ProductGrid products={products} className="catalog-product-grid" />
      </div>
      {isScrollable ? <p className="catalog-scroll-hint">Desplázate para ver más productos</p> : null}
    </>
  );
}
