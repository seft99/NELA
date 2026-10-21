import Image from "next/image";
import Link from "next/link";
import type { Category, Product } from "@/types/product";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { ProductExplorer } from "@/components/products/product-explorer";

export function CategoryPage({
  category,
  products,
  catalogTitle = "Encuentra tu próximo detalle",
  catalogDescription = "Busca, filtra y ordena la colección para encontrar tu próximo detalle.",
}: {
  category: Category;
  products: Product[];
  catalogTitle?: string;
  catalogDescription?: string;
}) {
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
          </div>
        </div>
      </section>
      <section className="section page-shell">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Selección NELA</p>
            <h2>{catalogTitle}</h2>
          </div>
          <p>{catalogDescription}</p>
        </div>
        <ProductExplorer products={products} enableJewelryFilters={category.slug === "accesorios-plata"} />
      </section>
      <section className={`category-contact tone-${category.tone}`}>
        <div className="page-shell contact-inline">
          <div>
            <p className="eyebrow">Asesoría personalizada</p>
            <h2>¿Quieres conocer más detalles?</h2>
            <p>Conversemos por WhatsApp sobre disponibilidad, variantes y opciones.</p>
          </div>
          <WhatsappButton label="Escríbenos por WhatsApp" />
        </div>
      </section>
    </>
  );
}
