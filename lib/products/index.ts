import { cache } from "react";
import { derivePublicAvailability } from "@/lib/products/inventory";
import type { CategorySlug, Product } from "@/types/product";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const sanityConnectionRequested = Boolean(projectId || dataset);
const sanityConfigured = Boolean(projectId && dataset);
const publicCategory: CategorySlug = "accesorios-plata";

const productProjection = `{
  "id": _id,
  name,
  "slug": slug.current,
  category,
  shortDescription,
  description,
  price,
  currency,
  reference,
  presentation,
  quantityOrVolume,
  material,
  finish,
  measurements,
  catalogAttributes{
    audience,
    jewelryType,
    ringSizes,
    lengths,
    weaveType,
    motif,
    stone,
    hasStone
  },
  "images": images[]{"src": asset->url, alt},
  "variants": variants[]{
    "id": coalesce(id, _key),
    name,
    required,
    "options": options[]{"id": coalesce(id, _key), label}
  },
  "variantInventory": variantInventory[]{
    "id": _key,
    label,
    optionIds,
    stock
  },
  featured,
  "stock": coalesce(stock, inventoryQuantity, 0),
  "purchaseEnabled": coalesce(purchaseEnabled, available, false),
  visible,
  displayOrder,
  isDemo
}`;

const fetchSanityProducts = cache(async (includeHidden = false): Promise<Product[]> => {
  if (!projectId || !dataset) {
    throw new Error("La conexión pública con Sanity requiere Project ID y dataset.");
  }

  const apiVersion = process.env.SANITY_API_VERSION || "2025-02-19";
  const filter = includeHidden
    ? `*[_type == "product" && category == "${publicCategory}" && isDemo != true && !(_id in path("drafts.**"))]`
    : `*[_type == "product" && category == "${publicCategory}" && visible == true && isDemo != true && !(_id in path("drafts.**"))]`;
  const query = encodeURIComponent(`${filter} | order(displayOrder asc) ${productProjection}`);
  const endpoint = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("No fue posible consultar el catálogo de Sanity.");
  const payload = (await response.json()) as { result?: Product[] };
  return (payload.result || []).map(derivePublicAvailability);
});

export async function getProducts(): Promise<Product[]> {
  if (!sanityConnectionRequested) {
    console.error("Sanity no está configurado; el catálogo real no está disponible.");
    return [];
  }
  if (!sanityConfigured) {
    console.error("La conexión con Sanity está incompleta; no se expondrá el catálogo demo como respaldo.");
    return [];
  }
  try {
    const products = await fetchSanityProducts();
    return products.map(toPublicProduct);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProductsByCategory(category: CategorySlug) {
  return (await getProducts()).filter((product) => product.category === category);
}

export async function getFeaturedProducts() {
  return (await getProducts()).filter((product) => product.featured).slice(0, 4);
}

export async function getProductBySlug(slug: string) {
  return (await getProducts()).find((product) => product.slug === slug);
}

export async function getProductsForInventoryValidation() {
  if (!sanityConnectionRequested) throw new Error("Sanity no está configurado para validar el inventario.");
  if (!sanityConfigured) throw new Error("La conexión con Sanity está incompleta.");
  return (await fetchSanityProducts(true)).filter((product) => product.category === publicCategory);
}

export { sanityConfigured };

function toPublicProduct(product: Product): Product {
  const withAvailability = derivePublicAvailability(product);
  const publicProduct = { ...withAvailability };
  delete publicProduct.stock;
  delete publicProduct.variantInventory;
  return publicProduct;
}
