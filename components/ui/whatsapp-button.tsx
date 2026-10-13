import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { createWhatsappUrl } from "@/lib/whatsapp";

type WhatsappButtonProps = {
  productName?: string;
  productUrl?: string;
  label?: string;
  className?: string;
};

export function WhatsappButton({
  productName,
  productUrl,
  label = "Consultar por WhatsApp",
  className = "button button-primary",
}: WhatsappButtonProps) {
  const href = createWhatsappUrl(siteConfig.contact.whatsappNumber, productName, productUrl);
  if (!href) {
    return (
      <span className={`${className} button-disabled`} aria-disabled="true" title="WhatsApp pendiente por configurar">
        <MessageCircle size={17} />
        WhatsApp próximamente
      </span>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <MessageCircle size={17} />
      {label}
    </a>
  );
}
