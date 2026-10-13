import type { Metadata } from "next";
import { Camera, Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { WhatsappButton } from "@/components/ui/whatsapp-button";

export const metadata: Metadata = { title: "Contacto", description: "Canales de atención de NELA Joyería." };

export default function ContactPage() {
  return (
    <section className="simple-page contact-page page-shell" id="contenido">
      <p className="eyebrow">Atención personalizada</p>
      <h1>Hablemos de ese detalle que estás buscando.</h1>
      <p className="simple-lead">Cuando los canales oficiales estén configurados, podrás contactarnos directamente desde aquí.</p>
      <div className="contact-options">
        <article>
          <MessageCircle size={23} />
          <h2>WhatsApp</h2>
          <p>Consultas sobre productos, disponibilidad y opciones.</p>
          <WhatsappButton label="Iniciar conversación" className="text-link" />
        </article>
        <article>
          <Camera size={23} />
          <h2>Instagram</h2>
          <p>Novedades e inspiración desde el perfil oficial.</p>
          {siteConfig.contact.instagramUrl ? <a className="text-link" href={siteConfig.contact.instagramUrl} target="_blank" rel="noreferrer">Visitar Instagram</a> : <span className="config-note">Enlace pendiente</span>}
        </article>
        <article>
          <Mail size={23} />
          <h2>Correo</h2>
          <p>Un canal tranquilo para solicitudes generales.</p>
          {siteConfig.contact.email ? <a className="text-link" href={`mailto:${siteConfig.contact.email}`}>Enviar correo</a> : <span className="config-note">Correo pendiente</span>}
        </article>
      </div>
      <p className="form-note">No incluimos un formulario porque aún no existe un servicio de entrega de mensajes configurado.</p>
    </section>
  );
}
