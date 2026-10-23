import Image from "next/image";
import Link from "next/link";
import type { Category, Product } from "@/types/product";

type CategoryEditorialHeroProps = {
  category: Category;
  products: readonly Product[];
  preferredProductReference?: string;
};

function getRepresentativeProduct(
  products: readonly Product[],
  preferredProductReference?: string,
) {
  const preferredProduct = preferredProductReference
    ? products.find((product) => (
      product.reference === preferredProductReference && product.images.some((image) => image.src)
    ))
    : undefined;

  return preferredProduct ?? products.find((product) => product.images.some((image) => image.src));
}

export function CategoryEditorialHero({
  category,
  products,
  preferredProductReference,
}: CategoryEditorialHeroProps) {
  const representativeProduct = getRepresentativeProduct(products, preferredProductReference);
  const representativeImage = representativeProduct?.images.find((image) => image.src);
  const imageSrc = representativeImage?.src ?? category.image;
  const imageAlt = representativeImage?.alt
    || (representativeProduct
      ? `${representativeProduct.name} de NELA Joyería`
      : category.imageAlt);
  const referenceLabel = products.length === 1 ? "referencia" : "referencias";

  return (
    <section className="category-editorial-hero" aria-labelledby="category-title">
      <div className="page-shell category-editorial-shell">
        <nav className="category-breadcrumb" aria-label="Ruta de navegación">
          <ol>
            <li><Link href="/">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/accesorios-plata">Accesorios de plata ley 925</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{category.name}</li>
          </ol>
        </nav>

        <div className="category-editorial-layout">
          <div className="category-editorial-copy">
            <div className="category-editorial-kicker">
              <span>COLECCIÓN NELA</span>
              <i aria-hidden="true" />
            </div>
            <h1 id="category-title">{category.name}</h1>
            <p className="category-editorial-description">{category.description}</p>
            <p className="category-reference-count">
              {products.length} {referenceLabel}
            </p>
          </div>

          <div className="category-editorial-visual">
            <div className="category-editorial-media">
              <span className="category-editorial-backdrop" aria-hidden="true" />
              <div className="category-editorial-image-frame">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(max-width: 820px) calc(100vw - 64px), (max-width: 1200px) 42vw, 460px"
                />
              </div>
            </div>
            <div className="category-editorial-note" aria-hidden="true">
              <i />
              <span>Joyas que te acompañan siempre</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
