export const siteConfig = {
  name: "NELA Joyería",
  shortName: "NELA",
  description:
    "Una selección delicada de accesorios y productos de belleza para acompañar tu estilo.",
  locale: "es_CO",
  currency: "COP",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nela-joyeria-boutique.lucky-bass-2428.chatgpt.site",
  announcement: {
    enabled: true,
    text: "Catálogo boutique · Atención personalizada",
  },
  contact: {
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "",
  },
} as const;

export const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
