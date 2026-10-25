import type { Metadata } from "next";
import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { WhatsappButton } from "@/components/ui/whatsapp-button";
import { WhatsappPrivacyNotice } from "@/components/privacy/whatsapp-privacy-notice";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Canales de atención de NELA Joyería.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <section className="simple-page contact-page page-shell" id="contenido" aria-labelledby="contact-title">
      <p className="eyebrow">Atención personalizada</p>
      <h1 id="contact-title">Hablemos de ese detalle que estás buscando.</h1>
      <p className="simple-lead contact-intro-description">
        <span className="contact-description-desktop">Escríbenos por nuestros canales oficiales para consultar accesorios de plata ley 925, disponibilidad y pedidos.</span>
        <span className="contact-description-mobile">Te ayudamos a elegir tus joyas, consultar disponibilidad y coordinar pedidos.</span>
      </p>
      <div className="contact-options">
        <article className="contact-channel-card contact-whatsapp-card" aria-labelledby="contact-whatsapp">
          <span className="contact-card-icon"><MessageCircle size={23} aria-hidden="true" /></span>
          <h2 id="contact-whatsapp">WhatsApp</h2>
          <p className="contact-card-description">
            <span className="contact-card-description-desktop">Consultas sobre accesorios, disponibilidad y opciones.</span>
            <span className="contact-card-description-mobile">Asesoría sobre joyas, disponibilidad y pedidos.</span>
          </p>
          <p className="contact-value">{siteConfig.contact.whatsappDisplay}</p>
          <WhatsappButton label="Iniciar conversación" className="text-link contact-whatsapp-cta" />
        </article>
        <article className="contact-channel-card contact-instagram-card" aria-labelledby="contact-instagram">
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
      <p className="form-note contact-desktop-notice">Para pedidos, WhatsApp es el canal oficial de atención.</p>
      <WhatsappPrivacyNotice className="contact-desktop-notice" />
      <p className="whatsapp-privacy-note contact-mobile-notice">
        WhatsApp es nuestro canal oficial para consultas y pedidos. Consulta nuestra <Link href="/politica-de-privacidad">política de privacidad</Link>.
      </p>
    </section>
  );
}
