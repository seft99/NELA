"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCOP } from "@/config/site";
import { TopNavigationLink } from "@/components/navigation/top-navigation-link";
import type { Product } from "@/types/product";

export function ProductRecommendations({
  products,
  categoryLabel,
  categoryHref,
}: {
  products: Product[];
  categoryLabel: string;
  categoryHref: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".product-recommendation-card"));
    if (!cards.length) return;

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

  if (!products.length) return null;

  const goTo = (index: number) => {
    const track = trackRef.current;
    const cards = track
      ? Array.from(track.querySelectorAll<HTMLElement>(".product-recommendation-card"))
      : [];
    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    const card = cards[nextIndex];
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  return (
    <section className="product-recommendations" aria-labelledby="product-recommendations-title">
      <div className="product-recommendations-heading">
        <div>
          <p className="eyebrow">Continúa explorando</p>
          <h2 id="product-recommendations-title">También te pueden gustar</h2>
        </div>
        <Link className="product-recommendations-more" href={categoryHref}>
          Ver más {categoryLabel} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <div
        ref={trackRef}
        className="product-recommendations-grid"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Recomendaciones de productos"
        tabIndex={0}
        onScroll={() => {
          if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
          frameRef.current = window.requestAnimationFrame(() => {
            updateActiveIndex();
            frameRef.current = null;
          });
        }}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(activeIndex - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(activeIndex + 1);
          }
        }}
      >
        {products.map((product) => {
          const image = product.images[0];
          return (
            <article className="product-recommendation-card" key={product.id}>
              <TopNavigationLink
                className="product-recommendation-card-link"
                href={`/productos/${product.slug}`}
                aria-label={`Ver ${product.name}`}
                mobileOnly
              >
                <span className="product-recommendation-image">
                  {image ? (
                    <Image src={image.src} alt={image.alt} fill sizes="(max-width: 560px) 76vw, 15vw" />
                  ) : (
                    <span>Fotografía no disponible</span>
                  )}
                </span>
                <h3>{product.name}</h3>
                <p>{formatCOP(product.price)}</p>
              </TopNavigationLink>
            </article>
          );
        })}
      </div>
      {products.length > 1 ? (
        <div className="product-recommendations-pagination" aria-label="Seleccionar recomendación">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={index === activeIndex ? "is-active" : undefined}
              aria-label={`Ver recomendación ${index + 1} de ${products.length}: ${product.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
