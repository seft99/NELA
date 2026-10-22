"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const AUTOPLAY_INTERVAL = 5_200;

export type StoreCarouselSlide = {
  src: string;
  alt: string;
  position?: string;
};

export const defaultStoreCarouselSlides = [
  {
    src: "/images/store/anillo-floral.png",
    alt: "Anillo floral de plata ley 925 sobre una composición en tonos marfil",
    position: "50% 58%",
  },
  {
    src: "/images/store/argollas-entrelazadas.png",
    alt: "Argollas de plata ley 925 entrelazadas sobre fondo neutro",
    position: "50% 50%",
  },
  {
    src: "/images/store/dije-floral.png",
    alt: "Dije floral de plata ley 925 con piedras blancas sobre fondo neutro",
    position: "50% 52%",
  },
  {
    src: "/images/store/pulsera-floral-verde.png",
    alt: "Pulsera de plata ley 925 con detalles florales y piedras verdes",
    position: "50% 50%",
  },
] as const satisfies readonly StoreCarouselSlide[];

export function StoreImageCarousel({
  slides = defaultStoreCarouselSlides,
  ariaLabel = "Selección de accesorios de plata ley 925 NELA",
  priority = false,
}: {
  slides?: readonly StoreCarouselSlide[];
  ariaLabel?: string;
  priority?: boolean;
}) {
  const activeSlides = slides.length > 0 ? slides : defaultStoreCarouselSlides;
  const hasMultipleSlides = activeSlides.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const displayedIndex = activeIndex % activeSlides.length;
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      if (mediaQuery.matches) setPaused(true);
    };
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides || paused || hovered) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % activeSlides.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [activeSlides.length, hasMultipleSlides, hovered, paused]);

  const showPrevious = () => setActiveIndex((current) => (current - 1 + activeSlides.length) % activeSlides.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % activeSlides.length);

  return (
    <div
      className="silver-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="silver-carousel-slides" aria-live="off">
        {activeSlides.map((slide, index) => (
          <div
            className={`silver-carousel-slide${index === displayedIndex ? " is-active" : ""}`}
            aria-hidden={index !== displayedIndex}
            key={slide.src}
          >
            <Image
              src={slide.src}
              alt={index === displayedIndex ? slide.alt : ""}
              fill
              priority={priority && index === 0}
              loading={priority && index === 0 ? undefined : "eager"}
              sizes="(max-width: 820px) 100vw, 52vw"
              style={{ objectPosition: slide.position }}
            />
          </div>
        ))}
      </div>

      {hasMultipleSlides ? (
        <>
          <div className="silver-carousel-controls">
            <button type="button" onClick={showPrevious} aria-label="Ver imagen anterior">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-label={paused ? "Reanudar carrusel automático" : "Pausar carrusel automático"}
              aria-pressed={paused}
            >
              {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
            <button type="button" onClick={showNext} aria-label="Ver imagen siguiente">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="silver-carousel-dots" aria-label="Seleccionar imagen">
            {activeSlides.map((slide, index) => (
              <button
                type="button"
                className={index === displayedIndex ? "is-active" : undefined}
                aria-label={`Ver imagen ${index + 1} de ${activeSlides.length}`}
                aria-current={index === displayedIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                key={slide.src}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
