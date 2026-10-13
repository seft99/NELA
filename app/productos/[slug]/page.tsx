import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { categories, demoProducts } from "@/data/demo-products";
import { formatCOP, siteConfig } from "@/config/site";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name, description: product.shortDescription };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const category = categories.find((item) => item.slug === product.category)!;
  const related = (await getProductsByCategory(product.category))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return (
    <div id="contenido">
      <div className="page-shell product-breadcrumb">
        <Link href={`/${category.slug}`}><ArrowLeft size={16} /> Volver a {category.name}</Link>
      </div>
      <section className="page-shell product-detail-grid">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="product-detail-copy">
          <p className="eyebrow">{category.name}</p>
          {product.isDemo ? <span className="demo-inline">Contenido de demostración</span> : null}
          <h1>{product.name}</h1>
          <p className="product-price">{formatCOP(product.price)}</p>
          <div className="product-status">
            {product.available ? <><Check size={17} /> Disponible para consulta</> : <><Clock3 size={17} /> No disponible por ahora</>}
          </div>
          <p className="product-short">{product.shortDescription}</p>
          <div className="product-description">
            <h2>Sobre esta referencia</h2>
            <p>{product.description}</p>
          </div>
          {product.available ? (
            <WhatsappButton
              productName={product.name}
              productUrl={`${siteConfig.url}/productos/${product.slug}`}
            />
          ) : (
            <span className="button button-disabled">Consulta no disponible</span>
          )}
          <p className="product-config-note">El botón se activa al configurar el número oficial de WhatsApp.</p>
        </div>
      </section>
      <section className="section page-shell related-section">
        <div className="section-heading split-heading">
          <div><p className="eyebrow">También te puede gustar</p><h2>Más de esta colección</h2></div>
        </div>
        <ProductGrid products={related} />
      </section>
    </div>
  );
}
