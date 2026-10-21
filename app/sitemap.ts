import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { silverCollections } from "@/config/silver-collections";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/accesorios-plata",
    ...silverCollections.map((collection) => `/accesorios-plata/${collection.slug}`),
    "/nosotros",
    "/contacto",
    "/preguntas-frecuentes",
    "/politica-de-privacidad",
  ];
  const products = await getProducts();
  return [
    ...routes.map((route) => ({ url: `${siteConfig.url}${route}` })),
    ...products.map((product) => ({ url: `${siteConfig.url}/productos/${product.slug}` })),
  ];
}
