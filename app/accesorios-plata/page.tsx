import type { Metadata } from "next";
import { CategoryPage } from "@/components/categories/category-page";
import { categories } from "@/config/categories";
import { getProductsByCategory } from "@/lib/products";
import { defaultStoreCarouselSlides } from "@/components/home/store-image-carousel";
import { getProductCarouselSlides } from "@/lib/products/carousel";

export const metadata: Metadata = { title: "Accesorios de Plata Ley 925", description: "Explora la colección de accesorios de plata ley 925 de NELA Joyería." };

export default async function SilverPage() {
  const products = await getProductsByCategory("accesorios-plata");
  return (
    <CategoryPage
      category={categories[1]}
      products={products}
      heroImages={getProductCarouselSlides(products, defaultStoreCarouselSlides)}
      catalogContext="all"
    />
  );
}
