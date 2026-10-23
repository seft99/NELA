export const OFFICIAL_SITE_URL = "https://nelajoyeria.vercel.app";

function resolveSiteUrl(value?: string) {
  if (!value) return OFFICIAL_SITE_URL;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:")
      || url.hostname.toLocaleLowerCase("en").endsWith(".chatgpt.site")
    ) return OFFICIAL_SITE_URL;
    return url.origin;
  } catch {
    return OFFICIAL_SITE_URL;
  }
}

export const siteConfig = {
  name: "NELA Joyería",
  shortName: "NELA",
  description:
    "Una selección delicada de accesorios de plata ley 925 para acompañar tu estilo.",
  locale: "es_CO",
  currency: "COP",
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  announcement: {
    enabled: true,
    items: [
      "Envíos a todo Colombia",
      "Pago seguro",
      "Atención personalizada",
    ],
  },
  contact: {
    whatsappNumber: "573156951945",
    whatsappDisplay: "+57 315 695 1945",
    instagramUrl: "https://www.instagram.com/nela_joyeria/",
    instagramHandle: "@nela_joyeria",
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "",
  },
} as const;

export const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
