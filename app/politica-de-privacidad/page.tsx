import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Borrador de política de tratamiento de datos",
  description: "Borrador informativo sobre privacidad y tratamiento de datos personales en NELA Joyería.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="simple-page legal-page page-shell" id="contenido">
      <p className="eyebrow">Privacidad y tratamiento de datos</p>
      <h1>Borrador para revisión de la responsable.</h1>
      <p className="simple-lead">
        Este documento describe el funcionamiento técnico comprobado del sitio al 18 de octubre de 2026. No es todavía una política definitiva ni una declaración de cumplimiento legal: faltan datos esenciales de identificación y decisiones internas de NELA Joyería.
      </p>

      <aside className="legal-status" aria-labelledby="legal-status-title">
        <h2 id="legal-status-title">Información pendiente antes de aprobar y publicar la política definitiva</h2>
        <ul>
          <li>Nombre completo o razón social de la persona responsable del tratamiento.</li>
          <li>Número de identificación o NIT y domicilio o dirección de notificaciones.</li>
          <li>Correo oficial para consultas y reclamos; el proyecto no contiene uno verificado.</li>
          <li>Plazos internos de conservación, eliminación y respuesta, además de responsables internos.</li>
          <li>Contratos, ubicaciones y configuraciones definitivas de los proveedores tecnológicos.</li>
        </ul>
      </aside>

      <div className="legal-content">
        <section>
          <h2>1. Responsable y canal provisional</h2>
          <p>
            La marca mostrada en el sitio es <strong>NELA Joyería</strong>. Su identidad legal no está documentada en el proyecto y debe completarse antes de adoptar este texto. Mientras se valida un correo oficial, el único canal de atención comprobado es WhatsApp en <strong>{siteConfig.contact.whatsappDisplay}</strong>. También está disponible el perfil de Instagram <strong>{siteConfig.contact.instagramHandle}</strong>, pero no se presenta como canal formal para consultas o reclamos de datos.
          </p>
        </section>

        <section>
          <h2>2. Qué ocurre actualmente en el sitio</h2>
          <p>
            El sitio funciona como catálogo digital. No contiene formularios públicos, registro de clientes, pagos en línea, suscripción publicitaria ni herramientas de analítica o publicidad configuradas en el código revisado. La selección del carrito se guarda en el navegador del visitante; el pedido se prepara y se envía únicamente cuando la persona decide abrir WhatsApp.
          </p>
          <div className="legal-table-wrap">
            <table>
              <thead><tr><th>Canal o función</th><th>Datos identificados</th><th>Finalidad y ubicación</th></tr></thead>
              <tbody>
                <tr><td>Navegación</td><td>Datos técnicos de la solicitud, como IP, navegador, fecha y ruta, que puede tratar la infraestructura de alojamiento.</td><td>Entregar y proteger técnicamente el sitio. El proyecto no define el plazo de los registros del proveedor.</td></tr>
                <tr><td>Carrito</td><td>Productos, variantes, cantidades y precios.</td><td>Se conservan en <code>localStorage</code> del dispositivo para mantener el carrito. NELA no recibe esa selección hasta que se envía por WhatsApp.</td></tr>
                <tr><td>Pedidos y consultas por WhatsApp</td><td>Detalle del pedido y los datos que la persona decida compartir en la conversación, por ejemplo nombre, teléfono, dirección o comprobantes.</td><td>Atender la consulta, confirmar disponibilidad, coordinar pago, envío y servicio posterior. La conversación ocurre en WhatsApp.</td></tr>
                <tr><td>Instagram</td><td>El sitio no recibe datos por mostrar el enlace. Al visitar o interactuar con el perfil, el tratamiento ocurre en Instagram.</td><td>Mostrar novedades y facilitar el acceso al perfil oficial.</td></tr>
                <tr><td>Panel administrativo</td><td>Identificador, correo y nombre de la cuenta autenticada, suministrados por el sistema de acceso de ChatGPT Sites.</td><td>Comprobar permisos del personal autorizado. No es una función disponible para clientes.</td></tr>
                <tr><td>Catálogo e inventario</td><td>Información de productos e inventario, sin datos de clientes.</td><td>Puede almacenarse en Sanity cuando esa integración esté configurada.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>3. Finalidades necesarias y publicidad</h2>
          <p>
            Los datos suministrados para una consulta o pedido deben usarse para responder, gestionar disponibilidad, coordinar la compra, entrega, pagos y garantías, prevenir abuso y cumplir obligaciones legales o contractuales aplicables. Entregar datos para un pedido <strong>no autoriza por sí solo</strong> el envío de publicidad.
          </p>
          <p>
            El sitio no solicita actualmente autorización de mercadeo. Si NELA incorpora mensajes promocionales, deberá pedir una autorización independiente, opcional, previa e informada, conservar evidencia consultable y permitir retirarla sin afectar la atención necesaria del pedido.
          </p>
        </section>

        <section>
          <h2>4. Proveedores y tratamiento internacional</h2>
          <p>
            Se identificaron la plataforma de alojamiento de Sites, WhatsApp e Instagram de Meta, la autenticación administrativa de ChatGPT Sites y la integración opcional con Sanity. Estos servicios pueden operar infraestructura fuera de Colombia o involucrar tratamiento internacional. Antes de adoptar la política definitiva, NELA debe verificar los proveedores efectivamente contratados, sus roles, ubicaciones, condiciones, transferencias o transmisiones y salvaguardas aplicables. Este borrador no presume esa configuración.
          </p>
        </section>

        <section>
          <h2>5. Derechos de las personas titulares</h2>
          <p>En los términos de la Ley 1581 de 2012, las personas pueden, según corresponda:</p>
          <ul>
            <li>Conocer, actualizar y rectificar sus datos.</li>
            <li>Solicitar prueba de la autorización, cuando esta sea exigible.</li>
            <li>Ser informadas sobre el uso dado a sus datos.</li>
            <li>Presentar consultas y reclamos, y acudir ante la Superintendencia de Industria y Comercio después de agotar el trámite correspondiente.</li>
            <li>Revocar la autorización o solicitar la supresión cuando proceda, sin desconocer obligaciones legales o contractuales de conservación.</li>
            <li>Acceder gratuitamente a sus datos personales objeto de tratamiento.</li>
          </ul>
        </section>

        <section>
          <h2>6. Procedimiento provisional para consultas y reclamos</h2>
          <p>
            Hasta que se confirme el correo de privacidad, la solicitud puede iniciarse por el WhatsApp oficial indicado arriba, con el asunto o primera línea “Datos personales”. Debe incluir una descripción clara de la petición, un medio para recibir respuesta y la información estrictamente necesaria para verificar la identidad o representación cuando corresponda. NELA deberá registrar la recepción, tramitar consultas y reclamos dentro de los términos legales y comunicar si necesita completar información.
          </p>
          <p>
            Este canal es provisional. La versión definitiva debe identificar la persona o área encargada y un medio estable para ejercer los derechos.
          </p>
        </section>

        <section>
          <h2>7. Conservación y eliminación</h2>
          <p>
            El carrito permanece en el navegador hasta que la persona quite los productos, borre los datos del sitio o el navegador los elimine. Las conversaciones y datos de pedidos deben conservarse solo durante el tiempo necesario para las finalidades informadas y las obligaciones legales o contractuales aplicables, y luego eliminarse, anonimizarse o bloquearse según corresponda. NELA aún debe aprobar plazos internos concretos; este borrador no los inventa.
          </p>
        </section>

        <section>
          <h2>8. Seguridad</h2>
          <p>
            El proyecto limita el panel de inventario a cuentas autorizadas, mantiene las credenciales de escritura en el servidor y valida los cambios de inventario. NELA debe complementar estas medidas con controles organizativos y contractuales acordes con sus operaciones. Ningún sistema puede prometer seguridad absoluta; los controles deben revisarse y ajustarse según los riesgos.
          </p>
        </section>

        <section>
          <h2>9. Cookies y almacenamiento local</h2>
          <p>
            En el código público revisado no se encontraron cookies publicitarias, píxeles ni analítica. Por esa razón no se añadió un banner decorativo. El carrito utiliza almacenamiento local estrictamente funcional. El acceso administrativo puede depender de cookies técnicas de autenticación gestionadas por la plataforma. Si se incorporan servicios opcionales que requieran consentimiento, deberán bloquearse hasta que exista una elección real y configurable.
          </p>
        </section>

        <section>
          <h2>10. Vigencia, cambios y referencias</h2>
          <p>
            Borrador preparado el 18 de octubre de 2026. La versión definitiva deberá indicar su fecha de entrada en vigencia. Los cambios materiales deben comunicarse por un medio razonable antes de aplicar nuevas finalidades que requieran autorización.
          </p>
          <p>
            Referencias oficiales consultadas: <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981" target="_blank" rel="noopener noreferrer">Ley 1581 de 2012</a>, la <a href="https://sedeelectronica.sic.gov.co/politica-de-tratamiento-de-datos-personales" target="_blank" rel="noopener noreferrer">orientación y política publicada por la SIC</a> y el <a href="https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/el-silencio-las-casillas-premarcadas-por-defecto-y-la-inaccion-no-constituyen-el-consentimiento-conforme-con" target="_blank" rel="noopener noreferrer">criterio de la SIC sobre autorizaciones y casillas premarcadas</a>.
          </p>
        </section>
      </div>

      <p className="legal-back"><Link className="text-link" href="/contacto">Volver a contacto</Link></p>
    </article>
  );
}
