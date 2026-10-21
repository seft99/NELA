export function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidWhatsappNumber(value: string) {
  const normalized = normalizeWhatsappNumber(value);
  return /^\d{8,15}$/.test(normalized);
}

export function createWhatsappUrl(number: string, productName?: string, productUrl?: string) {
  const normalized = normalizeWhatsappNumber(number);
  if (!isValidWhatsappNumber(normalized)) return null;

  const message = productName
    ? `Hola, estoy interesada en el producto ${productName} de NELA Joyería. ¿Me puedes dar más información?${productUrl ? ` ${productUrl}` : ""}`
    : "Hola, quisiera recibir asesoría para elegir un producto de NELA Joyería.";

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
