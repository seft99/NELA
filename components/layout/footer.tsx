import Image from "next/image";
import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { createWhatsappUrl } from "@/lib/whatsapp";

export function Footer() {
  const year = new Date().getFullYear();
  const whatsappUrl = createWhatsappUrl(siteConfig.contact.whatsappNumber);
  return (
    <footer className="site-footer">
      <div className="footer-grid page-shell">
        <div className="footer-brand">
          <Image src="/images/branding/nela-logo-transparent.png" alt="NELA Joyería" width={112} height={112} />
          <p>Accesorios de plata ley 925 elegidos con intención para acompañar tu estilo.</p>
        </div>
        <div>
          <p className="footer-title">Explorar</p>
          <Link href="/accesorios-plata">Catálogo Plata Ley 925</Link>
          <Link href="/#favoritos">Nuestros favoritos</Link>
          <Link href="/contacto">Asesoría personalizada</Link>
        </div>
        <div>
          <p className="footer-title">NELA</p>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/politica-de-privacidad">Privacidad y datos personales</Link>
        </div>
        <div>
          <p className="footer-title">Conversemos</p>
          <div className="social-row">
            {siteConfig.contact.instagramUrl ? (
              <a href={siteConfig.contact.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${siteConfig.contact.instagramHandle} (abre en una pestaña nueva)`}>
                <Camera size={18} aria-hidden="true" />
              </a>
            ) : null}
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp al ${siteConfig.contact.whatsappDisplay} (abre en una pestaña nueva)`}>
                <MessageCircle size={18} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          {!siteConfig.contact.instagramUrl && !siteConfig.contact.whatsappNumber ? (
            <p className="config-note">Canales pendientes por configurar.</p>
          ) : null}
        </div>
      </div>
      <div className="footer-bottom page-shell">
        <span>© {year} NELA Joyería</span>
        <span>Colombia · Catálogo digital</span>
      </div>
    </footer>
  );
}
