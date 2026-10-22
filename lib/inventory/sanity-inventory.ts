import { normalizeStock } from "@/lib/products/inventory";
import type { InventoryProduct } from "@/types/inventory";
import type { z } from "zod";
import type { inventoryUpdateSchema } from "./validation";

type InventoryUpdate = z.infer<typeof inventoryUpdateSchema>;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = process.env.SANITY_API_VERSION || "2025-02-19";

export function sanityInventoryConfigured() {
  return Boolean(projectId && dataset && token);
}

function requireConfiguration() {
  if (!projectId || !dataset || !token) {
    throw new Error("La gestión de inventario requiere proyecto, dataset y token de escritura de Sanity.");
  }
  return { projectId, dataset, token };
}

async function sanityRequest(path: string, init: RequestInit = {}) {
  const config = requireConfiguration();
  const response = await fetch(
    `https://${config.projectId}.api.sanity.io/v${apiVersion}/data/${path}`,
    {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    },
  );
  if (!response.ok) throw new Error(`Sanity respondió con estado ${response.status}.`);
  return response.json();
}

const inventoryQuery = `*[_type == "product" && category == "accesorios-plata" && (${dataset === "production" ? "isDemo != true" : "true"}) && !(_id in path("drafts.**"))] | order(displayOrder asc) {
  "id": _id,
  "revision": _rev,
  name,
  reference,
  category,
  "stock": coalesce(stock, inventoryQuantity, 0),
  "purchaseEnabled": coalesce(purchaseEnabled, available, false),
  "visible": coalesce(visible, false),
  "variantInventory": coalesce(variantInventory[]{
    "id": _key,
    label,
    optionIds,
    stock
  }, [])
}`;

export async function listInventoryProducts(): Promise<InventoryProduct[]> {
  const config = requireConfiguration();
  const payload = await sanityRequest(`query/${config.dataset}?query=${encodeURIComponent(inventoryQuery)}`) as { result?: InventoryProduct[] };
  return (payload.result ?? []).map((product) => ({
    ...product,
    stock: normalizeStock(product.stock),
    purchaseEnabled: Boolean(product.purchaseEnabled),
    visible: Boolean(product.visible),
    variantInventory: (product.variantInventory ?? []).map((line) => ({ ...line, stock: normalizeStock(line.stock) })),
  }));
}

export async function updateInventoryProduct(update: InventoryUpdate): Promise<InventoryProduct> {
  const current = (await listInventoryProducts()).find((product) => product.id === update.productId);
  if (!current) throw new Error("El producto ya no existe o no está publicado.");

  const set: Record<string, unknown> = {};
  if (update.purchaseEnabled !== undefined) set.purchaseEnabled = update.purchaseEnabled;
  if (update.visible !== undefined) set.visible = update.visible;

  if (current.variantInventory.length) {
    if (update.stock !== undefined) {
      throw new Error("Actualiza las existencias de cada variante; el total se calcula automáticamente.");
    }
    if (update.variantStocks) {
      const updatesById = new Map(update.variantStocks.map((line) => [line.id, line.stock]));
      for (const id of updatesById.keys()) {
        if (!current.variantInventory.some((line) => line.id === id)) {
          throw new Error("Una variante enviada ya no existe.");
        }
      }
      const variantInventory = current.variantInventory.map((line) => ({
        _key: line.id,
        _type: "variantInventoryLine",
        label: line.label,
        optionIds: line.optionIds,
        stock: normalizeStock(updatesById.get(line.id) ?? line.stock),
      }));
      set.variantInventory = variantInventory;
      set.stock = variantInventory.reduce((total, line) => total + line.stock, 0);
    }
  } else if (update.variantStocks?.length) {
    throw new Error("Este producto no tiene inventario por variantes.");
  } else if (update.stock !== undefined) {
    set.stock = normalizeStock(update.stock);
  }

  const config = requireConfiguration();
  const payload = await sanityRequest(`mutate/${config.dataset}`, {
    method: "POST",
    body: JSON.stringify({
      mutations: [{ patch: { id: current.id, ifRevisionID: current.revision, set } }],
      returnDocuments: true,
    }),
  }) as { results?: Array<{ document?: unknown }> };

  if (!payload.results?.length) throw new Error("Sanity no confirmó la actualización.");
  return (await listInventoryProducts()).find((product) => product.id === current.id)!;
}
