import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/skincare", "/accesorios-plata", "/manillas-oro", "/nosotros", "/contacto", "/preguntas-frecuentes", "/politica-de-privacidad"];
  const products = await getProducts();
  return [
    ...routes.map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date() })),
    ...products.map((product) => ({ url: `${siteConfig.url}/productos/${product.slug}`, lastModified: new Date() })),
  ];
}
