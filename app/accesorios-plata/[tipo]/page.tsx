import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/categories/category-page";
import { silverCollections, belongsToSilverCollection, getSilverCollection } from "@/config/silver-collections";
import { categories } from "@/data/demo-products";
import { getProductsByCategory } from "@/lib/products";

type SilverCollectionPageProps = { params: Promise<{ tipo: string }> };

export function generateStaticParams() {
  return silverCollections.map((collection) => ({ tipo: collection.slug }));
}

export async function generateMetadata({ params }: SilverCollectionPageProps): Promise<Metadata> {
  const collection = getSilverCollection((await params).tipo);
  if (!collection) return { title: "Categoría no encontrada" };
  return {
    title: `${collection.label} de Plata`,
    description: collection.description,
  };
}

export default async function SilverCollectionPage({ params }: SilverCollectionPageProps) {
  const collection = getSilverCollection((await params).tipo);
  if (!collection) notFound();

  const silverCategory = categories.find((category) => category.slug === "accesorios-plata")!;
  const products = (await getProductsByCategory("accesorios-plata"))
    .filter((product) => belongsToSilverCollection(product, collection));

  return (
    <CategoryPage
      category={{
        ...silverCategory,
        name: collection.label,
        eyebrow: "Colección de plata",
        description: collection.description,
        image: collection.image,
        imageAlt: collection.imageAlt,
      }}
      products={products}
      catalogTitle={`Explora ${collection.label.toLocaleLowerCase("es")}`}
      catalogDescription="Filtra por precio, disponibilidad y características para encontrar la referencia indicada."
    />
  );
}
