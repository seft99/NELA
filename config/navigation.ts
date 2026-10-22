import { silverCollections } from "@/config/silver-collections";

export const silverNavigationLinks = [
  { href: "/accesorios-plata", label: "Ver catálogo completo" },
  ...silverCollections.map((collection) => ({
    href: `/accesorios-plata/${collection.slug}`,
    label: collection.label,
  })),
] as const;

export const mainNavigation = [
  { href: "/", label: "Inicio" },
  { href: "/accesorios-plata", label: "Catálogo Plata Ley 925" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;
