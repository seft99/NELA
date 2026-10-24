"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";
import {
  catalogExplorerConfigs,
  type CatalogExplorerContext,
} from "@/config/catalog-explorer";
import { formatCOP } from "@/config/site";
import {
  emptyCatalogFilters,
  filterCatalogProducts,
  getCatalogFilterOptions,
  jewelryFilterLabels,
  jewelryTypeLabels,
  sortCatalogProducts,
  type CatalogFilterState,
  type CatalogSort,
} from "@/lib/products/catalog-filters";
import type { JewelryType, Product } from "@/types/product";
import { CatalogProductGrid } from "./catalog-product-grid";

type ArrayFilterKey = "jewelryTypes" | "productTypes" | "ringSizes" | "lengths";

const sortLabels: Record<CatalogSort, string> = {
  default: "Orden del catálogo",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "name-asc": "Nombre: A–Z",
  "name-desc": "Nombre: Z–A",
};

const urlParamByFilter: Record<ArrayFilterKey, string> = {
  jewelryTypes: "tipo",
  productTypes: "subtipo",
  ringSizes: "talla",
  lengths: "largo",
};

const obsoleteParams = ["precio", "publico", "tejido", "motivo", "piedra", "acabado"];

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

function normalizeSort(value: string | null): CatalogSort {
  if (value === "name") return "name-asc";
  if (value === "featured") return "default";
  if (value === "price-asc" || value === "price-desc" || value === "name-asc" || value === "name-desc") return value;
  return "default";
}

export function ProductExplorer({
  products,
  context = "all",
}: {
  products: Product[];
  context?: CatalogExplorerContext;
}) {
  const config = catalogExplorerConfigs[context];
  const options = useMemo(() => getCatalogFilterOptions(products), [products]);
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  const [sort, setSort] = useState<CatalogSort>("default");
  const [urlReady, setUrlReady] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [priceDraftError, setPriceDraftError] = useState("");
  const sortMenuRef = useRef<HTMLDetailsElement>(null);
  const mobileSortMenuRef = useRef<HTMLDetailsElement>(null);

  const earringTypes = useMemo(
    () => options.productTypes.filter((type) => type === "argolla" || type === "topo" || type === "arete"),
    [options.productTypes],
  );

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (sortMenuRef.current?.open && !sortMenuRef.current.contains(event.target as Node)) {
        sortMenuRef.current.removeAttribute("open");
      }
      if (mobileSortMenuRef.current?.open && !mobileSortMenuRef.current.contains(event.target as Node)) {
        mobileSortMenuRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const applyUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const jewelryTypes = config.category
        ? readList(params, "tipo", options.jewelryTypes).slice(0, 1) as JewelryType[]
        : [];
      const selectedCategory = jewelryTypes[0];
      const ringSizeEnabled = config.ringSize || (context === "all" && selectedCategory === "anillo");
      const lengthEnabled = config.length || (context === "all" && selectedCategory === "cadena");
      const minPrice = config.price ? readPrice(params, "precioMin", options.minPrice, options.maxPrice) : null;
      const maxPrice = config.price ? readPrice(params, "precioMax", options.minPrice, options.maxPrice) : null;
      const validPriceRange = minPrice === null || maxPrice === null || minPrice <= maxPrice;

      setFilters({
        query: config.search ? params.get("buscar") ?? "" : "",
        availableOnly: options.hasAvailabilityDifference && params.get("disponibles") === "1",
        minPrice: validPriceRange ? minPrice : null,
        maxPrice: validPriceRange ? maxPrice : null,
        jewelryTypes,
        productTypes: config.earringType
          ? readList(params, "subtipo", earringTypes).slice(0, 1) as JewelryType[]
          : [],
        ringSizes: ringSizeEnabled ? readList(params, "talla", options.ringSizes).slice(0, 1) : [],
        lengths: lengthEnabled ? readList(params, "largo", options.lengths).slice(0, 1) : [],
      });
      setPriceDraft({
        min: validPriceRange && minPrice !== null ? String(minPrice) : "",
        max: validPriceRange && maxPrice !== null ? String(maxPrice) : "",
      });
      setPriceDraftError("");
      const nextSort = normalizeSort(params.get("orden"));
      setSort(config.sortOptions.includes(nextSort) ? nextSort : "default");
      setUrlReady(true);
    };
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [config, context, earringTypes, options]);

  useEffect(() => {
    if (!urlReady) return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const setOrDelete = (name: string, value: string) => value ? params.set(name, value) : params.delete(name);
    obsoleteParams.forEach((name) => params.delete(name));
    setOrDelete("buscar", config.search ? filters.query.trim() : "");
    setOrDelete("disponibles", options.hasAvailabilityDifference && filters.availableOnly ? "1" : "");
    setOrDelete("precioMin", config.price && filters.minPrice !== null ? String(filters.minPrice) : "");
    setOrDelete("precioMax", config.price && filters.maxPrice !== null ? String(filters.maxPrice) : "");
    setOrDelete("orden", sort === "default" ? "" : sort);
    (Object.keys(urlParamByFilter) as ArrayFilterKey[]).forEach((key) => {
      setOrDelete(urlParamByFilter[key], filters[key].join(","));
    });
    window.history.replaceState(null, "", `${url.pathname}${params.size ? `?${params.toString()}` : ""}${url.hash}`);
  }, [config, filters, options.hasAvailabilityDifference, sort, urlReady]);

  const visibleProducts = useMemo(
    () => sortCatalogProducts(filterCatalogProducts(products, filters), sort),
    [filters, products, sort],
  );

  const setSingleFilter = (key: ArrayFilterKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value ? [value] : [] }));
  };

  const selectCategory = (value: string) => {
    setFilters((current) => ({
      ...current,
      jewelryTypes: value ? [value as JewelryType] : [],
      ringSizes: value === "anillo" ? current.ringSizes : [],
      lengths: value === "cadena" ? current.lengths : [],
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
    setFilters((current) => ({ ...current, minPrice, maxPrice }));
  };

  const clearFilters = () => {
    setFilters(emptyCatalogFilters);
    setSort("default");
    setPriceDraft({ min: "", max: "" });
    setPriceDraftError("");
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; remove: () => void }> = [];
    if (filters.query.trim()) chips.push({ id: "query", label: `Búsqueda: ${filters.query.trim()}`, remove: () => setFilters((current) => ({ ...current, query: "" })) });
    if (filters.availableOnly) chips.push({ id: "available", label: "Solo disponibles", remove: () => setFilters((current) => ({ ...current, availableOnly: false })) });
    if (filters.minPrice !== null) chips.push({ id: "min", label: `Desde ${formatCOP(filters.minPrice)}`, remove: () => { setFilters((current) => ({ ...current, minPrice: null })); setPriceDraft((current) => ({ ...current, min: "" })); } });
    if (filters.maxPrice !== null) chips.push({ id: "max", label: `Hasta ${formatCOP(filters.maxPrice)}`, remove: () => { setFilters((current) => ({ ...current, maxPrice: null })); setPriceDraft((current) => ({ ...current, max: "" })); } });
    filters.jewelryTypes.forEach((value) => chips.push({ id: `type-${value}`, label: jewelryFilterLabels[value] ?? jewelryTypeLabels[value], remove: () => selectCategory("") }));
    filters.productTypes.forEach((value) => chips.push({ id: `subtype-${value}`, label: jewelryTypeLabels[value], remove: () => setSingleFilter("productTypes", "") }));
    filters.ringSizes.forEach((value) => chips.push({ id: `size-${value}`, label: `Talla ${value}`, remove: () => setSingleFilter("ringSizes", "") }));
    filters.lengths.forEach((value) => chips.push({ id: `length-${value}`, label: value, remove: () => setSingleFilter("lengths", "") }));
    return chips;
  }, [filters]);

  const selectedCategory = filters.jewelryTypes[0];
  const showSearch = config.search;
  const showAvailability = options.hasAvailabilityDifference;
  const showSort = config.sortOptions.length > 1;
  const showCategoryFilter = config.category && options.jewelryTypes.length > 1;
  const showPriceFilter = config.price && options.minPrice < options.maxPrice;
  const showRingSizeFilter = (config.ringSize || (context === "all" && selectedCategory === "anillo"))
    && options.ringSizes.length > 1;
  const showLengthFilter = (config.length || (context === "all" && selectedCategory === "cadena"))
    && options.lengths.length > 1;
  const showEarringTypeFilter = config.earringType && earringTypes.length > 1;
  const showControls = showSearch || showAvailability || showSort;
  const showFilterPanel = showCategoryFilter || showPriceFilter || showRingSizeFilter
    || showLengthFilter || showEarringTypeFilter;
  const activeSortLabel = sortLabels[sort];

  const selectSort = (value: CatalogSort) => {
    setSort(value);
    sortMenuRef.current?.removeAttribute("open");
    mobileSortMenuRef.current?.removeAttribute("open");
  };

  const renderChoiceChips = (
    legend: string,
    name: string,
    selected: string,
    values: string[],
    onChange: (value: string) => void,
    labelFor: (value: string) => string = (value) => value,
  ) => (
    <div className="catalog-chip-group" role="group" aria-label={legend}>
      <span className="catalog-filter-label">{legend}</span>
      <div className="filter-options catalog-filter-chips">
        <label className={!selected ? "is-selected" : undefined}>
          <input type="radio" name={name} checked={!selected} onChange={() => onChange("")} />
          <span>Todas</span>
        </label>
        {values.map((value) => (
          <label key={value} className={selected === value ? "is-selected" : undefined}>
            <input type="radio" name={name} checked={selected === value} onChange={() => onChange(value)} />
            <span>{labelFor(value)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div id="catalogo" className={`catalog-section catalog-section--${context}${context === "all" ? "" : " catalog-section--category"}`}>
      {showControls ? (
        <div className="catalog-controls">
          {showSearch ? (
            <label className="search-control">
              <span className="sr-only">Buscar productos</span>
              <Search size={18} aria-hidden="true" />
              <input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Buscar por nombre o referencia" />
            </label>
          ) : null}
          {showAvailability ? (
            <div className="availability-control">
              <span className="availability-label">Disponibilidad</span>
              <label className={`availability-option${filters.availableOnly ? " is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))}
                />
                <span className="availability-check" aria-hidden="true">
                  <Check size={13} strokeWidth={2.25} />
                </span>
                <span>Solo disponibles</span>
              </label>
            </div>
          ) : null}
          {showSort ? (
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
                  {config.sortOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={sort === value ? "is-selected" : undefined}
                      aria-pressed={sort === value}
                      onClick={() => selectSort(value)}
                    >
                      <span>{sortLabels[value]}</span>
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </details>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`catalog-filter-row${showFilterPanel ? "" : " catalog-filter-row--results-only"}`}>
        {showFilterPanel ? (
          <div className="catalog-filter-groups">
            {showCategoryFilter ? (
              renderChoiceChips(
                "Tipo de joya",
                "catalog-category",
                selectedCategory ?? "",
                options.jewelryTypes,
                selectCategory,
                (value) => jewelryFilterLabels[value as JewelryType] ?? jewelryTypeLabels[value as JewelryType],
              )
            ) : null}

            {showPriceFilter ? (
              <div className="catalog-chip-group catalog-price-group" role="group" aria-label="Precio">
                <span className="catalog-filter-label">Precio</span>
                <p id="price-limits" className="sr-only">Límites: {formatCOP(options.minPrice)} a {formatCOP(options.maxPrice)} COP</p>
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
              </div>
            ) : null}

            {showRingSizeFilter ? (
              renderChoiceChips("Talla", "catalog-ring-size", filters.ringSizes[0] ?? "", options.ringSizes, (value) => setSingleFilter("ringSizes", value), (value) => `Talla ${value}`)
            ) : null}

            {showLengthFilter ? (
              renderChoiceChips("Longitud", "catalog-length", filters.lengths[0] ?? "", options.lengths, (value) => setSingleFilter("lengths", value))
            ) : null}

            {showEarringTypeFilter ? (
              renderChoiceChips("Tipo", "catalog-earring-type", filters.productTypes[0] ?? "", earringTypes, (value) => setSingleFilter("productTypes", value), (value) => jewelryTypeLabels[value as JewelryType])
            ) : null}
          </div>
        ) : <span aria-hidden="true" />}
        <div className="catalog-result-row">
          {activeChips.length ? (
            <button className="clear-filters" type="button" onClick={clearFilters}>
              Limpiar filtros <X size={13} aria-hidden="true" />
            </button>
          ) : null}
          <p aria-live="polite" aria-atomic="true">{visibleProducts.length} {visibleProducts.length === 1 ? "referencia" : "referencias"}</p>
        </div>
      </div>
      {showAvailability ? (
        <label className={`catalog-mobile-availability availability-option${filters.availableOnly ? " is-active" : ""}`}>
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))}
          />
          <span className="availability-check" aria-hidden="true">
            <Check size={13} strokeWidth={2.25} />
          </span>
          <span>Solo disponibles</span>
        </label>
      ) : null}
      <div className={`catalog-mobile-results-sort${showSort ? " has-sort" : ""}`}>
        <p aria-live="polite" aria-atomic="true">
          {visibleProducts.length} {visibleProducts.length === 1 ? "referencia" : "referencias"}
        </p>
        {showSort ? (
          <div className="catalog-mobile-sort">
            <span>Ordenar</span>
            <details
              ref={mobileSortMenuRef}
              className="sort-menu catalog-mobile-sort-menu"
              onKeyDown={(event) => {
                if (event.key === "Escape" && mobileSortMenuRef.current?.open) {
                  mobileSortMenuRef.current.removeAttribute("open");
                  mobileSortMenuRef.current.querySelector("summary")?.focus();
                }
              }}
            >
              <summary
                aria-label={`Orden actual: ${activeSortLabel}`}
              >
                <span>{activeSortLabel}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div className="sort-options catalog-mobile-sort-options" aria-label="Opciones de orden">
                {config.sortOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={sort === value ? "is-selected" : undefined}
                    aria-pressed={sort === value}
                    onClick={() => selectSort(value)}
                  >
                    <span>{sortLabels[value]}</span>
                    <Check size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </details>
          </div>
        ) : null}
        {activeChips.length ? (
          <button className="clear-filters catalog-mobile-clear" type="button" onClick={clearFilters}>
            Limpiar filtros <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {visibleProducts.length ? (
        <CatalogProductGrid products={visibleProducts} context={context} />
      ) : (
        <div className="empty-state compact">
          <h2>{products.length === 0 ? "Catálogo temporalmente no disponible." : "No encontramos coincidencias."}</h2>
          <p>{products.length === 0 ? "Estamos actualizando la colección. Intenta nuevamente más tarde o escríbenos por WhatsApp." : "Prueba otra búsqueda o cambia los filtros aplicados."}</p>
          {activeChips.length ? <button className="text-link empty-reset" type="button" onClick={clearFilters}>Limpiar filtros</button> : null}
        </div>
      )}
      <WhatsappPrivacyNotice className="catalog-privacy-note" />
    </div>
  );
}
