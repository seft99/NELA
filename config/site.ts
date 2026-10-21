export const siteConfig = {
  name: "NELA Joyería",
  shortName: "NELA",
  description:
    "Una selección delicada de accesorios de plata para acompañar tu estilo.",
  locale: "es_CO",
  currency: "COP",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nela-joyeria-boutique.lucky-bass-2428.chatgpt.site",
  announcement: {
    enabled: true,
    text: "Catálogo boutique · Atención personalizada",
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
