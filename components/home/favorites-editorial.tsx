import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FavoriteProductCard } from "@/components/home/favorite-product-card";
import { FavoritesMobileCarousel } from "@/components/home/favorites-mobile-carousel";
import type { JewelryType, Product } from "@/types/product";

const jewelryTypeIs = (product: Product, types: JewelryType[]) => (
  product.catalogAttributes?.jewelryType
    ? types.includes(product.catalogAttributes.jewelryType)
    : false
);

const normalizedName = (product: Product) => product.name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es");

function selectEditorialProducts(products: Product[]) {
  const candidates = products.filter((product) => Boolean(product.images[0]?.src));
  const usedIds = new Set<string>();

  const take = (predicate?: (product: Product) => boolean) => {
    const product = candidates.find((candidate) => (
      !usedIds.has(candidate.id) && (!predicate || predicate(candidate))
    ));

    if (product) usedIds.add(product.id);
    return product;
  };

  const lead = take((product) => normalizedName(product) === "lazo")
    ?? take((product) => jewelryTypeIs(product, ["cadena", "collar"]));
  const wide = take((product) => normalizedName(product).includes("entrelazada"))
    ?? take((product) => jewelryTypeIs(product, ["arete", "topo", "argolla", "ear-cuff"]));
  const firstCompact = take((product) => {
    const name = normalizedName(product);
    return name.includes("virgen milagrosa") && name.includes("piedras blancas");
  }) ?? take((product) => normalizedName(product).includes("virgen milagrosa"))
    ?? take((product) => jewelryTypeIs(product, ["dije"]));
  const secondCompact = take((product) => normalizedName(product).includes("flor aurora rosada"))
    ?? take((product) => jewelryTypeIs(product, ["pulsera", "pulso"]));

  const selected = [lead, wide, firstCompact, secondCompact];
  for (let index = 0; index < selected.length; index += 1) {
    if (!selected[index]) selected[index] = take();
  }

  const editorialProducts = selected.filter((product): product is Product => Boolean(product));
  const additionalProducts = candidates.filter((product) => !usedIds.has(product.id));

  return {
    lead: editorialProducts[0],
    wide: editorialProducts[1],
    firstCompact: editorialProducts[2],
    secondCompact: editorialProducts[3],
    mobileProducts: [...editorialProducts.slice(1), ...additionalProducts],
  };
}

export function FavoritesEditorial({ products }: { products: Product[] }) {
  const { lead, wide, firstCompact, secondCompact, mobileProducts } = selectEditorialProducts(products);

  if (!lead) return null;

  return (
    <section className="section favorites-section favorites-editorial" id="favoritos" aria-labelledby="favorites-title">
      <div className="page-shell favorites-editorial-layout">
        <header className="favorites-editorial-intro">
          <div className="favorites-editorial-kicker">
            <span aria-hidden="true" />
            <p className="eyebrow">Selección de la boutique</p>
          </div>
          <h2 id="favorites-title">Nuestros<br />favoritos</h2>
          <p>
            Una selección de accesorios de plata ley 925 para descubrir los detalles que definen el universo NELA.
          </p>
          <Link href="/accesorios-plata#catalogo" className="button favorites-editorial-cta">
            Ver toda la colección <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </header>

        <FavoriteProductCard product={lead} size="lead" />

        <div className="favorites-editorial-support">
          {wide ? <FavoriteProductCard product={wide} size="wide" /> : null}
          <div className="favorites-editorial-pair">
            {firstCompact ? <FavoriteProductCard product={firstCompact} size="compact" /> : null}
            {secondCompact ? <FavoriteProductCard product={secondCompact} size="compact" /> : null}
          </div>
        </div>

        <FavoritesMobileCarousel products={mobileProducts} />
      </div>
    </section>
  );
}
