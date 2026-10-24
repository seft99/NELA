"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const AUTOPLAY_INTERVAL = 6_500;

export type StoreCarouselSlide = {
  src: string;
  alt: string;
  position?: string;
  captionTone?: "light" | "dark";
};

export const defaultStoreCarouselSlides = [
  {
    src: "/images/editorial/hero-nela-demo.png",
    alt: "Composición editorial de una joya NELA en plata ley 925",
    position: "54% center",
    captionTone: "light",
  },
  {
    src: "/images/store/anillo-floral.png",
    alt: "Anillo floral de plata ley 925 sobre una composición en tonos marfil",
    position: "50% 58%",
    captionTone: "dark",
  },
  {
    src: "/images/store/pulsera-floral-verde.png",
    alt: "Pulsera de plata ley 925 con detalles florales y circones verdes",
    position: "50% 50%",
    captionTone: "dark",
  },
  {
    src: "/images/store/argollas-entrelazadas.png",
    alt: "Argollas de plata ley 925 entrelazadas sobre fondo neutro",
    position: "50% 50%",
    captionTone: "dark",
  },
  {
    src: "/images/store/dije-floral.png",
    alt: "Dije floral de plata ley 925 con piedras blancas sobre fondo neutro",
    position: "50% 52%",
    captionTone: "dark",
  },
] as const satisfies readonly StoreCarouselSlide[];

export function StoreImageCarousel({
  slides = defaultStoreCarouselSlides,
  ariaLabel = "Selección de accesorios de plata ley 925 NELA",
  priority = false,
  signatureLines,
  variant = "default",
  autoplayInterval = AUTOPLAY_INTERVAL,
  autoplayOnSmallScreens = false,
}: {
  slides?: readonly StoreCarouselSlide[];
  ariaLabel?: string;
  priority?: boolean;
  signatureLines?: readonly string[];
  variant?: "default" | "editorial";
  autoplayInterval?: number;
  autoplayOnSmallScreens?: boolean;
}) {
  const activeSlides = slides.length > 0 ? slides : defaultStoreCarouselSlides;
  const hasMultipleSlides = activeSlides.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const displayedIndex = activeIndex % activeSlides.length;
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [motionBlocked, setMotionBlocked] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const [loadedIndexes, setLoadedIndexes] = useState<number[]>(() => (
    hasMultipleSlides ? [0, 1] : [0]
  ));
  const autoplayBlocked = motionBlocked || (smallScreen && !autoplayOnSmallScreens);
  const autoplayPaused = userPaused || hovered || focused || documentHidden || autoplayBlocked;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const screenQuery = window.matchMedia("(max-width: 820px)");
    const updatePreferences = () => {
      setMotionBlocked(motionQuery.matches);
      setSmallScreen(screenQuery.matches);
    };
    updatePreferences();
    motionQuery.addEventListener("change", updatePreferences);
    screenQuery.addEventListener("change", updatePreferences);
    return () => {
      motionQuery.removeEventListener("change", updatePreferences);
      screenQuery.removeEventListener("change", updatePreferences);
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => setDocumentHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides || autoplayPaused) return;
    const timer = window.setTimeout(() => {
      const nextIndex = (displayedIndex + 1) % activeSlides.length;
      const preloadIndex = (nextIndex + 1) % activeSlides.length;
      setLoadedIndexes((current) => (
        current.includes(preloadIndex) ? current : [...current, preloadIndex]
      ));
      setActiveIndex(nextIndex);
    }, autoplayInterval);
    return () => window.clearTimeout(timer);
  }, [activeSlides.length, autoplayInterval, autoplayPaused, displayedIndex, hasMultipleSlides]);

  const activateSlide = (index: number) => {
    const nextIndex = (index + activeSlides.length) % activeSlides.length;
    const preloadIndex = (nextIndex + 1) % activeSlides.length;
    setLoadedIndexes((current) => (
      [...new Set([...current, nextIndex, preloadIndex])]
    ));
    setActiveIndex(nextIndex);
  };

  const showPrevious = () => {
    setUserPaused(true);
    activateSlide(displayedIndex - 1);
  };
  const showNext = () => {
    setUserPaused(true);
    activateSlide(displayedIndex + 1);
  };

  return (
    <div
      className={`silver-carousel${variant === "editorial" ? " silver-carousel--editorial" : ""}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      }}
    >
      <div className="silver-carousel-slides" aria-live="off">
        {activeSlides.map((slide, index) => (
          <div
            className={`silver-carousel-slide${index === displayedIndex ? " is-active" : ""}`}
            aria-hidden={index !== displayedIndex}
            key={slide.src}
          >
            {loadedIndexes.includes(index) ? (
              <Image
                src={slide.src}
                alt={index === displayedIndex ? slide.alt : ""}
                fill
                priority={priority && index === 0}
                loading={priority && index === 0 ? undefined : "lazy"}
                sizes="(max-width: 820px) 100vw, (max-width: 1520px) 60vw, 900px"
                style={{ objectPosition: slide.position }}
              />
            ) : null}
          </div>
        ))}
      </div>

      {signatureLines?.length ? (
        <div
          className={`silver-carousel-signature is-${activeSlides[displayedIndex]?.captionTone ?? "light"}`}
          aria-hidden="true"
        >
          <span />
          <p>
            {signatureLines.map((line) => <span key={line}>{line}</span>)}
          </p>
        </div>
      ) : null}

      {hasMultipleSlides ? (
        <>
          <div className="silver-carousel-controls">
            <button type="button" onClick={showPrevious} aria-label="Ver imagen anterior">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setUserPaused((current) => !current)}
              aria-label={autoplayBlocked
                ? "Reproducción automática desactivada en este dispositivo"
                : userPaused
                  ? "Reanudar carrusel automático"
                  : "Pausar carrusel automático"}
              aria-pressed={userPaused || autoplayBlocked}
              disabled={autoplayBlocked}
            >
              {userPaused || autoplayBlocked
                ? <Play size={15} aria-hidden="true" />
                : <Pause size={15} aria-hidden="true" />}
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
                onClick={() => {
                  setUserPaused(true);
                  activateSlide(index);
                }}
                key={slide.src}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
