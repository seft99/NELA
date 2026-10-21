import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="not-found-page page-shell" id="contenido" aria-labelledby="not-found-title">
      <span className="not-found-code" aria-hidden="true">404</span>
      <div className="not-found-copy">
        <p className="eyebrow">Página no encontrada</p>
        <h1 id="not-found-title">Este detalle no está aquí.</h1>
        <p>
          Es posible que la página haya cambiado de dirección o que la referencia ya no esté
          disponible. Puedes volver al inicio y continuar explorando NELA.
        </p>
        <Link href="/" className="button button-primary">
          <Home size={17} aria-hidden="true" /> Volver al inicio
        </Link>
      </div>
    </section>
  );
}
