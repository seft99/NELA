import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { formatCOP } from "@/config/site";
import { getProductAvailability } from "@/lib/products/inventory";
import type { Product } from "@/types/product";

export type EditorialCardSize = "lead" | "wide" | "compact" | "mobile";

export function FavoriteProductCard({
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
      : size === "mobile"
        ? "(max-width: 430px) 82vw, 310px"
        : "(max-width: 680px) calc(50vw - 22px), (max-width: 1080px) 22vw, 17vw";
  const compactActions = size === "compact" || size === "mobile";

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
        <BuyNowButton product={product} placement="card" compact={compactActions} />
        <AddToCartButton product={product} compact={compactActions} />
      </div>
    </article>
  );
}
