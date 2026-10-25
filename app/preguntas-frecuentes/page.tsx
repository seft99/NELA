import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre joyas, pedidos, pagos, envíos y atención de NELA Joyería.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default function FaqPage() {
  const faqItems = [
    {
      question: "¿Cómo puedo comprar una joya?",
      answer: <>Explora el catálogo, elige tu producto y utiliza el carrito o el botón de compra. El pedido y sus detalles se coordinan por WhatsApp; el pago no se procesa directamente en el sitio web.</>,
    },
    {
      question: "¿Cómo consulto la disponibilidad de un producto?",
      answer: <>El catálogo muestra la disponibilidad registrada para cada referencia. Antes de coordinar el pedido puedes solicitar la confirmación final por WhatsApp.</>,
    },
    {
      question: "¿Qué medios de pago aceptan?",
      answer: <>Los medios de pago disponibles se confirman por WhatsApp al coordinar la compra. NELA no procesa pagos directamente en este sitio web.</>,
    },
    {
      question: "¿Realizan envíos a toda Colombia?",
      answer: <>Sí, NELA coordina envíos a toda Colombia. El costo, el tiempo estimado y las condiciones aplicables se confirman por WhatsApp para cada pedido.</>,
    },
    {
      question: "¿Cómo puedo conocer mi talla de anillo?",
      answer: <>Las tallas disponibles aparecen en los detalles de los anillos que cuentan con esa opción. Si necesitas orientación antes de elegir, puedes solicitar ayuda por WhatsApp.</>,
    },
    {
      question: "¿Las joyas son de plata ley 925?",
      answer: <>El catálogo de NELA presenta joyas en plata ley 925. Consulta las especificaciones de cada producto para conocer su material y demás características registradas.</>,
    },
    {
      question: "¿Puedo solicitar cambios o devoluciones?",
      answer: <>Escríbenos por WhatsApp para revisar tu caso y la información de la compra. NELA atenderá las solicitudes conforme a la garantía legal y, cuando resulte aplicable, al derecho de retracto previsto por la normativa colombiana.</>,
    },
    {
      question: "¿Cómo puedo comunicarme con NELA?",
      answer: <>
        WhatsApp es el canal oficial de atención y coordinación de pedidos. Instagram ({siteConfig.contact.instagramHandle}) es el canal social oficial adicional; puedes acceder a ambos desde la <Link href="/contacto">página de Contacto</Link>.
      </>,
    },
  ];

  return (
    <section className="simple-page faq-page page-shell" id="contenido">
      <p className="eyebrow">Información útil</p>
      <h1>Preguntas frecuentes</h1>
      <p className="simple-lead">Resolvemos tus dudas sobre nuestras joyas, pedidos, pagos y envíos.</p>
      <div className="faq-list">
        {faqItems.map((item) => (
          <details key={item.question}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
