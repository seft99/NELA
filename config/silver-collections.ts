import type { JewelryType, Product } from "@/types/product";

export const silverCollections = [
  {
    slug: "anillos",
    label: "Anillos",
    description: "Anillos de líneas delicadas para llevar solos o combinar en tu propio estilo.",
    image: "/images/store/anillo-floral.png",
    imageAlt: "Anillo floral de plata ley 925 sobre una composición en tonos marfil",
    heroImages: [
      { src: "/images/store/anillo-floral.png", alt: "Anillo floral de plata ley 925" },
      { src: "/images/store/anillo-destello.png", alt: "Anillo Destello de plata ley 925 con piedras blancas" },
      { src: "/images/store/anillo-aura.png", alt: "Anillo Aura de plata ley 925 con piedras blancas" },
    ],
    jewelryTypes: ["anillo"],
  },
  {
    slug: "aretes-y-topos",
    label: "Aretes y topos",
    description: "Aretes, argollas y topos para acompañar desde lo cotidiano hasta una ocasión especial.",
    image: "/images/store/argollas-entrelazadas.png",
    imageAlt: "Argollas de plata ley 925 entrelazadas sobre fondo neutro",
    heroImages: [
      { src: "/images/store/argollas-entrelazadas.png", alt: "Argollas entrelazadas de plata ley 925" },
      { src: "/images/store/topos-aurora.png", alt: "Topos Aurora Cristalina de plata ley 925" },
      { src: "/images/store/topos-destello-verde.png", alt: "Topos Destello de plata ley 925 con circón verde" },
    ],
    jewelryTypes: ["arete", "topo", "argolla"],
  },
  {
    slug: "cadenas",
    label: "Cadenas",
    description: "Cadenas de plata ley 925 para usar solas, combinar en capas o acompañar tus dijes favoritos.",
    image: "/images/store/cadena-venecia.png",
    imageAlt: "Cadena de plata ley 925 estilo venecia sobre una composición neutra",
    heroImages: [
      { src: "/images/store/cadena-venecia.png", alt: "Cadena Venecia de plata ley 925" },
      { src: "/images/store/cadena-lazo.png", alt: "Cadena Lazo de plata ley 925" },
      { src: "/images/store/cadena-rosario.png", alt: "Cadena Rosario de plata ley 925" },
    ],
    jewelryTypes: ["cadena"],
  },
  {
    slug: "dijes",
    label: "Dijes",
    description: "Dijes con formas y detalles que aportan un significado personal a cada combinación.",
    image: "/images/store/dije-floral.png",
    imageAlt: "Dije floral de plata ley 925 con piedras blancas sobre fondo neutro",
    heroImages: [
      { src: "/images/store/dije-floral.png", alt: "Dije floral de plata ley 925 con piedras blancas" },
      { src: "/images/store/dije-ala-celestial.png", alt: "Dije Ala Celestial de plata ley 925" },
      { src: "/images/store/dije-trebol-verde.png", alt: "Dije Trébol de plata ley 925 con circón verde" },
    ],
    jewelryTypes: ["dije"],
  },
  {
    slug: "pulseras",
    label: "Pulseras",
    description: "Pulseras de plata ley 925 para sumar un detalle sutil y luminoso a cada momento.",
    image: "/images/store/pulsera-floral-verde.png",
    imageAlt: "Pulsera de plata ley 925 con detalles florales y piedras verdes",
    heroImages: [
      { src: "/images/store/pulsera-floral-verde.png", alt: "Pulsera floral de plata ley 925 con piedras verdes" },
      { src: "/images/store/pulsera-floral-rosada.png", alt: "Pulsera Flor Aurora de plata ley 925 con piedras rosadas" },
    ],
    jewelryTypes: ["pulsera", "pulso"],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  description: string;
  image: string;
  imageAlt: string;
  heroImages: readonly { src: string; alt: string; position?: string }[];
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
