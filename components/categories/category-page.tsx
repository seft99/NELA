import Link from "next/link";
import type { Category, Product } from "@/types/product";
import type { StoreCarouselSlide } from "@/components/home/store-image-carousel";
import { StoreImageCarousel } from "@/components/home/store-image-carousel";
import { CategoryConsultationBanner } from "@/components/categories/category-consultation-banner";
import { CategoryEditorialHero } from "@/components/categories/category-editorial-hero";
import { ProductExplorer } from "@/components/products/product-explorer";
import type { CatalogExplorerContext } from "@/config/catalog-explorer";

export function CategoryPage({
  category,
  products,
  catalogTitle = "Encuentra tu próximo detalle",
  catalogDescription = "Busca, filtra y ordena la colección para encontrar tu próximo detalle.",
  mobileCatalogTitle,
  mobileCatalogDescription,
  heroImages,
  catalogContext = "all",
  editorialHeroReference,
}: {
  category: Category;
  products: Product[];
  catalogTitle?: string;
  catalogDescription?: string;
  mobileCatalogTitle?: string;
  mobileCatalogDescription?: string;
  heroImages?: readonly StoreCarouselSlide[];
  catalogContext?: CatalogExplorerContext;
  editorialHeroReference?: string;
}) {
  return (
    <>
      {editorialHeroReference ? (
        <CategoryEditorialHero
          category={category}
          products={products}
          preferredProductReference={editorialHeroReference}
        />
      ) : (
        <section className={`category-hero tone-${category.tone}`}>
          <div className="page-shell category-hero-grid">
            <div className="category-hero-copy reveal">
              <p className="eyebrow">{category.eyebrow}</p>
              <h1>{category.name}</h1>
              <p>{category.description}</p>
              <Link href="#catalogo" className="text-link">Descubrir la colección</Link>
            </div>
            <div className="category-hero-image image-reveal">
              <StoreImageCarousel
                slides={heroImages ?? [{ src: category.image, alt: category.imageAlt }]}
                ariaLabel={`Galería de ${category.name}`}
                priority
              />
            </div>
          </div>
        </section>
      )}
      <section className={`section page-shell catalog-explorer-shell${catalogContext === "all" ? "" : " catalog-explorer-shell--category"}`}>
        <div className="section-heading catalog-explorer-heading">
          <div>
            <p className="eyebrow">
              <span className="catalog-explorer-copy-desktop">Selección NELA</span>
              <span className="catalog-explorer-copy-mobile">Explora la colección</span>
            </p>
            <h2>
              <span className="catalog-explorer-copy-desktop">{catalogTitle}</span>
              <span className="catalog-explorer-copy-mobile">{mobileCatalogTitle ?? catalogTitle}</span>
            </h2>
          </div>
          <p>
            <span className="catalog-explorer-copy-desktop">{catalogDescription}</span>
            <span className="catalog-explorer-copy-mobile">{mobileCatalogDescription ?? catalogDescription}</span>
          </p>
        </div>
        <ProductExplorer products={products} context={catalogContext} />
      </section>
      <CategoryConsultationBanner />
    </>
  );
}
