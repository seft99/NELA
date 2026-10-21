import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductInformation } from "@/components/products/product-information";
import { ProductPurchasePanel } from "@/components/cart/product-purchase-panel";
import { categories, demoProducts } from "@/data/demo-products";
import { formatCOP, siteConfig } from "@/config/site";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import {
  getAbsoluteProductUrl,
  getAbsolutePublicAssetUrl,
} from "@/lib/products/product-url";
import { getProductAvailability } from "@/lib/products/inventory";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  const productUrl = getAbsoluteProductUrl(siteConfig.url, product.slug);
  const image = product.images[0];
  const imageUrl = image ? getAbsolutePublicAssetUrl(siteConfig.url, image.src) : null;
  return {
    title: product.name,
    description: product.shortDescription,
    robots: product.isDemo ? { index: false, follow: true } : undefined,
    alternates: productUrl ? { canonical: productUrl } : undefined,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: "website",
      url: productUrl ?? undefined,
      images: imageUrl ? [{ url: imageUrl, alt: image.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const category = categories.find((item) => item.slug === product.category)!;
  const related = (await getProductsByCategory(product.category))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);
  const availability = getProductAvailability(product);
  const productUrl = getAbsoluteProductUrl(siteConfig.url, product.slug);
  const imageUrls = product.images.flatMap((image) => {
    const url = getAbsolutePublicAssetUrl(siteConfig.url, image.src);
    return url ? [url] : [];
  });
  const productJsonLd = !product.isDemo && productUrl
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription,
        image: imageUrls,
        sku: product.reference || undefined,
        category: category.name,
        brand: { "@type": "Brand", name: siteConfig.name },
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "COP",
          price: product.price,
          availability: availability.available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      }).replace(/</g, "\\u003c")
    : null;

  return (
    <div id="contenido">
      {productJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} /> : null}
      <div className="page-shell product-breadcrumb">
        <Link href={`/${category.slug}`}><ArrowLeft size={16} /> Volver a {category.name}</Link>
      </div>
      <section className="page-shell product-detail-grid">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="product-detail-copy">
          <p className="eyebrow">{category.name}</p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatCOP(product.price)}</p>
          {product.reference ? <p className="product-reference">Ref. {product.reference}</p> : null}
          <div className="product-status">
            {availability.available
              ? <><Check size={17} /> {availability.label}</>
              : <><Clock3 size={17} /> {availability.label}</>}
          </div>
          <p className="product-short">{product.shortDescription}</p>
          <div className="product-description">
            <h2>Sobre esta referencia</h2>
            <p>{product.description}</p>
          </div>
          <ProductInformation product={product} />
          <ProductPurchasePanel product={product} />
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
