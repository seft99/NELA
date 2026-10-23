import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { formatCOP } from "@/config/site";
import { getProductAvailability } from "@/lib/products/inventory";
import type { JewelryType, Product } from "@/types/product";

type EditorialCardSize = "lead" | "wide" | "compact";

const jewelryTypeIs = (product: Product, types: JewelryType[]) => (
  product.catalogAttributes?.jewelryType
    ? types.includes(product.catalogAttributes.jewelryType)
    : false
);

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

  const lead = take((product) => jewelryTypeIs(product, ["cadena", "collar"]));
  const wide = take((product) => jewelryTypeIs(product, ["arete", "topo", "argolla", "ear-cuff"]));
  const firstCompact = take((product) => jewelryTypeIs(product, ["dije"]));
  const secondCompact = take((product) => jewelryTypeIs(product, ["pulsera", "pulso"]));

  const selected = [lead, wide, firstCompact, secondCompact];
  for (let index = 0; index < selected.length; index += 1) {
    if (!selected[index]) selected[index] = take();
  }

  return selected as Array<Product | undefined>;
}

function EditorialProductCard({
  product,
  size,
}: {
  product: Product;
  size: EditorialCardSize;
}) {
  const image = product.images[0];
  const availability = getProductAvailability(product);
  const sizes = size === "lead"
    ? "(max-width: 680px) calc(100vw - 32px), (max-width: 1080px) 56vw, 34vw"
    : size === "wide"
      ? "(max-width: 680px) calc(100vw - 32px), (max-width: 1080px) 44vw, 35vw"
      : "(max-width: 680px) calc(50vw - 22px), (max-width: 1080px) 22vw, 17vw";

  return (
    <article className={`favorite-product-card favorite-product-card--${size}`}>
      <Link
        href={`/productos/${product.slug}`}
        className="favorite-product-media"
        aria-label={`Ver detalles de ${product.name}`}
      >
        {!availability.available ? (
          <span className="unavailable-badge">{availability.label}</span>
        ) : null}
        <Image
          src={image.src}
          alt={image.alt || `Vista de ${product.name}`}
          fill
          sizes={sizes}
          className="favorite-product-image"
        />
      </Link>

      <div className="favorite-product-copy">
        <h3><Link href={`/productos/${product.slug}`}>{product.name}</Link></h3>
        <p>{formatCOP(product.price)}</p>
      </div>

      <div className="favorite-product-actions" aria-label={`Opciones de compra para ${product.name}`}>
        <BuyNowButton product={product} placement="card" compact={size === "compact"} />
        <AddToCartButton product={product} compact={size === "compact"} />
      </div>
    </article>
  );
}

export function FavoritesEditorial({ products }: { products: Product[] }) {
  const [lead, wide, firstCompact, secondCompact] = selectEditorialProducts(products);

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

        <EditorialProductCard product={lead} size="lead" />

        <div className="favorites-editorial-support">
          {wide ? <EditorialProductCard product={wide} size="wide" /> : null}
          <div className="favorites-editorial-pair">
            {firstCompact ? <EditorialProductCard product={firstCompact} size="compact" /> : null}
            {secondCompact ? <EditorialProductCard product={secondCompact} size="compact" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
