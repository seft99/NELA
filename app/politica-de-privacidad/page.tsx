import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad", robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return (
    <section className="simple-page legal-page page-shell" id="contenido">
      <p className="eyebrow">Documento pendiente</p>
      <h1>Política de privacidad</h1>
      <div className="legal-placeholder">
        <h2>Esta página no constituye una política legal.</h2>
        <p>
          Antes del lanzamiento público, NELA Joyería debe suministrar o validar una política de privacidad acorde con sus actividades, canales de contacto, herramientas de analítica y tratamiento de datos personales.
        </p>
        <p>
          La versión actual del sitio no incluye formularios, cuentas de usuario ni pagos en línea. La configuración futura de servicios externos debe reflejarse en el documento definitivo.
        </p>
      </div>
    </section>
  );
}
