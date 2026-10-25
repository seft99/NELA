import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce la propuesta visual y la esencia de NELA Joyería.",
  alternates: { canonical: "/nosotros" },
};

export default function AboutPage() {
  return (
    <div id="contenido">
      <section className="inner-hero page-shell">
        <div>
          <p className="eyebrow">La esencia NELA</p>
          <h1>Detalles para acompañar tu propia manera de brillar.</h1>
        </div>
        <p>
          NELA Joyería reúne accesorios de plata ley 925 en una experiencia cálida, femenina y cercana. Este texto es una introducción editorial y no pretende reemplazar la historia oficial de la marca.
        </p>
      </section>
      <section className="about-grid page-shell">
        <div className="about-image">
          <Image src="/images/editorial/hero-nela-demo.png" alt="Composición neutra con una cadena de plata ley 925 de NELA" fill sizes="(max-width: 850px) 100vw, 55vw" />
        </div>
        <div className="about-copy">
          <span className="large-index">01</span>
          <h2>Una identidad suave, una selección con intención.</h2>
          <p>
            La experiencia NELA está diseñada para dar espacio a cada pieza: tonos cálidos, composiciones serenas y asesoría directa cuando necesites acompañamiento.
          </p>
          <p className="config-note">Pendiente: incorporar aquí la historia, propósito y valores oficiales suministrados por la marca.</p>
          <Link href="/contacto" className="text-link">Conversemos</Link>
        </div>
      </section>
    </div>
  );
}
