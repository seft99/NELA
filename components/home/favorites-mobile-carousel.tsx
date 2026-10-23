"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FavoriteProductCard } from "@/components/home/favorite-product-card";
import type { Product } from "@/types/product";

export function FavoritesMobileCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".favorite-product-card"));
    if (cards.length === 0) return;

    const closestIndex = cards.reduce((closest, card, index) => {
      const closestDistance = Math.abs(cards[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
      const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
      return distance < closestDistance ? index : closest;
    }, 0);
    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateActiveIndex);
    observer.observe(track);
    updateActiveIndex();
    return () => observer.disconnect();
  }, [updateActiveIndex]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const onScroll = () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      updateActiveIndex();
      frameRef.current = null;
    });
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    const cards = track
      ? Array.from(track.querySelectorAll<HTMLElement>(".favorite-product-card"))
      : [];
    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    const card = cards[nextIndex];
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  if (products.length === 0) return null;

  return (
    <section className="favorites-mobile-carousel" aria-labelledby="favorites-mobile-title">
      <div className="favorites-mobile-carousel-heading">
        <h3 id="favorites-mobile-title">Más favoritos de la boutique</h3>
        <div className="favorites-mobile-carousel-navigation">
          <span className="favorites-mobile-carousel-position" aria-live="polite" aria-atomic="true">
            <span className="sr-only">Producto </span>{activeIndex + 1} / {products.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Ver favorito anterior"
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === products.length - 1}
            aria-label="Ver siguiente favorito"
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="favorites-mobile-carousel-track"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Favoritos adicionales de la boutique"
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(activeIndex - 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(activeIndex + 1);
          }
        }}
      >
        {products.map((product) => (
          <FavoriteProductCard key={product.id} product={product} size="mobile" />
        ))}
      </div>

      <p className="favorites-mobile-carousel-hint">
        <span aria-hidden="true" />
        Desliza para descubrir más favoritos
        <ChevronRight size={17} aria-hidden="true" />
      </p>
    </section>
  );
}
