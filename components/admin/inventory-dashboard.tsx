"use client";

import { Minus, Plus, RefreshCw, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { InventoryProduct } from "@/types/inventory";
import type { CategorySlug } from "@/types/product";

const CATEGORY_NAMES: Record<CategorySlug, string> = {
  skincare: "Skincare",
  "accesorios-plata": "Accesorios de Plata",
  "manillas-oro": "Manillas de Oro",
};

type InventoryResponse = { products?: InventoryProduct[]; product?: InventoryProduct; error?: string };

async function requestInventory() {
  const response = await fetch("/api/admin/inventory", { cache: "no-store" });
  const payload = await response.json() as InventoryResponse;
  if (!response.ok || !payload.products) throw new Error(payload.error || "No fue posible cargar el inventario.");
  return payload.products;
}

export function InventoryDashboard({ ownerName, signOutPath }: { ownerName: string; signOutPath: string }) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InventoryProduct>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CategorySlug>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadInventory = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const nextProducts = await requestInventory();
      setProducts(nextProducts);
      setDrafts(Object.fromEntries(nextProducts.map((product) => [product.id, product])));
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
        setProducts(nextProducts);
        setDrafts(Object.fromEntries(nextProducts.map((product) => [product.id, product])));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible cargar el inventario." });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const searchable = `${product.name} ${product.reference ?? ""}`.toLocaleLowerCase("es");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, products, query]);

  const updateDraft = (productId: string, update: (current: InventoryProduct) => InventoryProduct) => {
    setDrafts((current) => ({ ...current, [productId]: update(current[productId]) }));
    setFeedback(null);
  };

  const saveProduct = async (productId: string) => {
    const original = products.find((product) => product.id === productId);
    const draft = drafts[productId];
    if (!original || !draft) return;
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
      setFeedback({ type: "success", message: `${payload.product.name}: cambios guardados.` });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "No fue posible guardar los cambios." });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="inventory-admin page-shell" id="contenido" aria-labelledby="inventory-title">
      <header className="inventory-admin-header">
        <div>
          <p className="eyebrow">Panel privado</p>
          <h1 id="inventory-title">NELA — Gestión de Inventario</h1>
          <p>Hola, {ownerName}. Aquí puedes actualizar existencias, disponibilidad y visibilidad.</p>
        </div>
        <div className="inventory-header-actions">
          <button className="button button-outline" type="button" onClick={() => void loadInventory()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" /> Actualizar
          </button>
          <a className="text-link" href={signOutPath} target="_top">Cerrar sesión</a>
        </div>
      </header>

      <div className="inventory-controls">
        <label className="inventory-search">
          <span className="sr-only">Buscar por nombre o referencia</span>
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o referencia" />
        </label>
        <label>
          <span>Categoría</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as "all" | CategorySlug)}>
            <option value="all">Todas</option>
            {Object.entries(CATEGORY_NAMES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {feedback ? <p className={`inventory-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
      {loading ? <p className="inventory-loading" role="status">Cargando inventario…</p> : null}
      {!loading && feedback?.type !== "error" && !visibleProducts.length
        ? <p className="inventory-empty">No hay productos que coincidan con la búsqueda.</p>
        : null}

      <div className="inventory-list">
        {visibleProducts.map((product) => {
          const draft = drafts[product.id] ?? product;
          const hasVariants = draft.variantInventory.length > 0;
          return (
            <article className="inventory-card" key={product.id}>
              <div className="inventory-card-heading">
                <div>
                  <p>{CATEGORY_NAMES[product.category]}{product.reference ? ` · Ref. ${product.reference}` : ""}</p>
                  <h2>{product.name}</h2>
                </div>
                <span className={`inventory-status ${draft.stock > 0 && draft.purchaseEnabled && draft.visible ? "available" : "unavailable"}`}>
                  {draft.stock === 0 ? "Agotado" : draft.purchaseEnabled && draft.visible ? "Disponible" : "No disponible"}
                </span>
              </div>

              {hasVariants ? (
                <fieldset className="inventory-variants">
                  <legend>Existencias por variante</legend>
                  {draft.variantInventory.map((line) => (
                    <div className="inventory-stock-row" key={line.id}>
                      <span>{line.label}</span>
                      <StockControl
                        value={line.stock}
                        label={`Existencias de ${product.name}, ${line.label}`}
                        onChange={(stock) => updateDraft(product.id, (current) => {
                          const variantInventory = current.variantInventory.map((item) => item.id === line.id ? { ...item, stock } : item);
                          return { ...current, variantInventory, stock: variantInventory.reduce((total, item) => total + item.stock, 0) };
                        })}
                      />
                    </div>
                  ))}
                  <p className="inventory-total">Total: {draft.stock} unidades</p>
                </fieldset>
              ) : (
                <div className="inventory-stock-block">
                  <span>Existencias</span>
                  <StockControl
                    value={draft.stock}
                    label={`Existencias de ${product.name}`}
                    onChange={(stock) => updateDraft(product.id, (current) => ({ ...current, stock }))}
                  />
                </div>
              )}

              <div className="inventory-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.purchaseEnabled}
                    onChange={(event) => updateDraft(product.id, (current) => ({ ...current, purchaseEnabled: event.target.checked }))}
                  />
                  <span><strong>Compra habilitada</strong><small>Permite pausar pedidos sin ocultar el producto.</small></span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.visible}
                    onChange={(event) => updateDraft(product.id, (current) => ({ ...current, visible: event.target.checked }))}
                  />
                  <span><strong>Visible en el catálogo</strong><small>Ocultarlo no elimina su información.</small></span>
                </label>
              </div>

              <button className="button button-primary inventory-save" type="button" onClick={() => void saveProduct(product.id)} disabled={savingId === product.id}>
                <Save size={16} aria-hidden="true" /> {savingId === product.id ? "Guardando…" : "Guardar cambios"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StockControl({ value, label, onChange }: { value: number; label: string; onChange: (value: number) => void }) {
  const setStock = (next: number) => onChange(Math.max(0, Math.floor(Number.isFinite(next) ? next : 0)));
  return (
    <div className="inventory-stock-control" role="group" aria-label={label}>
      <button type="button" onClick={() => setStock(value - 1)} disabled={value <= 0} aria-label={`Reducir ${label.toLocaleLowerCase("es")}`}>
        <Minus size={15} aria-hidden="true" />
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
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
