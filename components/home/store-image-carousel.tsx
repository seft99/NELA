"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const AUTOPLAY_INTERVAL = 5_200;

const slides = [
  {
    src: "/images/store/anillo-floral.png",
    alt: "Anillo floral plateado sobre una composición en tonos marfil",
    position: "50% 58%",
  },
  {
    src: "/images/store/argollas-entrelazadas.png",
    alt: "Argollas plateadas entrelazadas sobre fondo neutro",
    position: "50% 50%",
  },
  {
    src: "/images/store/dije-floral.png",
    alt: "Dije floral plateado con piedras blancas sobre fondo neutro",
    position: "50% 52%",
  },
  {
    src: "/images/store/pulsera-floral-verde.png",
    alt: "Pulsera plateada con detalles florales y piedras verdes",
    position: "50% 50%",
  },
] as const;

export function StoreImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
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
    if (paused || hovered) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [hovered, paused]);

  const showPrevious = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % slides.length);

  return (
    <div
      className="silver-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Selección de accesorios de plata NELA"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="silver-carousel-slides" aria-live="off">
        {slides.map((slide, index) => (
          <div
            className={`silver-carousel-slide${index === activeIndex ? " is-active" : ""}`}
            aria-hidden={index !== activeIndex}
            key={slide.src}
          >
            <Image
              src={slide.src}
              alt={index === activeIndex ? slide.alt : ""}
              fill
              sizes="(max-width: 820px) 100vw, 52vw"
              style={{ objectPosition: slide.position }}
            />
          </div>
        ))}
      </div>

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
        {slides.map((slide, index) => (
          <button
            type="button"
            className={index === activeIndex ? "is-active" : undefined}
            aria-label={`Ver imagen ${index + 1} de ${slides.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
            key={slide.src}
          />
        ))}
      </div>
    </div>
  );
}
