"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";
import { formatCOP } from "@/config/site";
import {
  emptyCatalogFilters,
  filterCatalogProducts,
  getCatalogFilterOptions,
  getCatalogPriceRanges,
  jewelryAudienceLabels,
  jewelryFilterLabels,
  sortCatalogProducts,
  type CatalogFilterState,
  type CatalogPriceRange,
  type CatalogSort,
} from "@/lib/products/catalog-filters";
import type { JewelryAudience, JewelryType, Product } from "@/types/product";
import { ScrollableProductGrid } from "./scrollable-product-grid";

type ArrayFilterKey = "priceRanges" | "audiences" | "jewelryTypes" | "ringSizes" | "lengths" | "weaveTypes" | "motifs" | "stones" | "finishes";

const catalogSortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "featured", label: "Destacados" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre" },
];

const urlParamByFilter: Record<ArrayFilterKey, string> = {
  priceRanges: "precio",
  audiences: "publico",
  jewelryTypes: "tipo",
  ringSizes: "talla",
  lengths: "largo",
  weaveTypes: "tejido",
  motifs: "motivo",
  stones: "piedra",
  finishes: "acabado",
};

function readList(params: URLSearchParams, name: string, allowed: string[]) {
  const allowedValues = new Set(allowed);
  return (params.get(name) ?? "").split(",").filter((value) => allowedValues.has(value));
}

function readPrice(params: URLSearchParams, name: string, lower: number, upper: number) {
  const raw = params.get(name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(upper, Math.max(lower, Math.round(value))) : null;
}

function priceRangeLabel(range: CatalogPriceRange) {
  if (range.minExclusive < 0) return `Hasta ${formatCOP(range.maxInclusive)}`;
  if (!Number.isFinite(range.maxInclusive)) return `Más de ${formatCOP(range.minExclusive)}`;
  return `${formatCOP(range.minExclusive)} – ${formatCOP(range.maxInclusive)}`;
}

export function ProductExplorer({
  products,
  enableJewelryFilters = false,
}: {
  products: Product[];
  enableJewelryFilters?: boolean;
}) {
  const options = useMemo(() => getCatalogFilterOptions(products), [products]);
  const priceRangeOptions = useMemo(() => getCatalogPriceRanges(products), [products]);
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  const [sort, setSort] = useState<CatalogSort>("featured");
  const [urlReady, setUrlReady] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [priceDraftError, setPriceDraftError] = useState("");
  const sortMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (sortMenuRef.current?.open && !sortMenuRef.current.contains(event.target as Node)) {
        sortMenuRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const minPrice = readPrice(params, "precioMin", options.minPrice, options.maxPrice);
      const maxPrice = readPrice(params, "precioMax", options.minPrice, options.maxPrice);
      setFilters({
        query: params.get("buscar") ?? "",
        availableOnly: params.get("disponibles") === "1",
        minPrice: minPrice !== null && maxPrice !== null && minPrice > maxPrice ? null : minPrice,
        maxPrice: minPrice !== null && maxPrice !== null && minPrice > maxPrice ? null : maxPrice,
        priceRanges: readList(params, "precio", priceRangeOptions.map((range) => range.id)),
        audiences: readList(params, "publico", options.audiences) as JewelryAudience[],
        jewelryTypes: readList(params, "tipo", options.jewelryTypes) as JewelryType[],
        ringSizes: readList(params, "talla", options.ringSizes),
        lengths: readList(params, "largo", options.lengths),
        weaveTypes: readList(params, "tejido", options.weaveTypes),
        motifs: readList(params, "motivo", options.motifs),
        stones: readList(params, "piedra", options.stones),
        finishes: readList(params, "acabado", options.finishes),
      });
      setPriceDraft({ min: minPrice === null ? "" : String(minPrice), max: maxPrice === null ? "" : String(maxPrice) });
      setPriceDraftError("");
      const nextSort = params.get("orden");
      setSort(nextSort === "price-asc" || nextSort === "price-desc" || nextSort === "name" ? nextSort : "featured");
      setUrlReady(true);
    };
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [options, priceRangeOptions]);

  const invalidPriceRange = filters.minPrice !== null && filters.maxPrice !== null && filters.minPrice > filters.maxPrice;

  useEffect(() => {
    if (!urlReady || invalidPriceRange) return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const setOrDelete = (name: string, value: string) => value ? params.set(name, value) : params.delete(name);
    setOrDelete("buscar", filters.query.trim());
    setOrDelete("disponibles", filters.availableOnly ? "1" : "");
    setOrDelete("precioMin", filters.minPrice === null ? "" : String(filters.minPrice));
    setOrDelete("precioMax", filters.maxPrice === null ? "" : String(filters.maxPrice));
    setOrDelete("orden", sort === "featured" ? "" : sort);
    (Object.keys(urlParamByFilter) as ArrayFilterKey[]).forEach((key) => {
      setOrDelete(urlParamByFilter[key], filters[key].join(","));
    });
    window.history.replaceState(null, "", `${url.pathname}${params.size ? `?${params.toString()}` : ""}${url.hash}`);
  }, [filters, invalidPriceRange, sort, urlReady]);

  const visibleProducts = useMemo(() => {
    if (invalidPriceRange) return [];
    return sortCatalogProducts(filterCatalogProducts(products, filters), sort);
  }, [filters, invalidPriceRange, products, sort]);

  const setArrayFilter = (key: ArrayFilterKey, value: string, checked: boolean) => {
    setFilters((current) => ({
      ...current,
      [key]: checked ? [...current[key], value] : current[key].filter((item) => item !== value),
    }));
  };

  const applyPriceDraft = () => {
    const minPrice = priceDraft.min === "" ? null : Number(priceDraft.min);
    const maxPrice = priceDraft.max === "" ? null : Number(priceDraft.max);
    if ((minPrice !== null && !Number.isFinite(minPrice)) || (maxPrice !== null && !Number.isFinite(maxPrice))) {
      setPriceDraftError("Ingresa valores numéricos válidos.");
      return;
    }
    if ((minPrice !== null && (minPrice < options.minPrice || minPrice > options.maxPrice))
      || (maxPrice !== null && (maxPrice < options.minPrice || maxPrice > options.maxPrice))) {
      setPriceDraftError(`Usa valores entre ${formatCOP(options.minPrice)} y ${formatCOP(options.maxPrice)}.`);
      return;
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setPriceDraftError("El precio mínimo no puede superar el máximo.");
      return;
    }
    setPriceDraftError("");
    setFilters((current) => ({ ...current, minPrice, maxPrice, priceRanges: [] }));
  };

  const togglePriceRange = (value: string, checked: boolean) => {
    setPriceDraft({ min: "", max: "" });
    setPriceDraftError("");
    setFilters((current) => ({
      ...current,
      minPrice: null,
      maxPrice: null,
      priceRanges: checked
        ? [...current.priceRanges, value]
        : current.priceRanges.filter((item) => item !== value),
    }));
  };

  const clearFilters = () => {
    setFilters(emptyCatalogFilters);
    setPriceDraft({ min: "", max: "" });
    setPriceDraftError("");
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; remove: () => void }> = [];
    if (filters.query.trim()) chips.push({ id: "query", label: `Búsqueda: ${filters.query.trim()}`, remove: () => setFilters((current) => ({ ...current, query: "" })) });
    if (filters.availableOnly) chips.push({ id: "available", label: "Solo disponibles", remove: () => setFilters((current) => ({ ...current, availableOnly: false })) });
    if (filters.minPrice !== null) chips.push({ id: "min", label: `Desde ${formatCOP(filters.minPrice)}`, remove: () => { setFilters((current) => ({ ...current, minPrice: null })); setPriceDraft((current) => ({ ...current, min: "" })); } });
    if (filters.maxPrice !== null) chips.push({ id: "max", label: `Hasta ${formatCOP(filters.maxPrice)}`, remove: () => { setFilters((current) => ({ ...current, maxPrice: null })); setPriceDraft((current) => ({ ...current, max: "" })); } });
    const priceLabels = Object.fromEntries(priceRangeOptions.map((range) => [range.id, priceRangeLabel(range)]));
    const labelsByKey: Record<ArrayFilterKey, Record<string, string>> = {
      priceRanges: priceLabels,
      audiences: jewelryAudienceLabels,
      jewelryTypes: jewelryFilterLabels as Record<string, string>,
      ringSizes: {}, lengths: {}, weaveTypes: {}, motifs: {}, stones: {}, finishes: {},
    };
    (Object.keys(urlParamByFilter) as ArrayFilterKey[]).forEach((key) => {
      filters[key].forEach((value) => chips.push({
        id: `${key}-${value}`,
        label: labelsByKey[key][value] ?? value,
        remove: () => setArrayFilter(key, value, false),
      }));
    });
    return chips;
  }, [filters, priceRangeOptions]);

  const filterGroups = ([
    { key: "audiences", label: "Público", values: options.audiences, labels: jewelryAudienceLabels as Record<string, string> },
    { key: "ringSizes", label: "Talla de anillo", values: options.ringSizes },
    { key: "lengths", label: "Largo", values: options.lengths },
    { key: "weaveTypes", label: "Tipo de tejido", values: options.weaveTypes },
    { key: "motifs", label: "Motivo o diseño", values: options.motifs },
    { key: "stones", label: "Piedra", values: options.stones },
    { key: "finishes", label: "Acabado", values: options.finishes },
  ] as Array<{ key: ArrayFilterKey; label: string; values: string[]; labels?: Record<string, string> }>).filter((group) => group.values.length > 0);

  const resetKey = JSON.stringify({ filters, sort });
  const activeSortLabel = catalogSortOptions.find((option) => option.value === sort)?.label ?? "Destacados";

  const selectSort = (value: CatalogSort) => {
    setSort(value);
    sortMenuRef.current?.removeAttribute("open");
  };

  return (
    <div id="catalogo" className="catalog-section">
      <div className="catalog-controls">
        <label className="search-control">
          <span className="sr-only">Buscar productos</span>
          <Search size={18} aria-hidden="true" />
          <input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Buscar por nombre o referencia" />
        </label>
        <label className="availability-control">
          <input type="checkbox" checked={filters.availableOnly} onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))} />
          Solo disponibles
        </label>
        <div className="sort-control">
          <span>Ordenar</span>
          <details
            ref={sortMenuRef}
            className="sort-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape" && sortMenuRef.current?.open) {
                sortMenuRef.current.removeAttribute("open");
                sortMenuRef.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary aria-label={`Orden actual: ${activeSortLabel}`}>
              <span>{activeSortLabel}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="sort-options" aria-label="Opciones de orden">
              {catalogSortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={sort === option.value ? "is-selected" : undefined}
                  aria-pressed={sort === option.value}
                  onClick={() => selectSort(option.value)}
                >
                  <span>{option.label}</span>
                  <Check size={15} aria-hidden="true" />
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      {enableJewelryFilters && products.length ? (
        <details className="catalog-filter-panel" open>
          <summary>
            <span>Filtros de la colección {activeChips.length ? `(${activeChips.length})` : ""}</span>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className="catalog-filter-body">
            <details className="filter-accordion price-filter" open>
              <summary><span>Precio</span><ChevronDown size={17} aria-hidden="true" /></summary>
              <div className="filter-accordion-content">
                <p id="price-limits">Límites: {formatCOP(options.minPrice)} a {formatCOP(options.maxPrice)} COP</p>
                <div className="price-custom-row">
                  <label htmlFor="catalog-price-min">
                    <span className="sr-only">Precio mínimo</span>
                    <span className="price-money-input"><span aria-hidden="true">$</span><input id="catalog-price-min" type="number" inputMode="numeric" min={options.minPrice} max={options.maxPrice} step="1000" value={priceDraft.min} placeholder={String(options.minPrice)} aria-describedby={`price-limits${priceDraftError ? " price-error" : ""}`} onChange={(event) => setPriceDraft((current) => ({ ...current, min: event.target.value }))} /></span>
                  </label>
                  <label htmlFor="catalog-price-max">
                    <span className="sr-only">Precio máximo</span>
                    <span className="price-money-input"><span aria-hidden="true">$</span><input id="catalog-price-max" type="number" inputMode="numeric" min={options.minPrice} max={options.maxPrice} step="1000" value={priceDraft.max} placeholder={String(options.maxPrice)} aria-describedby={`price-limits${priceDraftError ? " price-error" : ""}`} onChange={(event) => setPriceDraft((current) => ({ ...current, max: event.target.value }))} /></span>
                  </label>
                  <button type="button" className="price-apply" onClick={applyPriceDraft}>Filtrar</button>
                </div>
                {priceDraftError ? <p id="price-error" className="filter-error" role="alert">{priceDraftError}</p> : null}
                <div className="filter-options price-range-options" aria-label="Rangos de precio">
                  {priceRangeOptions.map((range) => (
                    <label key={range.id}>
                      <input type="checkbox" checked={filters.priceRanges.includes(range.id)} onChange={(event) => togglePriceRange(range.id, event.target.checked)} />
                      <span>{priceRangeLabel(range)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>

            {filterGroups.map((group) => (
              <details className="filter-accordion filter-group" key={group.key}>
                <summary><span>{group.label}</span><ChevronDown size={17} aria-hidden="true" /></summary>
                <div className="filter-accordion-content filter-options">
                    {group.values.map((value) => (
                      <label key={value}>
                        <input type="checkbox" checked={(filters[group.key] as string[]).includes(value)} onChange={(event) => setArrayFilter(group.key, value, event.target.checked)} />
                        <span>{group.labels?.[value] ?? value}</span>
                      </label>
                    ))}
                </div>
              </details>
            ))}
          </div>
        </details>
      ) : null}

      {activeChips.length ? (
        <div className="active-filters" aria-label="Filtros activos">
          <span>Filtros activos</span>
          <div>
            {activeChips.map((chip) => (
              <button key={chip.id} type="button" onClick={chip.remove} aria-label={`Quitar filtro ${chip.label}`}>
                {chip.label} <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button className="clear-filters" type="button" onClick={clearFilters}>Limpiar todo</button>
          </div>
        </div>
      ) : null}

      <div className="catalog-result-row" aria-live="polite" aria-atomic="true">
        <p>{visibleProducts.length} {visibleProducts.length === 1 ? "referencia" : "referencias"}</p>
      </div>
      <WhatsappPrivacyNotice className="catalog-privacy-note" />
      {visibleProducts.length ? (
        <ScrollableProductGrid key={resetKey} products={visibleProducts} resetKey={resetKey} />
      ) : (
        <div className="empty-state compact">
          <h2>{invalidPriceRange ? "Revisa el rango de precio." : "No encontramos coincidencias."}</h2>
          <p>{invalidPriceRange ? "El valor mínimo debe ser menor o igual al máximo." : "Prueba otra búsqueda o cambia los filtros."}</p>
          {activeChips.length ? <button className="text-link empty-reset" type="button" onClick={clearFilters}>Limpiar filtros</button> : null}
        </div>
      )}
    </div>
  );
}
