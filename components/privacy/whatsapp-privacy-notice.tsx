import Link from "next/link";

export function WhatsappPrivacyNotice({
  className = "",
  legalOnly = false,
}: {
  className?: string;
  legalOnly?: boolean;
}) {
  return (
    <p className={`whatsapp-privacy-note ${className}`.trim()}>
      {legalOnly ? "Consulta cómo tratamos tus datos en nuestra " : "Las compras se coordinan por WhatsApp. Consulta cómo tratamos tus datos en nuestra "}
      <Link href="/politica-de-privacidad">política de privacidad</Link>.
    </p>
  );
}
