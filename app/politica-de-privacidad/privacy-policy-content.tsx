import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de privacidad y tratamiento de datos personales",
  description: "Política de privacidad y tratamiento de datos personales de NELA Joyería.",
  alternates: { canonical: "/politica-de-privacidad" },
  robots: { index: false, follow: true },
};

const lastUpdated = "24 de octubre de 2026";

export default function PrivacyPolicyContent() {
  const officialEmail = siteConfig.contact.email.trim();

  return (
    <article className="simple-page legal-page page-shell" id="contenido">
      <header className="legal-hero">
        <p className="eyebrow">Privacidad y tratamiento de datos</p>
        <h1>POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES</h1>
        <p className="simple-lead">
          Esta política explica cómo NELA Joyería trata los datos personales relacionados con la navegación, las consultas y la coordinación de pedidos en su catálogo digital de joyas en plata ley 925.
        </p>
        <p className="legal-version">Fecha de esta versión: {lastUpdated}.</p>
      </header>

      <aside className="legal-status" aria-labelledby="legal-status-title">
        <p className="legal-status-label">Estado de adopción</p>
        <h2 id="legal-status-title">Información que debe completarse antes de adoptar esta política como versión definitiva</h2>
        <p>
          El proyecto no contiene datos verificables y autorizados sobre la identidad legal de la persona natural responsable. Para no publicar información inventada, deben incorporarse:
        </p>
        <ul>
          <li>Nombre completo de la persona natural responsable del tratamiento.</li>
          <li>Número de identificación o NIT, si corresponde.</li>
          <li>Domicilio y dirección física para notificaciones.</li>
          {!officialEmail ? <li>Correo electrónico oficial para consultas y reclamos sobre datos personales.</li> : null}
          <li>Confirmación interna de los periodos de conservación y de la persona encargada de atender solicitudes.</li>
        </ul>
        <p>
          Hasta completar esa información, esta página describe de forma transparente el funcionamiento verificado del sitio, pero no debe presentarse como una política legal definitivamente adoptada.
        </p>
      </aside>

      <div className="legal-content">
        <section aria-labelledby="legal-responsable">
          <h2 id="legal-responsable">1. Responsable del tratamiento</h2>
          <p>
            <strong>NELA Joyería</strong> es la marca comercial utilizada en este sitio. La persona natural que opera la marca y decide sobre el tratamiento de los datos personales será la responsable del tratamiento. Su nombre, identificación, domicilio y dirección de notificaciones deben añadirse antes de la adopción formal de esta política.
          </p>
          <p>
            El canal público verificado de NELA es WhatsApp en <strong>{siteConfig.contact.whatsappDisplay}</strong>. {officialEmail ? <>El correo oficial para asuntos de datos personales es <a href={`mailto:${officialEmail}`}>{officialEmail}</a>.</> : <>Mientras se habilita un correo oficial de privacidad, las solicitudes pueden iniciarse por ese WhatsApp con la primera línea “Datos personales”.</>} El perfil <strong>{siteConfig.contact.instagramHandle}</strong> es un canal social y no sustituye el canal formal de consultas y reclamos.
          </p>
        </section>

        <section aria-labelledby="legal-data">
          <h2 id="legal-data">2. Datos que pueden tratarse</h2>
          <p>
            El sitio funciona como catálogo digital. No ofrece registro de clientes, formularios públicos, pagos en línea, suscripciones publicitarias ni herramientas propias de analítica o publicidad. Los tratamientos identificados en la implementación actual son los siguientes:
          </p>
          <div className="legal-table-wrap">
            <table>
              <thead>
                <tr><th>Canal o función</th><th>Datos que pueden intervenir</th><th>Cómo se utilizan</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Canal o función">Navegación</td>
                  <td data-label="Datos que pueden intervenir">Dirección IP, tipo de navegador, dispositivo, fecha, hora, ruta solicitada y otros registros técnicos que pueda generar la infraestructura de alojamiento.</td>
                  <td data-label="Cómo se utilizan">Entregar el sitio, mantener su disponibilidad, prevenir abuso y diagnosticar fallos técnicos.</td>
                </tr>
                <tr>
                  <td data-label="Canal o función">Carrito local</td>
                  <td data-label="Datos que pueden intervenir">Identificadores y nombres de productos, referencias, imágenes, variantes, cantidades, precios y datos públicos del producto.</td>
                  <td data-label="Cómo se utilizan">Mantener la selección en el dispositivo mediante <code>localStorage</code>. NELA no recibe el carrito mientras la persona no envíe el mensaje por WhatsApp.</td>
                </tr>
                <tr>
                  <td data-label="Canal o función">WhatsApp</td>
                  <td data-label="Datos que pueden intervenir">Número de teléfono, nombre o perfil visible, detalle del pedido y cualquier dato que la persona decida compartir, como dirección de entrega o comprobantes.</td>
                  <td data-label="Cómo se utilizan">Responder consultas, confirmar disponibilidad, coordinar compra, pago, envío, cambios, garantías y atención posterior.</td>
                </tr>
                <tr>
                  <td data-label="Canal o función">Instagram</td>
                  <td data-label="Datos que pueden intervenir">El sitio solo contiene un enlace al perfil. Las interacciones realizadas dentro de Instagram son tratadas por esa plataforma y, cuando corresponda, por NELA al responder.</td>
                  <td data-label="Cómo se utilizan">Facilitar el acceso al perfil oficial y atender interacciones iniciadas voluntariamente en la red social.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Sanity contiene información de catálogo e inventario, no una base de datos de clientes. El mensaje de WhatsApp se genera con datos del producto y del carrito; abrir el enlace no envía el mensaje ni confirma una compra. La persona debe pulsar “Enviar” dentro de WhatsApp.
          </p>
        </section>

        <section aria-labelledby="legal-purposes">
          <h2 id="legal-purposes">3. Finalidades del tratamiento</h2>
          <p>Los datos personales recibidos por NELA podrán utilizarse únicamente para:</p>
          <ul>
            <li>Atender consultas sobre productos, disponibilidad, precios, variantes y pedidos.</li>
            <li>Coordinar la compra, el medio de pago acordado por conversación, la entrega y el servicio posterior.</li>
            <li>Gestionar solicitudes, cambios, garantías y obligaciones derivadas de la relación con el cliente.</li>
            <li>Prevenir fraude, abuso o incidentes de seguridad y proteger el funcionamiento del sitio.</li>
            <li>Cumplir obligaciones legales, contractuales, contables o requerimientos de autoridades competentes.</li>
          </ul>
          <p>
            NELA no utiliza actualmente los datos del pedido para publicidad automatizada. El suministro de datos para una consulta o compra <strong>no constituye por sí solo una autorización para enviar promociones</strong>. Si en el futuro se implementa mercadeo directo, deberá solicitarse una autorización separada, previa, expresa e informada, con una opción sencilla para retirarla.
          </p>
        </section>

        <section aria-labelledby="legal-authorization">
          <h2 id="legal-authorization">4. Autorización y principios aplicables</h2>
          <p>
            Cuando la ley exija autorización, esta deberá ser previa, expresa e informada y conservarse de forma que pueda consultarse posteriormente. Al enviar voluntariamente una consulta o pedido por WhatsApp, la persona autoriza el tratamiento de los datos que suministra para las finalidades necesarias descritas en esta política, sin extender esa autorización a finalidades incompatibles o publicitarias.
          </p>
          <p>
            El tratamiento se realizará conforme a los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad previstos en la Ley 1581 de 2012. NELA solicitará únicamente la información razonablemente necesaria para atender cada caso.
          </p>
        </section>

        <section aria-labelledby="legal-rights">
          <h2 id="legal-rights">5. Derechos de las personas titulares</h2>
          <p>La persona titular de los datos, sus causahabientes o representantes legitimados podrán:</p>
          <ul>
            <li>Conocer, actualizar y rectificar sus datos personales.</li>
            <li>Solicitar prueba de la autorización, salvo las excepciones legales.</li>
            <li>Ser informados sobre el uso dado a sus datos.</li>
            <li>Acceder gratuitamente a los datos personales objeto de tratamiento.</li>
            <li>Revocar la autorización o solicitar la supresión cuando proceda y no exista un deber legal o contractual de conservación.</li>
            <li>Presentar consultas y reclamos, y acudir ante la Superintendencia de Industria y Comercio después de agotar el trámite ante NELA.</li>
          </ul>
        </section>

        <section aria-labelledby="legal-requests">
          <h2 id="legal-requests">6. Consultas y reclamos</h2>
          <p>
            Las solicitudes podrán presentarse {officialEmail ? <>al correo <a href={`mailto:${officialEmail}`}>{officialEmail}</a></> : <>por el WhatsApp oficial <strong>{siteConfig.contact.whatsappDisplay}</strong></>}, indicando en la primera línea “Datos personales”. Deben incluir la identificación de la persona titular, una descripción clara de la consulta o reclamo, un medio para recibir respuesta y los documentos necesarios para acreditar identidad o representación. NELA solicitará solo la información indispensable para verificar la legitimación.
          </p>
          <h3>Consultas</h3>
          <p>
            Se atenderán en un término máximo de diez (10) días hábiles contados desde su recepción. Si no es posible responder dentro de ese plazo, se informarán los motivos de la demora y la nueva fecha de respuesta, que no podrá superar cinco (5) días hábiles adicionales.
          </p>
          <h3>Reclamos</h3>
          <p>
            Si el reclamo está incompleto, se requerirá su corrección dentro de los cinco (5) días siguientes a la recepción. Si transcurren dos (2) meses desde ese requerimiento sin que se complete, se entenderá desistido. Si quien recibe el reclamo no es competente, lo trasladará a quien corresponda dentro de los dos (2) días hábiles siguientes e informará a la persona interesada.
          </p>
          <p>
            El reclamo completo se atenderá en un término máximo de quince (15) días hábiles contados desde el día siguiente a su recepción. Si no es posible resolverlo dentro de ese plazo, se informarán los motivos y la nueva fecha de respuesta, que no podrá superar ocho (8) días hábiles adicionales. Antes de presentar una queja ante la Superintendencia de Industria y Comercio debe agotarse el trámite de consulta o reclamo ante NELA.
          </p>
        </section>

        <section aria-labelledby="legal-retention">
          <h2 id="legal-retention">7. Conservación, eliminación y seguridad</h2>
          <p>
            El carrito permanece en el almacenamiento local del navegador hasta que la persona retire sus productos, borre los datos del sitio o el navegador los elimine. NELA no puede borrar ese almacenamiento de forma remota.
          </p>
          <p>
            Los datos recibidos en conversaciones y pedidos se conservarán únicamente durante el tiempo necesario para atender la finalidad informada y cumplir obligaciones legales, contables, contractuales o de protección al consumidor. Cuando dejen de ser necesarios y no exista un deber de conservación, deberán eliminarse, anonimizarse o bloquearse según corresponda. Antes de adoptar esta política, NELA debe documentar sus periodos internos concretos de conservación.
          </p>
          <p>
            NELA aplicará medidas administrativas y técnicas razonables para prevenir pérdida, uso indebido, acceso no autorizado, alteración o divulgación. La implementación actual mantiene las credenciales de escritura de Sanity en el servidor, restringe las funciones administrativas y valida el inventario antes de iniciar una compra. Ningún sistema permite garantizar seguridad absoluta, por lo que las medidas deberán revisarse según los riesgos y cambios del servicio.
          </p>
        </section>

        <section aria-labelledby="legal-services">
          <h2 id="legal-services">8. Servicios externos</h2>
          <p>
            Para operar el sitio se verificaron los siguientes servicios. Cada proveedor puede tratar información técnica o datos enviados dentro de su plataforma conforme a sus propios términos:
          </p>
          <ul className="legal-provider-list">
            <li><strong>Vercel:</strong> alojamiento y entrega del sitio; puede generar registros técnicos de conexión y seguridad. <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Aviso de privacidad de Vercel</a>.</li>
            <li><strong>Sanity:</strong> gestión y distribución del catálogo, inventario e imágenes de productos. La implementación actual no guarda datos de clientes en Sanity. <a href="https://www.sanity.io/legal/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad de Sanity</a>.</li>
            <li><strong>WhatsApp:</strong> canal externo para consultas y pedidos. Cuando la persona envía el mensaje, sus datos y el contenido de la conversación son tratados dentro de WhatsApp y recibidos por NELA. <a href="https://www.whatsapp.com/legal/privacy-policies" target="_blank" rel="noopener noreferrer">Políticas de privacidad de WhatsApp</a>.</li>
            <li><strong>Instagram:</strong> enlace al perfil oficial y atención de interacciones iniciadas dentro de la red social. <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer">Política de privacidad de Instagram</a>.</li>
          </ul>
          <p>
            Estos proveedores pueden operar infraestructura fuera de Colombia, lo que puede implicar transmisiones o transferencias internacionales. Antes de la adopción formal de esta política, la responsable debe verificar las condiciones contractuales aplicables, los roles de cada proveedor y las salvaguardas exigidas por la normativa colombiana. El sitio no integra actualmente una pasarela de pago ni una base de datos propia de clientes.
          </p>
        </section>

        <section aria-labelledby="legal-storage">
          <h2 id="legal-storage">9. Cookies y almacenamiento local</h2>
          <p>
            En el código revisado no se encontraron herramientas de analítica, publicidad, píxeles de seguimiento ni cookies de mercadeo. Por esa razón, el sitio no muestra actualmente un banner de consentimiento para tecnologías opcionales que no utiliza.
          </p>
          <p>
            El carrito utiliza <code>localStorage</code> bajo la clave <code>nela-cart</code>. Esta tecnología es funcional y guarda en el dispositivo la selección de productos; no contiene nombre, teléfono, dirección ni datos de pago. La persona puede eliminarla al vaciar el carrito o borrar los datos del sitio en su navegador. Los servicios externos pueden aplicar sus propias cookies o tecnologías cuando se accede a sus dominios.
          </p>
          <p>
            Si NELA incorpora en el futuro analítica, publicidad u otra tecnología no necesaria que requiera consentimiento, deberá informar su finalidad e implementar una elección previa y efectiva antes de activarla.
          </p>
        </section>

        <section aria-labelledby="legal-special-data">
          <h2 id="legal-special-data">10. Menores de edad y datos sensibles</h2>
          <p>
            El sitio y la coordinación de pedidos no están dirigidos a niños, niñas o adolescentes. NELA no solicita deliberadamente datos de menores. Si excepcionalmente fuera necesario tratar esos datos, deberá respetarse su interés superior y sus derechos fundamentales, escuchar al menor según su madurez y obtener la autorización de su representante legal cuando corresponda.
          </p>
          <p>
            NELA no solicita datos sensibles para navegar o consultar productos. Las personas no deben enviar información sobre salud, biometría, origen étnico, orientación política, convicciones religiosas, vida sexual u otros datos sensibles que no sean necesarios. Cualquier tratamiento excepcional deberá cumplir las condiciones legales, informar su carácter facultativo y obtener autorización explícita cuando sea exigible.
          </p>
        </section>

        <section aria-labelledby="legal-validity">
          <h2 id="legal-validity">11. Vigencia, actualizaciones y contacto</h2>
          <p>
            Esta versión fue actualizada el {lastUpdated}. Entrará en vigencia como política formal cuando se incorporen los datos de identificación y contacto de la persona responsable y sea adoptada expresamente por quien administra NELA. Las modificaciones se publicarán en esta misma ruta. Si un cambio introduce una finalidad nueva que requiera autorización, se solicitará antes de iniciar ese tratamiento.
          </p>
          <p>
            Para preguntas sobre esta página o para iniciar una solicitud relacionada con datos personales, puede utilizarse {officialEmail ? <>el correo <a href={`mailto:${officialEmail}`}>{officialEmail}</a></> : <>el WhatsApp oficial <strong>{siteConfig.contact.whatsappDisplay}</strong></>} mientras se completa el canal formal indicado en el aviso inicial.
          </p>
          <p className="legal-references">
            Marco normativo consultado: <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981" target="_blank" rel="noopener noreferrer">Ley 1581 de 2012</a>, <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608" target="_blank" rel="noopener noreferrer">Decreto 1074 de 2015</a> y <a href="https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/politicas-de-tratamiento-de-datos-personales" target="_blank" rel="noopener noreferrer">orientación de la Superintendencia de Industria y Comercio</a> sobre el contenido mínimo de las políticas.
          </p>
        </section>
      </div>

      <p className="legal-back"><Link className="text-link" href="/contacto">Volver a contacto</Link></p>
    </article>
  );
}
