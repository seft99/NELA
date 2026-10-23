import Link from "next/link";

export function WhatsappPrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`whatsapp-privacy-note ${className}`.trim()}>
      Las compras se coordinan por WhatsApp. Consulta cómo tratamos tus datos en nuestra <Link href="/politica-de-privacidad">política de privacidad</Link>.
    </p>
  );
}
