import Image from "next/image";
import Link from "next/link";
import type { Category, Product } from "@/types/product";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { ProductExplorer } from "@/components/products/product-explorer";

export function CategoryPage({ category, products }: { category: Category; products: Product[] }) {
  return (
    <>
      <section className={`category-hero tone-${category.tone}`}>
        <div className="page-shell category-hero-grid">
          <div className="category-hero-copy reveal">
            <p className="eyebrow">{category.eyebrow}</p>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
            <Link href="#catalogo" className="text-link">Descubrir la colección</Link>
          </div>
          <div className="category-hero-image image-reveal">
            <Image src={category.image} alt={category.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
            <span className="demo-image-note">Imagen editorial de demostración</span>
          </div>
        </div>
      </section>
      <section className="section page-shell">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Selección NELA</p>
            <h2>Encuentra tu próximo detalle</h2>
          </div>
          <p>{products.length} referencias en este catálogo {products.some((item) => item.isDemo) ? "de demostración" : ""}.</p>
        </div>
        <ProductExplorer products={products} />
      </section>
      <section className={`category-contact tone-${category.tone}`}>
        <div className="page-shell contact-inline">
          <div>
            <p className="eyebrow">Asesoría personalizada</p>
            <h2>¿Quieres conocer más detalles?</h2>
            <p>Conversemos sobre disponibilidad y opciones cuando el canal esté configurado.</p>
          </div>
          <WhatsappButton label="Escríbenos por WhatsApp" />
        </div>
      </section>
    </>
  );
}
