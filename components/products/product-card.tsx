import Image from "next/image";
import { formatCOP } from "@/config/site";
import { getProductAvailability } from "@/lib/products/inventory";
import type { Product } from "@/types/product";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { TopNavigationLink } from "@/components/navigation/top-navigation-link";

export function ProductCard({
  product,
  compactMobileActions = false,
}: {
  product: Product;
  compactMobileActions?: boolean;
}) {
  const image = product.images[0];
  const availability = getProductAvailability(product);
  return (
    <article className="product-card">
      <TopNavigationLink
        href={`/productos/${product.slug}`}
        className="product-image-wrap"
        aria-label={`Ver ${product.name}`}
        mobileOnly
      >
        {!availability.available ? <span className="unavailable-badge">{availability.label}</span> : null}
        <Image
          src={image?.src || "/images/editorial/hero-nela-demo.png"}
          alt={image?.alt || `Vista de ${product.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="product-image"
        />
      </TopNavigationLink>
      <div className="product-card-copy">
        <div>
          <h3><TopNavigationLink href={`/productos/${product.slug}`} mobileOnly>{product.name}</TopNavigationLink></h3>
          <p>{formatCOP(product.price)}</p>
        </div>
      </div>
      {compactMobileActions ? (
        <>
          <div className="product-card-actions product-card-actions--desktop">
            <AddToCartButton product={product} />
            <BuyNowButton product={product} placement="card" />
          </div>
          <div className="product-card-actions product-card-actions--mobile">
            <BuyNowButton product={product} placement="card" mobileCompact />
            <AddToCartButton product={product} mobileCompact />
          </div>
        </>
      ) : (
        <div className="product-card-actions">
          <AddToCartButton product={product} />
          <BuyNowButton product={product} placement="card" />
        </div>
      )}
    </article>
  );
}
