import { demoProducts } from "@/data/demo-products";
import type { CategorySlug, Product } from "@/types/product";

const sanityConfigured = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET,
);

const productQuery = encodeURIComponent(`*[_type == "product" && visible == true] | order(displayOrder asc) {
  "id": _id,
  name,
  "slug": slug.current,
  category,
  shortDescription,
  description,
  price,
  "images": images[]{"src": asset->url, alt},
  featured,
  available,
  visible,
  displayOrder
}`);

async function fetchSanityProducts(): Promise<Product[]> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) return [];

  const apiVersion = process.env.SANITY_API_VERSION || "2025-02-19";
  const endpoint = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${productQuery}`;
  const response = await fetch(endpoint, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error("No fue posible consultar el catálogo de Sanity.");
  const payload = (await response.json()) as { result?: Product[] };
  return (payload.result || []).filter((product) => product.visible);
}

export async function getProducts(): Promise<Product[]> {
  if (!sanityConfigured) return demoProducts;
  try {
    const products = await fetchSanityProducts();
    return products.length ? products : [];
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

export { sanityConfigured };
