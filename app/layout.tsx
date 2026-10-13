import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { SiteFrame } from "@/components/layout/site-frame";

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
  icons: { icon: "/images/branding/nela-logo.png", shortcut: "/images/branding/nela-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
