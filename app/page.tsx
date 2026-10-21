import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { StoreImageCarousel } from "@/components/home/store-image-carousel";
import { silverCollections } from "@/config/silver-collections";

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div id="contenido">
      <section className="home-hero">
        <div className="home-hero-image" aria-hidden="true">
          <Image src="/images/editorial/hero-nela-demo.png" alt="" fill priority sizes="100vw" />
        </div>
        <div className="page-shell home-hero-inner">
          <div className="hero-copy reveal">
            <p className="eyebrow">Accesorios de plata · Detalles</p>
            <h1>La belleza está<br />en los detalles.</h1>
            <p className="hero-description">
              Descubre accesorios de plata elegidos para acompañar tu estilo todos los días.
            </p>
            <div className="hero-actions">
              <Link href="/accesorios-plata#catalogo" className="button button-primary">Explorar catálogo <ArrowRight size={17} /></Link>
              <Link href="/nosotros" className="text-link">Conocer NELA</Link>
            </div>
          </div>
          <div className="hero-note">
            <span className="vertical-line" aria-hidden="true" />
            <p>Una boutique digital creada para descubrir con calma.</p>
          </div>
        </div>
        <Link href="#universo-plata" className="scroll-cue" aria-label="Conocer el universo de plata NELA">
          <ArrowDown size={18} />
        </Link>
      </section>

      <section className="intro-strip page-shell" aria-label="Introducción">
        <span>01</span>
        <p>Plata. Sutil. Atemporal.</p>
        <span className="intro-rule" />
        <Sparkles size={18} strokeWidth={1.3} />
      </section>

      <section className="silver-focus-section page-shell" id="universo-plata">
        <div className="silver-focus-grid">
          <div className="silver-focus-image image-reveal">
            <StoreImageCarousel />
            <span className="silver-focus-number">02</span>
          </div>
          <div className="silver-focus-copy">
            <p className="eyebrow">Una colección, muchas formas</p>
            <h2>Plata para acompañar cada versión de ti.</h2>
            <p>
              Encuentra piezas delicadas y contemporáneas para combinar, regalar y convertir en parte de tu estilo.
            </p>
            <ul className="silver-types" aria-label="Tipos de accesorios disponibles">
              {silverCollections.map((collection) => (
                <li key={collection.slug}>
                  <Link href={`/accesorios-plata/${collection.slug}`}>{collection.label}</Link>
                </li>
              ))}
            </ul>
            <Link href="/accesorios-plata#catalogo" className="button button-outline">
              Ver todos los accesorios <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section favorites-section" id="favoritos">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Selección de la boutique</p>
              <h2>Nuestros favoritos</h2>
            </div>
            <p>Una selección de accesorios de plata para descubrir los detalles que definen el universo NELA.</p>
          </div>
          <ProductGrid products={featuredProducts} />
          <div className="center-action">
            <Link href="/accesorios-plata" className="text-link">Explorar el catálogo</Link>
          </div>
        </div>
      </section>

      <section className="editorial-section page-shell">
        <div className="editorial-mark" aria-hidden="true">N</div>
        <div className="editorial-copy">
          <p className="eyebrow">La esencia NELA</p>
          <h2>Un universo de<br /><em>detalles especiales</em></h2>
          <p>
            NELA reúne accesorios de plata en una experiencia cálida, delicada y cercana. La historia oficial de la marca se incorporará aquí cuando esté disponible.
          </p>
          <Link href="/nosotros" className="text-link">Descubrir nuestra esencia</Link>
        </div>
        <div className="editorial-swatches" aria-label="Paleta NELA">
          <span style={{ background: "#ECEAE8" }} />
          <span style={{ background: "#D8C7CC" }} />
          <span style={{ background: "#CBC8C5" }} />
          <span style={{ background: "#8B6A4E" }} />
        </div>
      </section>

      <section className="contact-invitation page-shell">
        <p className="eyebrow">Estamos para acompañarte</p>
        <h2>¿Necesitas ayuda para elegir?</h2>
        <p>Estamos aquí para ayudarte a encontrar lo que buscas.</p>
        <WhatsappButton label="Escríbenos por WhatsApp" />
      </section>
    </div>
  );
}
