"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de renderizado en NELA.", error);
  }, [error]);

  return (
    <section className="not-found-page page-shell" id="contenido" aria-labelledby="error-title">
      <span className="not-found-code" aria-hidden="true">NELA</span>
      <div className="not-found-copy">
        <p className="eyebrow">Algo salió mal</p>
        <h1 id="error-title">No pudimos mostrar esta página.</h1>
        <p>Intenta cargarla de nuevo. Tu carrito permanece guardado en este dispositivo.</p>
        <button className="button button-primary" type="button" onClick={reset}>Intentar de nuevo</button>
      </div>
    </section>
  );
}
