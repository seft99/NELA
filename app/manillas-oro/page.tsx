import type { Metadata } from "next";
import { CategoryPage } from "@/components/categories/category-page";
import { categories } from "@/data/demo-products";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = { title: "Manillas de Oro", description: "Explora la colección de manillas de oro de NELA Joyería." };

export default async function GoldPage() {
  return <CategoryPage category={categories[2]} products={await getProductsByCategory("manillas-oro")} />;
}
