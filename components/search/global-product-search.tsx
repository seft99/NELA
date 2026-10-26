"use client";

import Image from "next/image";
import { ArrowRight, ChevronRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCOP } from "@/config/site";
import {
  prepareTopNavigationScrollReset,
  TopNavigationLink,
} from "@/components/navigation/top-navigation-link";
import {
  normalizeProductSearch,
  rankSearchCatalogProducts,
  type SearchCatalogProduct,
} from "@/lib/products/search";

const mobileSearchMedia = "(max-width: 820px)";

export function GlobalProductSearch({ products }: { products: SearchCatalogProduct[] }) {
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [placement, setPlacement] = useState({ top: 84, left: 16, width: 480 });
  const deferredQuery = useDeferredValue(query);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);

  const normalizedQuery = normalizeProductSearch(deferredQuery);
  const rankedResults = useMemo(
    () => normalizedQuery ? rankSearchCatalogProducts(products, normalizedQuery) : [],
    [normalizedQuery, products],
  );
  const suggestions = rankedResults.slice(0, 5);
  const resolvedActiveIndex = suggestions.length
    ? Math.min(Math.max(activeIndex, 0), suggestions.length - 1)
    : -1;
  const allResultsHref = query.trim()
    ? `/accesorios-plata?${new URLSearchParams({ buscar: query.trim() }).toString()}#catalogo`
    : "/accesorios-plata#catalogo";

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const mobile = window.matchMedia(mobileSearchMedia).matches;
    const width = mobile ? Math.max(280, window.innerWidth - 24) : Math.min(480, window.innerWidth - 32);
    const left = mobile
      ? Math.max(12, (window.innerWidth - width) / 2)
      : Math.min(window.innerWidth - width - 16, Math.max(16, rect.right - width));
    setIsMobile(mobile);
    setPlacement({ top: Math.round(rect.bottom + 8), left: Math.round(left), width: Math.round(width) });
  }, []);

  const closeSearch = useCallback((restoreFocus = true) => {
    if (openFrameRef.current !== null) window.cancelAnimationFrame(openFrameRef.current);
    setOpen(false);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimerRef.current = window.setTimeout(() => {
      setRendered(false);
      if (restoreFocus && !navigatingRef.current) triggerRef.current?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 180);
  }, []);

  const openSearch = useCallback(() => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    navigatingRef.current = false;
    updatePlacement();
    setRendered(true);
    openFrameRef.current = window.requestAnimationFrame(() => {
      setOpen(true);
      openFrameRef.current = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    });
  }, [updatePlacement]);

  const navigateTo = useCallback((href: string) => {
    navigatingRef.current = true;
    prepareTopNavigationScrollReset("all");
    closeSearch(false);
    router.push(href, { scroll: true });
  }, [closeSearch, router]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    if (openFrameRef.current !== null) window.cancelAnimationFrame(openFrameRef.current);
  }, []);

  useEffect(() => {
    if (!rendered) return;
    const update = () => updatePlacement();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [rendered, updatePlacement]);

  useEffect(() => {
    if (!rendered || !isMobile) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      if (!navigatingRef.current) window.scrollTo(0, scrollY);
    };
  }, [isMobile, rendered]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch, open]);

  const activateSuggestion = (index: number) => {
    if (!suggestions.length) return;
    const next = (index + suggestions.length) % suggestions.length;
    setActiveIndex(next);
    document.getElementById(`global-search-option-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    const product = resolvedActiveIndex >= 0 ? suggestions[resolvedActiveIndex] : undefined;
    navigateTo(product ? `/productos/${product.slug}` : allResultsHref);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button header-search"
        aria-label="Buscar joyas de plata ley 925"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="global-product-search"
        onClick={() => open ? closeSearch() : openSearch()}
      >
        <Search size={19} aria-hidden="true" />
      </button>
      {rendered && typeof document !== "undefined" ? createPortal(
        <div className={`global-search-layer${open ? " is-open" : ""}`} style={{ "--global-search-top": `${placement.top}px` } as React.CSSProperties}>
          <button
            type="button"
            className="global-search-backdrop"
            tabIndex={-1}
            aria-label="Cerrar búsqueda"
            onClick={() => closeSearch()}
          />
          <div
            ref={panelRef}
            id="global-product-search"
            className="global-search-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            style={{ top: placement.top, left: placement.left, width: placement.width }}
          >
            <div className="global-search-panel-header">
              <p id="global-search-title">Buscar en NELA</p>
              <button type="button" aria-label="Cerrar búsqueda" onClick={() => closeSearch()}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <form
              className="global-search-form"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                autoFocus
                value={query}
                placeholder="Buscar por nombre o referencia"
                autoComplete="off"
                enterKeyHint="search"
                role="combobox"
                aria-label="Buscar productos"
                aria-autocomplete="list"
                aria-controls="global-search-results"
                aria-expanded={Boolean(normalizedQuery)}
                aria-activedescendant={resolvedActiveIndex >= 0 ? `global-search-option-${resolvedActiveIndex}` : undefined}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(event.target.value.trim() ? 0 : -1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    activateSuggestion(resolvedActiveIndex + 1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    activateSuggestion(resolvedActiveIndex - 1);
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
              />
              {query ? (
                <button
                  type="button"
                  className="global-search-clear"
                  aria-label="Limpiar búsqueda"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(-1);
                    inputRef.current?.focus();
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              ) : <span aria-hidden="true" />}
            </form>

            <div className="global-search-content">
              {normalizedQuery ? <p className="global-search-results-title">Productos encontrados</p> : null}
              <div id="global-search-results" className="global-search-results" role="listbox" aria-label="Productos encontrados">
                {!normalizedQuery ? (
                  <p className="global-search-message">Escribe el nombre, la referencia o el tipo de joya que buscas.</p>
                ) : suggestions.length ? suggestions.map((product, index) => (
                  <TopNavigationLink
                    key={product.id}
                    id={`global-search-option-${index}`}
                    className={`global-search-result${resolvedActiveIndex === index ? " is-active" : ""}`}
                    href={`/productos/${product.slug}`}
                    role="option"
                    aria-selected={resolvedActiveIndex === index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onNavigate={(event) => {
                      event.preventDefault();
                      navigateTo(`/productos/${product.slug}`);
                    }}
                  >
                    <span className="global-search-result-media">
                      {product.image ? (
                        <Image src={product.image.src} alt={product.image.alt} fill sizes="76px" />
                      ) : <span>Sin imagen</span>}
                    </span>
                    <span className="global-search-result-copy">
                      <strong>{product.name}</strong>
                      <span>{product.categoryLabel}</span>
                      <span className="global-search-result-meta">
                        <span>{formatCOP(product.price)}</span>
                        <span className={product.available ? "is-available" : "is-unavailable"}>{product.availabilityLabel}</span>
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </TopNavigationLink>
                )) : (
                  <p className="global-search-message">No encontramos productos para “{query.trim()}”. Puedes explorar el catálogo completo.</p>
                )}
              </div>
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {normalizedQuery ? `${rankedResults.length} productos coinciden con la búsqueda.` : "Búsqueda lista."}
              </p>
            </div>

            <TopNavigationLink
              className="global-search-view-all"
              href={allResultsHref}
              onNavigate={(event) => {
                event.preventDefault();
                navigateTo(allResultsHref);
              }}
            >
              <span>{query.trim() ? `Ver todos los resultados para “${query.trim()}”` : "Ver catálogo completo"}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </TopNavigationLink>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
