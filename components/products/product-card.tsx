import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCOP } from "@/config/site";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  return (
    <article className="product-card">
      <Link href={`/productos/${product.slug}`} className="product-image-wrap" aria-label={`Ver ${product.name}`}>
        {product.isDemo ? <span className="demo-badge">Contenido demo</span> : null}
        <Image
          src={image?.src || "/images/editorial/hero-nela-demo.png"}
          alt={image?.alt || `Vista de ${product.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="product-image"
        />
      </Link>
      <div className="product-card-copy">
        <div>
          <h3><Link href={`/productos/${product.slug}`}>{product.name}</Link></h3>
          <p>{formatCOP(product.price)}</p>
        </div>
        <Link href={`/productos/${product.slug}`} className="product-arrow" aria-label={`Detalles de ${product.name}`}>
          <ArrowUpRight size={18} />
        </Link>
      </div>
      {!product.available ? <p className="availability">No disponible por ahora</p> : null}
    </article>
  );
}
