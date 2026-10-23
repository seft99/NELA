import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { SiteFrame } from "@/components/layout/site-frame";
import { CartProvider } from "@/context/cart-context";
import { getProducts } from "@/lib/products";
import { getSilverCollectionForJewelryType } from "@/config/silver-collections";

// The global cart reconciles against live inventory on every request.
export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "NELA Joyería · Detalles que acompañan tu estilo",
    template: "%s · NELA Joyería",
  },
  description: siteConfig.description,
  openGraph: {
    title: "NELA Joyería",
    description: siteConfig.description,
    locale: siteConfig.locale,
    type: "website",
    images: [{ url: "/images/editorial/hero-nela-demo.png", alt: "Composición editorial NELA Joyería" }],
  },
  icons: { icon: "/images/branding/nela-logo-transparent.png", shortcut: "/images/branding/nela-logo-transparent.png" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getProducts();
  const productNavigation = Object.fromEntries(catalog.flatMap((product) => {
    if (product.category !== "accesorios-plata") return [];
    const collection = getSilverCollectionForJewelryType(product.catalogAttributes?.jewelryType);
    return collection ? [[product.slug, `/accesorios-plata/${collection.slug}`]] : [];
  }));
  const organizationJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/branding/nela-logo-transparent.png`,
    sameAs: [siteConfig.contact.instagramUrl],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contact.whatsappDisplay,
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
  }).replace(/</g, "\\u003c");
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <CartProvider
          catalog={catalog}
          whatsappNumber={siteConfig.contact.whatsappNumber}
          siteUrl={siteConfig.url}
        >
          <SiteFrame productNavigation={productNavigation}>{children}</SiteFrame>
        </CartProvider>
      </body>
    </html>
  );
}
