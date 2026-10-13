import Link from "next/link";

export default function NotFound() {
  return (
    <section className="simple-page page-shell" id="contenido">
      <p className="eyebrow">404 · Página no encontrada</p>
      <h1>Este detalle no está aquí.</h1>
      <p>Puede que la referencia haya cambiado o ya no esté visible en el catálogo.</p>
      <Link href="/" className="button button-primary">Volver al inicio</Link>
    </section>
  );
}
