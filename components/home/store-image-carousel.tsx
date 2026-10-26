"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AUTOPLAY_INTERVAL = 6_500;
const MOBILE_CAROUSEL_QUERY = "(max-width: 820px)";
const SWIPE_THRESHOLD = 46;
const SWIPE_DIRECTION_RATIO = 1.15;

type SwipeGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
};

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
}: {
  slides?: readonly StoreCarouselSlide[];
  ariaLabel?: string;
  priority?: boolean;
  signatureLines?: readonly string[];
  variant?: "default" | "editorial";
  autoplayInterval?: number;
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
  const swipeGesture = useRef<SwipeGesture | null>(null);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef<number | null>(null);
  const autoplayBlocked = motionBlocked || smallScreen;
  const autoplayPaused = userPaused || hovered || focused || documentHidden || autoplayBlocked;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const screenQuery = window.matchMedia(MOBILE_CAROUSEL_QUERY);
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

  useEffect(() => () => {
    if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
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

  const startSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      !hasMultipleSlides
      || !event.isPrimary
      || event.pointerType !== "touch"
      || !window.matchMedia(MOBILE_CAROUSEL_QUERY).matches
    ) return;

    swipeGesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      latestX: event.clientX,
      latestY: event.clientY,
    };
  };

  const trackSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = swipeGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.latestX = event.clientX;
    gesture.latestY = event.clientY;
  };

  const cancelSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeGesture.current?.pointerId === event.pointerId) swipeGesture.current = null;
  };

  const finishSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = swipeGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.latestX = event.clientX;
    gesture.latestY = event.clientY;
    swipeGesture.current = null;

    const horizontalDistance = gesture.latestX - gesture.startX;
    const verticalDistance = gesture.latestY - gesture.startY;
    const horizontalIntent = Math.abs(horizontalDistance) >= SWIPE_THRESHOLD
      && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * SWIPE_DIRECTION_RATIO;
    if (!horizontalIntent) return;

    suppressClick.current = true;
    if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
    suppressClickTimer.current = window.setTimeout(() => {
      suppressClick.current = false;
      suppressClickTimer.current = null;
    }, 400);

    if (horizontalDistance < 0) activateSlide(displayedIndex + 1);
    else activateSlide(displayedIndex - 1);
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
      <div
        className="silver-carousel-slides"
        aria-live="off"
        onPointerDown={startSwipe}
        onPointerMove={trackSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={cancelSwipe}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
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
                  if (!window.matchMedia(MOBILE_CAROUSEL_QUERY).matches) setUserPaused(true);
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
