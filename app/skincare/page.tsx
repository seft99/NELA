import type { Metadata } from "next";
import { CategoryPage } from "@/components/categories/category-page";
import { categories } from "@/data/demo-products";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = { title: "Skincare", description: "Explora la colección de skincare de NELA Joyería." };

export default async function SkincarePage() {
  return <CategoryPage category={categories[0]} products={await getProductsByCategory("skincare")} />;
}
