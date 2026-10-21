import Link from "next/link";

export function WhatsappPrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`whatsapp-privacy-note ${className}`.trim()}>
      Las compras se coordinan por WhatsApp. Al continuar, saldrás de este sitio y la conversación será tratada en ese servicio. Consulta nuestro <Link href="/politica-de-privacidad">borrador de tratamiento de datos</Link>.
    </p>
  );
}
