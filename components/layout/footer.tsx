import Image from "next/image";
import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { createWhatsappUrl } from "@/lib/whatsapp";

type FooterVariant = "light" | "dark";

export function Footer({ variant = "dark" }: { variant?: FooterVariant }) {
  const year = new Date().getFullYear();
  const whatsappUrl = createWhatsappUrl(siteConfig.contact.whatsappNumber);

  return (
    <footer className={`site-footer site-footer-${variant}`}>
      <div className="footer-grid page-shell">
        <div className="footer-brand">
          <Image
            src="/images/branding/nela-wordmark.png"
            alt="NELA Joyería"
            width={2172}
            height={724}
            sizes="(max-width: 560px) 170px, 200px"
          />
          <p>Accesorios de plata ley 925 elegidos con intención para acompañar tu estilo.</p>
        </div>
        <nav className="footer-navigation" aria-label="Información de NELA">
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/politica-de-privacidad">Privacidad y datos personales</Link>
        </nav>
        <div className="footer-contact">
          <p className="footer-title">Conversemos</p>
          <div className="social-row">
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp al ${siteConfig.contact.whatsappDisplay} (abre en una pestaña nueva)`}>
                <MessageCircle size={24} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ) : null}
            {siteConfig.contact.instagramUrl ? (
              <a href={siteConfig.contact.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${siteConfig.contact.instagramHandle} (abre en una pestaña nueva)`}>
                <Camera size={23} strokeWidth={1.6} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          {!siteConfig.contact.instagramUrl && !siteConfig.contact.whatsappNumber ? (
            <p className="config-note">Canales pendientes por configurar.</p>
          ) : null}
        </div>
      </div>
      <div className="footer-bottom page-shell">
        <span>© {year} NELA Joyería Colombia · Catálogo digital</span>
      </div>
    </footer>
  );
}
