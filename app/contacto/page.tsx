import type { Metadata } from "next";
import { Camera, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";

export const metadata: Metadata = { title: "Contacto", description: "Canales de atención de NELA Joyería." };

export default function ContactPage() {
  return (
    <section className="simple-page contact-page page-shell" id="contenido" aria-labelledby="contact-title">
      <p className="eyebrow">Atención personalizada</p>
      <h1 id="contact-title">Hablemos de ese detalle que estás buscando.</h1>
      <p className="simple-lead">Escríbenos por nuestros canales oficiales para consultar accesorios de plata, disponibilidad y pedidos.</p>
      <div className="contact-options">
        <article aria-labelledby="contact-whatsapp">
          <span className="contact-card-icon"><MessageCircle size={23} aria-hidden="true" /></span>
          <h2 id="contact-whatsapp">WhatsApp</h2>
          <p>Consultas sobre accesorios, disponibilidad y opciones.</p>
          <p className="contact-value">{siteConfig.contact.whatsappDisplay}</p>
          <WhatsappButton label="Iniciar conversación" className="text-link" />
        </article>
        <article aria-labelledby="contact-instagram">
          <span className="contact-card-icon"><Camera size={23} aria-hidden="true" /></span>
          <h2 id="contact-instagram">Instagram</h2>
          <p>Novedades e inspiración desde el perfil oficial.</p>
          <p className="contact-value">{siteConfig.contact.instagramHandle}</p>
          <a
            className="text-link"
            href={siteConfig.contact.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visitar ${siteConfig.contact.instagramHandle} en Instagram (abre en una pestaña nueva)`}
          >
            Visitar Instagram
          </a>
        </article>
      </div>
      <p className="form-note">Para pedidos, WhatsApp es el canal oficial de atención.</p>
      <WhatsappPrivacyNotice />
    </section>
  );
}
