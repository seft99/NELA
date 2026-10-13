import Image from "next/image";
import Link from "next/link";
import { Camera, Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-grid page-shell">
        <div className="footer-brand">
          <Image src="/images/branding/nela-logo.png" alt="NELA Joyería" width={112} height={112} />
          <p>Detalles elegidos con intención para acompañar tu estilo.</p>
        </div>
        <div>
          <p className="footer-title">Colecciones</p>
          <Link href="/skincare">Skincare</Link>
          <Link href="/accesorios-plata">Accesorios de Plata</Link>
          <Link href="/manillas-oro">Manillas de Oro</Link>
        </div>
        <div>
          <p className="footer-title">NELA</p>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/politica-de-privacidad">Privacidad</Link>
        </div>
        <div>
          <p className="footer-title">Conversemos</p>
          <div className="social-row">
            {siteConfig.contact.instagramUrl ? (
              <a href={siteConfig.contact.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Camera size={18} />
              </a>
            ) : null}
            {siteConfig.contact.whatsappNumber ? (
              <a href="/contacto" aria-label="WhatsApp">
                <MessageCircle size={18} />
              </a>
            ) : null}
            {siteConfig.contact.email ? (
              <a href={`mailto:${siteConfig.contact.email}`} aria-label="Correo electrónico">
                <Mail size={18} />
              </a>
            ) : null}
          </div>
          {!siteConfig.contact.email && !siteConfig.contact.instagramUrl && !siteConfig.contact.whatsappNumber ? (
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
