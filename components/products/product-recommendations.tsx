import Image from "next/image";
import Link from "next/link";
import { formatCOP } from "@/config/site";
import type { Product } from "@/types/product";

export function ProductRecommendations({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="product-recommendations" aria-labelledby="product-recommendations-title">
      <div className="product-recommendations-heading">
        <p className="eyebrow">Continúa explorando</p>
        <h2 id="product-recommendations-title">También te pueden gustar</h2>
      </div>
      <div className="product-recommendations-grid">
        {products.map((product) => {
          const image = product.images[0];
          return (
            <article className="product-recommendation-card" key={product.id}>
              <Link className="product-recommendation-image" href={`/productos/${product.slug}`} aria-label={`Ver ${product.name}`}>
                {image ? (
                  <Image src={image.src} alt={image.alt} fill sizes="(max-width: 560px) 50vw, 15vw" />
                ) : (
                  <span>Fotografía no disponible</span>
                )}
              </Link>
              <h3><Link href={`/productos/${product.slug}`}>{product.name}</Link></h3>
              <p>{formatCOP(product.price)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
