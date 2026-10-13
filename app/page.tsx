import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { categories } from "@/data/demo-products";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { WhatsappButton } from "@/components/ui/whatsapp-button";

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  const gold = categories.find((category) => category.slug === "manillas-oro")!;

  return (
    <div id="contenido">
      <section className="home-hero">
        <div className="home-hero-image" aria-hidden="true">
          <Image src="/images/editorial/hero-nela-demo.png" alt="" fill priority sizes="100vw" />
        </div>
        <div className="page-shell home-hero-inner">
          <div className="hero-copy reveal">
            <p className="eyebrow">Joyería · Belleza · Detalles</p>
            <h1>La belleza está<br />en los detalles.</h1>
            <p className="hero-description">
              Descubre una selección de accesorios y productos de belleza para acompañar tu estilo.
            </p>
            <div className="hero-actions">
              <Link href="#colecciones" className="button button-primary">Explorar colecciones <ArrowRight size={17} /></Link>
              <Link href="/nosotros" className="text-link">Conocer NELA</Link>
            </div>
          </div>
          <div className="hero-note">
            <span className="vertical-line" aria-hidden="true" />
            <p>Una boutique digital creada para descubrir con calma.</p>
          </div>
        </div>
        <Link href="#colecciones" className="scroll-cue" aria-label="Ir a colecciones">
          <ArrowDown size={18} />
        </Link>
        <span className="demo-image-note hero-demo-note">Imagen editorial de demostración</span>
      </section>

      <section className="intro-strip page-shell" aria-label="Introducción">
        <span>01</span>
        <p>Suave. Femenina. Atemporal.</p>
        <span className="intro-rule" />
        <Sparkles size={18} strokeWidth={1.3} />
      </section>

      <section className="section page-shell" id="colecciones">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Tres maneras de expresar tu estilo</p>
          <h2>Colecciones para cada detalle</h2>
          <p>Una identidad común, tres atmósferas suaves y cuidadosamente diferenciadas.</p>
        </div>
        <div className="collection-grid">
          {categories.map((category, index) => (
            <article className={`collection-card tone-${category.tone}`} key={category.slug}>
              <div className="collection-image">
                <Image src={category.image} alt={category.imageAlt} fill sizes="(max-width: 850px) 100vw, 33vw" />
                <span className="collection-index">0{index + 1}</span>
                <span className="demo-image-note">Imagen demo</span>
              </div>
              <div className="collection-copy">
                <p>{category.eyebrow}</p>
                <h3>{category.name}</h3>
                <Link href={`/${category.slug}`}>Ver colección <ArrowRight size={16} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section favorites-section">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Selección de la boutique</p>
              <h2>Nuestros favoritos</h2>
            </div>
            <p>Referencias de demostración para mostrar la experiencia del catálogo antes de conectar el inventario real.</p>
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
            NELA reúne accesorios y productos de belleza en una experiencia cálida, delicada y cercana. La historia oficial de la marca se incorporará aquí cuando esté disponible.
          </p>
          <Link href="/nosotros" className="text-link">Descubrir nuestra esencia</Link>
        </div>
        <div className="editorial-swatches" aria-label="Paleta NELA">
          <span style={{ background: "#EBCFC8" }} />
          <span style={{ background: "#D8C7CC" }} />
          <span style={{ background: "#E8D7BE" }} />
          <span style={{ background: "#8B6A4E" }} />
        </div>
      </section>

      <section className="spotlight-section tone-gold">
        <div className="page-shell spotlight-grid">
          <div className="spotlight-image">
            <Image src={gold.image} alt={gold.imageAlt} fill sizes="(max-width: 900px) 100vw, 55vw" />
            <span className="demo-image-note">Imagen editorial de demostración</span>
          </div>
          <div className="spotlight-copy">
            <span className="spotlight-number">03</span>
            <p className="eyebrow">Colección destacada</p>
            <h2>El brillo cálido de un detalle sutil.</h2>
            <p>{gold.description}</p>
            <Link href="/manillas-oro" className="button button-outline">Ver Manillas de Oro <ArrowRight size={17} /></Link>
          </div>
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
