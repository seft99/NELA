import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preguntas frecuentes", description: "Preguntas frecuentes de NELA Joyería, contenido pendiente de validación." };

const placeholders = [
  { question: "¿Cómo consulto la disponibilidad de un producto?", answer: "Puedes consultar la disponibilidad y las opciones de cada referencia mediante el botón oficial de WhatsApp." },
  { question: "¿Qué medios de pago están disponibles?", answer: "Política pendiente de suministrar y validar por NELA Joyería antes de la publicación comercial." },
  { question: "¿Cómo funcionan los envíos?", answer: "Política de cobertura, tiempos y costos pendiente de suministrar por la marca." },
  { question: "¿Puedo solicitar cambios?", answer: "La política oficial de cambios aún no ha sido suministrada. No se muestran promesas ni condiciones ficticias." },
];

export default function FaqPage() {
  return (
    <section className="simple-page faq-page page-shell" id="contenido">
      <p className="eyebrow">Información útil</p>
      <h1>Preguntas frecuentes</h1>
      <p className="simple-lead">Contenido provisional para completar cuando estén disponibles las políticas oficiales.</p>
      <div className="faq-list">
        {placeholders.map((item) => (
          <details key={item.question}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
