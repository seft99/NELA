import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getProducts } from "@/lib/products";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { StoreImageCarousel } from "@/components/home/store-image-carousel";
import { FavoritesEditorial } from "@/components/home/favorites-editorial";
import { BrandEssenceEditorial } from "@/components/home/brand-essence-editorial";
import { belongsToSilverCollection, silverCollections } from "@/config/silver-collections";
import { TopNavigationLink } from "@/components/navigation/top-navigation-link";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const products = await getProducts();
  const featuredProducts = products.filter((product) => product.featured);
  const homeCollections = silverCollections.map((collection) => {
    const eligibleProducts = products.filter((item) => (
      belongsToSilverCollection(item, collection) && item.images.some((image) => Boolean(image.src))
    ));
    const product = eligibleProducts.find((item) => item.reference === collection.homeImageReference)
      ?? eligibleProducts[0];
    const image = product?.images[collection.homeImageIndex]
      ?? product?.images.find((item) => Boolean(item.src));
    return { collection, image, productName: product?.name };
  });

  return (
    <div id="contenido">
      <section className="home-hero">
        <div className="home-hero-layout">
          <div className="home-hero-copy-panel">
            <div className="hero-copy reveal">
              <p className="eyebrow">Joyería que te acompaña</p>
              <h1>Detalles<br />que perduran</h1>
              <p className="hero-description">
                Piezas en plata ley 925, diseñadas para acompañar tus momentos más especiales y también los de todos los días.
              </p>
              <Link href="/accesorios-plata#catalogo" className="button home-hero-cta">
                Descubre la colección <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="home-hero-image">
            <StoreImageCarousel
              ariaLabel="Selección editorial NELA Joyería"
              priority
              signatureLines={["Belleza", "en cada", "historia"]}
              mobileTapNavigation
            />
          </div>
        </div>
      </section>

      <section className="home-collections page-shell" id="universo-plata" aria-labelledby="home-collections-title">
        <div className="home-collections-heading">
          <div>
            <span className="home-collections-line" aria-hidden="true" />
            <h2 id="home-collections-title">Nuestras colecciones</h2>
          </div>
          <Link href="/accesorios-plata#catalogo">Ver todas <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="home-collections-grid">
          {homeCollections.map(({ collection, image, productName }) => (
            <TopNavigationLink
              href={`/accesorios-plata/${collection.slug}`}
              className="home-collection-item"
              key={collection.slug}
            >
              <span className="home-collection-image">
                {image ? (
                  <Image
                    src={image.src}
                    alt={image.alt || `${productName || collection.label} de NELA Joyería`}
                    fill
                    sizes="(max-width: 560px) 42vw, (max-width: 1000px) 28vw, 190px"
                  />
                ) : (
                  <span className="home-collection-placeholder">Colección en preparación</span>
                )}
              </span>
              <h3>{collection.label}</h3>
              <span className="home-collection-link">
                Descubrir <ArrowRight size={13} aria-hidden="true" />
              </span>
            </TopNavigationLink>
          ))}
        </div>
      </section>

      <FavoritesEditorial products={featuredProducts} />

      <BrandEssenceEditorial products={products} />

      <section className="contact-invitation" aria-labelledby="contact-invitation-title">
        <div className="contact-invitation-grid page-shell">
          <div className="contact-invitation-copy">
            <p className="eyebrow">Estamos para acompañarte</p>
            <h2 id="contact-invitation-title">¿Necesitas ayuda para elegir?</h2>
            <p>Te ayudamos con tus dudas sobre productos, disponibilidad y pedidos.</p>
          </div>
          <div className="contact-invitation-action">
            <WhatsappButton label="Escríbenos por WhatsApp" className="button contact-invitation-button" />
            <p className="contact-invitation-note">
              <MessageCircle size={22} strokeWidth={1.5} aria-hidden="true" />
              Atención personalizada
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
