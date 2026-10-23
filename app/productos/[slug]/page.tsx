import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailTabs } from "@/components/products/product-detail-tabs";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInformation } from "@/components/products/product-information";
import { ProductRecommendations } from "@/components/products/product-recommendations";
import { ProductPurchasePanel } from "@/components/cart/product-purchase-panel";
import { categories } from "@/config/categories";
import { formatCOP, siteConfig } from "@/config/site";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import {
  getAbsoluteProductUrl,
  getAbsolutePublicAssetUrl,
} from "@/lib/products/product-url";
import { getProductAvailability } from "@/lib/products/inventory";
import { belongsToSilverCollection, getSilverCollectionForJewelryType } from "@/config/silver-collections";

type ProductPageProps = { params: Promise<{ slug: string }> };

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
  const silverCollection = product.category === "accesorios-plata"
    ? getSilverCollectionForJewelryType(product.catalogAttributes?.jewelryType)
    : undefined;
  const related = (await getProductsByCategory(product.category))
    .filter((item) => item.slug !== product.slug)
    .filter((item) => !silverCollection || belongsToSilverCollection(item, silverCollection))
    .sort((a, b) => (
      Number(b.available) - Number(a.available) ||
      a.displayOrder - b.displayOrder ||
      a.name.localeCompare(b.name, "es")
    ))
    .slice(0, 4);
  const availability = getProductAvailability(product);
  const categoryLabel = silverCollection?.label ?? category.name;
  const categoryHref = silverCollection ? `/accesorios-plata/${silverCollection.slug}` : `/${category.slug}`;
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
    <div id="contenido" className="product-detail-page">
      {productJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} /> : null}
      <nav className="page-shell product-breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li><Link href="/">Inicio</Link></li>
          <li><Link href={categoryHref}>{categoryLabel}</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>
      <section className="page-shell product-detail-grid">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="product-detail-copy">
          <p className="product-collection-label">
            <span>Colección NELA</span>
            <i aria-hidden="true">/</i>
            <span>{categoryLabel}</span>
            <b aria-hidden="true" />
          </p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatCOP(product.price)}</p>
          <div className="product-meta-row">
            {product.reference ? <span>Ref. {product.reference}</span> : null}
            {product.reference ? <i aria-hidden="true" /> : null}
            <span className={`product-status${availability.available ? " is-available" : " is-unavailable"}`}>
              <b aria-hidden="true" /> {availability.label}
            </span>
          </div>
          <p className="product-short">{product.shortDescription}</p>
          <ProductInformation product={product} />
          <ProductPurchasePanel product={product} />
        </div>
      </section>
      <section className={`page-shell product-detail-lower${related.length ? "" : " product-detail-lower--single"}`}>
        <ProductDetailTabs product={product} />
        <ProductRecommendations products={related} />
      </section>
    </div>
  );
}
