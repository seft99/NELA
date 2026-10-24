import type { Metadata } from "next";
import { CategoryPage } from "@/components/categories/category-page";
import { categories } from "@/config/categories";
import { getProductsByCategory } from "@/lib/products";
import { defaultStoreCarouselSlides } from "@/components/home/store-image-carousel";
import { getProductCarouselSlides } from "@/lib/products/carousel";

const desktopCatalogHeroSlides = [
  {
    src: "/images/store/anillo-floral.png",
    alt: "Anillo Floral de plata ley 925 de NELA",
    position: "50% 58%",
  },
  {
    src: "/images/store/cadena-venecia.png",
    alt: "Cadena Venecia de plata ley 925 de NELA",
    position: "50% 58%",
  },
  {
    src: "/images/store/argollas-entrelazadas.png",
    alt: "Argollas Entrelazadas de plata ley 925 de NELA",
    position: "50% 54%",
  },
  {
    src: "/images/store/dije-floral.png",
    alt: "Dije Floral de plata ley 925 de NELA",
    position: "50% 52%",
  },
  {
    src: "/images/store/pulsera-floral-verde.png",
    alt: "Pulsera Floral de plata ley 925 con circones verdes de NELA",
    position: "50% 50%",
  },
] as const;

export const metadata: Metadata = { title: "Accesorios de Plata Ley 925", description: "Explora la colección de accesorios de plata ley 925 de NELA Joyería." };

export default async function SilverPage() {
  const products = await getProductsByCategory("accesorios-plata");
  return (
    <CategoryPage
      category={categories[1]}
      products={products}
      heroImages={getProductCarouselSlides(products, defaultStoreCarouselSlides)}
      desktopHeroImages={desktopCatalogHeroSlides}
      desktopHeroCopy={{
        eyebrow: "BRILLO SERENO",
        title: "Joyas de plata ley 925",
        description: "Diseños delicados para acompañar cada momento.",
        cta: "DESCUBRIR LA COLECCIÓN",
      }}
      catalogDescription="Explora nuestra selección de joyas en plata ley 925 y encuentra una pieza para ti."
      mobileCatalogDescription="Busca, filtra y ordena la colección para encontrar tu próximo detalle."
      catalogContext="all"
    />
  );
}
