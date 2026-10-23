import type { JewelryType, Product } from "@/types/product";

export const silverCollections = [
  {
    slug: "anillos",
    label: "Anillos",
    description: "Anillos de plata ley 925 para acompañar tu estilo cada día.",
    catalogDescription: "Encuentra tu talla y descubre el anillo ideal para ti.",
    image: "/images/store/anillo-floral.png",
    imageAlt: "Anillo floral de plata ley 925 sobre una composición en tonos marfil",
    heroImages: [
      { src: "/images/store/anillo-floral.png", alt: "Anillo floral de plata ley 925" },
      { src: "/images/store/anillo-destello.png", alt: "Anillo Destello de plata ley 925 con piedras blancas" },
      { src: "/images/store/anillo-aura.png", alt: "Anillo Aura de plata ley 925 con piedras blancas" },
    ],
    homeImageReference: "NELA-AN-004",
    homeImageIndex: 0,
    jewelryTypes: ["anillo"],
  },
  {
    slug: "aretes-y-topos",
    label: "Aretes y topos",
    description: "Aretes, argollas y topos para acompañar desde lo cotidiano hasta una ocasión especial.",
    catalogDescription: "Descubre pequeños detalles para complementar tu estilo.",
    image: "/images/store/argollas-entrelazadas.png",
    imageAlt: "Argollas de plata ley 925 entrelazadas sobre fondo neutro",
    heroImages: [
      { src: "/images/store/argollas-entrelazadas.png", alt: "Argollas entrelazadas de plata ley 925" },
      { src: "/images/store/topos-aurora.png", alt: "Topos Aurora Cristalina de plata ley 925" },
      { src: "/images/store/topos-destello-verde.png", alt: "Topos Destello de plata ley 925 con circón verde" },
    ],
    homeImageReference: "NELA-AR-001",
    homeImageIndex: 0,
    jewelryTypes: ["arete", "topo", "argolla"],
  },
  {
    slug: "cadenas",
    label: "Cadenas",
    description: "Cadenas de plata ley 925 para usar solas, combinar en capas o acompañar tus dijes favoritos.",
    catalogDescription: "Encuentra la cadena que mejor se adapte a tu estilo.",
    image: "/images/store/cadena-venecia.png",
    imageAlt: "Cadena de plata ley 925 estilo venecia sobre una composición neutra",
    heroImages: [
      { src: "/images/store/cadena-venecia.png", alt: "Cadena Venecia de plata ley 925" },
      { src: "/images/store/cadena-lazo.png", alt: "Cadena Lazo de plata ley 925" },
      { src: "/images/store/cadena-rosario.png", alt: "Cadena Rosario de plata ley 925" },
    ],
    homeImageReference: "NELA-CA-001",
    homeImageIndex: 0,
    jewelryTypes: ["cadena"],
  },
  {
    slug: "dijes",
    label: "Dijes",
    description: "Dijes con formas y detalles que aportan un significado personal a cada combinación.",
    catalogDescription: "Explora detalles especiales para llevar contigo.",
    image: "/images/store/dije-floral.png",
    imageAlt: "Dije floral de plata ley 925 con piedras blancas sobre fondo neutro",
    heroImages: [
      { src: "/images/store/dije-floral.png", alt: "Dije floral de plata ley 925 con piedras blancas" },
      { src: "/images/store/dije-ala-celestial.png", alt: "Dije Ala Celestial de plata ley 925" },
      { src: "/images/store/dije-trebol-verde.png", alt: "Dije Trébol de plata ley 925 con circón verde" },
    ],
    homeImageReference: "NELA-DI-008",
    homeImageIndex: 0,
    jewelryTypes: ["dije"],
  },
  {
    slug: "pulseras",
    label: "Pulseras",
    description: "Pulseras de plata ley 925 para sumar un detalle sutil y luminoso a cada momento.",
    catalogDescription: "Descubre pulseras para acompañar cada momento.",
    image: "/images/store/pulsera-floral-verde.png",
    imageAlt: "Pulsera de plata ley 925 con detalles florales y piedras verdes",
    heroImages: [
      { src: "/images/store/pulsera-floral-verde.png", alt: "Pulsera floral de plata ley 925 con piedras verdes" },
      { src: "/images/store/pulsera-floral-rosada.png", alt: "Pulsera Flor Aurora de plata ley 925 con piedras rosadas" },
    ],
    homeImageReference: "NELA-PU-001",
    homeImageIndex: 0,
    jewelryTypes: ["pulsera", "pulso"],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  description: string;
  catalogDescription: string;
  image: string;
  imageAlt: string;
  heroImages: readonly { src: string; alt: string; position?: string }[];
  homeImageReference: string;
  homeImageIndex: number;
  jewelryTypes: readonly JewelryType[];
}>;

export type SilverCollectionSlug = (typeof silverCollections)[number]["slug"];
export type SilverCollection = (typeof silverCollections)[number];

export function getSilverCollection(slug: string) {
  return silverCollections.find((collection) => collection.slug === slug);
}

export function getSilverCollectionForJewelryType(type?: JewelryType) {
  return silverCollections.find((collection) => (
    type ? (collection.jewelryTypes as readonly JewelryType[]).includes(type) : false
  ));
}

export function belongsToSilverCollection(product: Product, collection: SilverCollection) {
  const type = product.catalogAttributes?.jewelryType;
  return type ? (collection.jewelryTypes as readonly JewelryType[]).includes(type) : false;
}
