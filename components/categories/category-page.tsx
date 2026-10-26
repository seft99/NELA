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
  mobileHeroDescription,
  heroImages,
  desktopHeroImages,
  desktopHeroCopy,
  mobileHeroCopy,
  catalogContext = "all",
  editorialHeroReference,
}: {
  category: Category;
  products: Product[];
  catalogTitle?: string;
  catalogDescription?: string;
  mobileCatalogTitle?: string;
  mobileCatalogDescription?: string;
  mobileHeroDescription?: string;
  heroImages?: readonly StoreCarouselSlide[];
  desktopHeroImages?: readonly StoreCarouselSlide[];
  desktopHeroCopy?: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
  mobileHeroCopy?: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
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
          mobileDescription={mobileHeroDescription}
        />
      ) : (
        <section className={`category-hero tone-${category.tone}${desktopHeroCopy ? " category-hero--desktop-curated" : ""}${mobileHeroCopy ? " category-hero--catalog-mobile-refined" : ""}`}>
          <div className="page-shell category-hero-grid">
            <div className="category-hero-copy reveal">
              <p className="eyebrow">
                {desktopHeroCopy ? <span className="category-hero-desktop-only">{desktopHeroCopy.eyebrow}</span> : null}
                <span className={desktopHeroCopy ? "category-hero-mobile-only" : undefined}>{mobileHeroCopy?.eyebrow ?? category.eyebrow}</span>
              </p>
              <h1>
                {desktopHeroCopy ? <span className="category-hero-desktop-only">{desktopHeroCopy.title}</span> : null}
                <span className={desktopHeroCopy ? "category-hero-mobile-only" : undefined}>{mobileHeroCopy?.title ?? category.name}</span>
              </h1>
              <p>
                {desktopHeroCopy ? <span className="category-hero-desktop-only">{desktopHeroCopy.description}</span> : null}
                <span className={desktopHeroCopy ? "category-hero-mobile-only" : undefined}>{mobileHeroCopy?.description ?? category.description}</span>
              </p>
              <Link href="#catalogo" className="text-link">
                {desktopHeroCopy ? <span className="category-hero-desktop-only">{desktopHeroCopy.cta}</span> : null}
                <span className={desktopHeroCopy ? "category-hero-mobile-only" : undefined}>{mobileHeroCopy?.cta ?? "Descubrir la colección"}</span>
              </Link>
            </div>
            <div className="category-hero-image image-reveal">
              {desktopHeroImages?.length ? (
                <>
                  <div className="category-hero-carousel category-hero-carousel--desktop">
                    <StoreImageCarousel
                      slides={desktopHeroImages}
                      ariaLabel={`Galería editorial de ${desktopHeroCopy?.title ?? category.name}`}
                      priority
                      variant="editorial"
                      autoplayInterval={5_500}
                    />
                  </div>
                  <div className="category-hero-carousel category-hero-carousel--mobile">
                    <StoreImageCarousel
                      slides={desktopHeroImages}
                      ariaLabel={`Galería editorial de ${desktopHeroCopy?.title ?? category.name}`}
                      priority
                      variant="editorial"
                      autoplayInterval={5_500}
                    />
                  </div>
                </>
              ) : (
                <StoreImageCarousel
                  slides={heroImages ?? [{ src: category.image, alt: category.imageAlt }]}
                  ariaLabel={`Galería de ${category.name}`}
                  priority
                />
              )}
            </div>
          </div>
        </section>
      )}
      <section className={`section page-shell catalog-explorer-shell catalog-explorer-shell--${catalogContext === "all" ? "all" : "category"}`}>
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
          <p className="catalog-explorer-description">
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
