"use client";

import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Minus,
  PackageCheck,
  PackageX,
  PauseCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { InventoryProduct } from "@/types/inventory";
import type { JewelryType } from "@/types/product";

const JEWELRY_TYPE_NAMES: Record<JewelryType, string> = {
  anillo: "Anillos",
  dije: "Dijes",
  argolla: "Argollas",
  pulso: "Pulseras",
  topo: "Topos",
  cadena: "Cadenas",
  arete: "Aretes",
  collar: "Collares",
  pulsera: "Pulseras",
  tobillera: "Tobilleras",
  "ear-cuff": "Ear cuffs",
};

type InventoryStatusFilter = "all" | "available" | "out-of-stock" | "paused" | "hidden";
type InventoryResponse = { products?: InventoryProduct[]; product?: InventoryProduct; error?: string };
type Feedback = { type: "success" | "error"; message: string; productId?: string };

async function requestInventory() {
  const response = await fetch("/api/admin/inventory", { cache: "no-store" });
  const payload = await response.json() as InventoryResponse;
  if (!response.ok || !payload.products) throw new Error(payload.error || "No fue posible cargar el inventario.");
  return payload.products;
}

function productHasChanges(original: InventoryProduct | undefined, draft: InventoryProduct | undefined) {
  if (!original || !draft) return false;
  if (
    original.stock !== draft.stock ||
    original.purchaseEnabled !== draft.purchaseEnabled ||
    original.visible !== draft.visible ||
    original.variantInventory.length !== draft.variantInventory.length
  ) return true;
  return original.variantInventory.some((line, index) => {
    const next = draft.variantInventory[index];
    return !next || line.id !== next.id || line.stock !== next.stock;
  });
}

function productStatus(product: InventoryProduct) {
  if (!product.visible) return { key: "hidden", label: "Oculto", className: "hidden" } as const;
  if (product.stock === 0) return { key: "out-of-stock", label: "Agotado", className: "unavailable" } as const;
  if (!product.purchaseEnabled) return { key: "paused", label: "Compra pausada", className: "paused" } as const;
  return { key: "available", label: "Disponible", className: "available" } as const;
}

export function InventoryDashboard({ ownerName, signOutPath }: { ownerName: string; signOutPath: string }) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InventoryProduct>>({});
  const [query, setQuery] = useState("");
  const [jewelryType, setJewelryType] = useState<"all" | JewelryType>("all");
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const replaceInventory = (nextProducts: InventoryProduct[]) => {
    setProducts(nextProducts);
    setDrafts(Object.fromEntries(nextProducts.map((product) => [product.id, product])));
  };

  const loadInventory = async () => {
    if (dirtyIds.size && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y actualizar el inventario?")) return;
    setLoading(true);
    setFeedback(null);
    try {
      const nextProducts = await requestInventory();
      replaceInventory(nextProducts);
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible cargar el inventario." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void requestInventory()
      .then((nextProducts) => {
        if (!active) return;
        replaceInventory(nextProducts);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible cargar el inventario." });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const dirtyIds = new Set(
    products.filter((product) => productHasChanges(product, drafts[product.id])).map((product) => product.id),
  );
  const hasDirtyProducts = dirtyIds.size > 0;

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!hasDirtyProducts) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasDirtyProducts]);

  const availableTypes = useMemo(() => Array.from(new Set(
    products.map((product) => product.jewelryType).filter((value): value is JewelryType => Boolean(value)),
  )).sort((a, b) => JEWELRY_TYPE_NAMES[a].localeCompare(JEWELRY_TYPE_NAMES[b], "es")), [products]);

  const stats = useMemo(() => ({
    all: products.length,
    available: products.filter((product) => productStatus(product).key === "available").length,
    "out-of-stock": products.filter((product) => product.stock === 0).length,
    paused: products.filter((product) => !product.purchaseEnabled).length,
    hidden: products.filter((product) => !product.visible).length,
  }), [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesType = jewelryType === "all" || product.jewelryType === jewelryType;
      const matchesStatus = statusFilter === "all" || (
        statusFilter === "out-of-stock"
          ? product.stock === 0
          : statusFilter === "paused"
            ? !product.purchaseEnabled
            : statusFilter === "hidden"
              ? !product.visible
              : productStatus(product).key === "available"
      );
      const searchable = `${product.name} ${product.reference ?? ""}`.toLocaleLowerCase("es");
      return matchesType && matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [jewelryType, products, query, statusFilter]);

  const updateDraft = (productId: string, update: (current: InventoryProduct) => InventoryProduct) => {
    setDrafts((current) => ({ ...current, [productId]: update(current[productId]) }));
    setFeedback((current) => current?.productId === productId ? null : current);
  };

  const resetProduct = (productId: string) => {
    const original = products.find((product) => product.id === productId);
    if (!original) return;
    setDrafts((current) => ({ ...current, [productId]: original }));
    setFeedback((current) => current?.productId === productId ? null : current);
  };

  const saveProduct = async (productId: string) => {
    const original = products.find((product) => product.id === productId);
    const draft = drafts[productId];
    if (!original || !draft || !productHasChanges(original, draft)) return;
    setSavingId(productId);
    setFeedback(null);

    const body = {
      productId,
      ...(draft.variantInventory.length
        ? { variantStocks: draft.variantInventory.map((line) => ({ id: line.id, stock: line.stock })) }
        : { stock: draft.stock }),
      purchaseEnabled: draft.purchaseEnabled,
      visible: draft.visible,
    };

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as InventoryResponse;
      if (!response.ok || !payload.product) throw new Error(payload.error || "No fue posible guardar los cambios.");
      setProducts((current) => current.map((product) => product.id === productId ? payload.product! : product));
      setDrafts((current) => ({ ...current, [productId]: payload.product! }));
      setFeedback({ type: "success", productId, message: "Cambios guardados correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        productId,
        message: error instanceof Error ? error.message : "No fue posible guardar los cambios.",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="inventory-admin page-shell" id="contenido" aria-labelledby="inventory-title">
      <header className="inventory-admin-header">
        <div className="inventory-heading-copy">
          <p className="eyebrow">Panel privado</p>
          <h1 id="inventory-title">Inventario NELA</h1>
          <p>Actualiza existencias y decide qué productos se pueden comprar o ver en la tienda.</p>
          <p className="inventory-session">Sesión activa: <strong>{ownerName}</strong></p>
        </div>
        <div className="inventory-header-actions">
          <button className="button button-outline" type="button" onClick={() => void loadInventory()} disabled={loading}>
            <RefreshCw size={17} aria-hidden="true" /> {loading ? "Actualizando…" : "Actualizar datos"}
          </button>
          <a className="text-link" href={signOutPath} target="_top">Cerrar sesión</a>
        </div>
      </header>

      <details className="inventory-help">
        <summary>¿Cómo usar este panel?</summary>
        <ol>
          <li>Busca el producto y ajusta sus existencias.</li>
          <li>Activa o pausa la compra y elige si aparece en el catálogo.</li>
          <li>Presiona <strong>Guardar cambios</strong> dentro de ese producto.</li>
        </ol>
      </details>

      <div className="inventory-overview" aria-label="Resumen y filtros del inventario">
        <StatusFilterButton active={statusFilter === "all"} label="Todos" value={stats.all} icon={<SlidersHorizontal />} onClick={() => setStatusFilter("all")} />
        <StatusFilterButton active={statusFilter === "available"} label="Disponibles" value={stats.available} icon={<PackageCheck />} onClick={() => setStatusFilter("available")} />
        <StatusFilterButton active={statusFilter === "out-of-stock"} label="Agotados" value={stats["out-of-stock"]} icon={<PackageX />} onClick={() => setStatusFilter("out-of-stock")} />
        <StatusFilterButton active={statusFilter === "paused"} label="Compra pausada" value={stats.paused} icon={<PauseCircle />} onClick={() => setStatusFilter("paused")} />
        <StatusFilterButton active={statusFilter === "hidden"} label="Ocultos" value={stats.hidden} icon={<EyeOff />} onClick={() => setStatusFilter("hidden")} />
      </div>

      <div className="inventory-controls">
        <label className="inventory-search">
          <span>Buscar producto</span>
          <span className="inventory-search-field">
            <Search size={19} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o referencia" />
          </span>
        </label>
        <label className="inventory-type-filter">
          <span>Tipo de joya</span>
          <select value={jewelryType} onChange={(event) => setJewelryType(event.target.value as "all" | JewelryType)}>
            <option value="all">Todos los tipos</option>
            {availableTypes.map((value) => <option key={value} value={value}>{JEWELRY_TYPE_NAMES[value]}</option>)}
          </select>
        </label>
        <p className="inventory-results" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      {feedback && !feedback.productId ? <FeedbackMessage feedback={feedback} /> : null}
      {loading ? <p className="inventory-loading" role="status">Cargando inventario…</p> : null}
      {!loading && feedback?.type !== "error" && !visibleProducts.length
        ? <p className="inventory-empty">No encontramos productos con esos filtros. Prueba otra búsqueda o selecciona “Todos”.</p>
        : null}

      <div className="inventory-list" aria-busy={loading}>
        {visibleProducts.map((product) => {
          const draft = drafts[product.id] ?? product;
          const hasVariants = draft.variantInventory.length > 0;
          const hasChanges = dirtyIds.has(product.id);
          const status = productStatus(draft);
          const productFeedback = feedback?.productId === product.id ? feedback : null;
          return (
            <article className={`inventory-card${hasChanges ? " has-changes" : ""}`} key={product.id}>
              <div className="inventory-card-heading">
                {draft.image ? (
                  <div className="inventory-product-image">
                    <Image src={draft.image.src} alt={draft.image.alt} width={112} height={112} sizes="112px" />
                  </div>
                ) : null}
                <div className="inventory-product-identity">
                  <p>{draft.jewelryType ? JEWELRY_TYPE_NAMES[draft.jewelryType] : "Joya de plata ley 925"}{draft.reference ? ` · ${draft.reference}` : ""}</p>
                  <h2>{draft.name}</h2>
                  <div className="inventory-product-badges">
                    <span className={`inventory-status ${status.className}`}>{status.label}</span>
                    {hasChanges ? <span className="inventory-unsaved">Cambios sin guardar</span> : null}
                  </div>
                </div>
              </div>

              {hasVariants ? (
                <fieldset className="inventory-variants">
                  <legend>Existencias por variante</legend>
                  {draft.variantInventory.map((line) => (
                    <div className="inventory-stock-row" key={line.id}>
                      <span>{line.label}</span>
                      <StockControl
                        value={line.stock}
                        label={`Existencias de ${draft.name}, ${line.label}`}
                        onChange={(stock) => updateDraft(draft.id, (current) => {
                          const variantInventory = current.variantInventory.map((item) => item.id === line.id ? { ...item, stock } : item);
                          return { ...current, variantInventory, stock: variantInventory.reduce((total, item) => total + item.stock, 0) };
                        })}
                      />
                    </div>
                  ))}
                  <p className="inventory-total">Total disponible: <strong>{draft.stock}</strong></p>
                </fieldset>
              ) : (
                <div className="inventory-stock-block">
                  <span><strong>Existencias</strong><small>Unidades disponibles para vender</small></span>
                  <StockControl
                    value={draft.stock}
                    label={`Existencias de ${draft.name}`}
                    onChange={(stock) => updateDraft(draft.id, (current) => ({ ...current, stock }))}
                  />
                </div>
              )}

              <div className="inventory-toggles">
                <label>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={draft.purchaseEnabled}
                    onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, purchaseEnabled: event.target.checked }))}
                  />
                  <span><strong>Permitir compras</strong><small>{draft.purchaseEnabled ? "Los clientes pueden pedir este producto." : "Las compras están pausadas temporalmente."}</small></span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={draft.visible}
                    onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, visible: event.target.checked }))}
                  />
                  <span><strong>Mostrar en el catálogo</strong><small>{draft.visible ? "El producto aparece en la tienda." : "Está oculto, pero no fue eliminado."}</small></span>
                </label>
              </div>

              <div className="inventory-card-actions">
                <button className="button button-outline inventory-reset" type="button" onClick={() => resetProduct(draft.id)} disabled={!hasChanges || savingId === draft.id} aria-label={`Descartar cambios de ${draft.name}`}>
                  <RotateCcw size={16} aria-hidden="true" /> <span>Descartar</span>
                </button>
                <button className="button button-primary inventory-save" type="button" onClick={() => void saveProduct(draft.id)} disabled={!hasChanges || savingId === draft.id}>
                  <Save size={16} aria-hidden="true" /> {savingId === draft.id ? "Guardando…" : hasChanges ? "Guardar cambios" : "Sin cambios"}
                </button>
              </div>
              {productFeedback ? <FeedbackMessage feedback={productFeedback} compact /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatusFilterButton({
  active,
  icon,
  label,
  onClick,
  value,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  value: number;
}) {
  return (
    <button className={active ? "is-active" : ""} type="button" aria-pressed={active} onClick={onClick}>
      <span className="inventory-overview-icon" aria-hidden="true">{icon}</span>
      <span><strong>{value}</strong><small>{label}</small></span>
    </button>
  );
}

function FeedbackMessage({ feedback, compact = false }: { feedback: Feedback; compact?: boolean }) {
  return (
    <p className={`inventory-feedback ${feedback.type}${compact ? " compact" : ""}`} role={feedback.type === "error" ? "alert" : "status"}>
      {feedback.type === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
      <span>{feedback.message}</span>
    </p>
  );
}

function StockControl({ value, label, onChange }: { value: number; label: string; onChange: (value: number) => void }) {
  const setStock = (next: number) => onChange(Math.max(0, Math.floor(Number.isFinite(next) ? next : 0)));
  return (
    <div className="inventory-stock-control" role="group" aria-label={label}>
      <button type="button" onClick={() => setStock(value - 1)} disabled={value <= 0} aria-label={`Reducir ${label.toLocaleLowerCase("es")}`}>
        <Minus size={17} aria-hidden="true" />
      </button>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={(event) => setStock(Number(event.target.value))}
      />
      <button type="button" onClick={() => setStock(value + 1)} aria-label={`Aumentar ${label.toLocaleLowerCase("es")}`}>
        <Plus size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
