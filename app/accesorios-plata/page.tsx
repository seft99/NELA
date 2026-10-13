import type { Metadata } from "next";
import { CategoryPage } from "@/components/categories/category-page";
import { categories } from "@/data/demo-products";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = { title: "Accesorios de Plata", description: "Explora la colección de accesorios de plata de NELA Joyería." };

export default async function SilverPage() {
  return <CategoryPage category={categories[1]} products={await getProductsByCategory("accesorios-plata")} />;
}
