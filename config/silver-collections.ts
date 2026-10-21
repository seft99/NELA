import type { JewelryType, Product } from "@/types/product";

export const silverCollections = [
  {
    slug: "anillos",
    label: "Anillos",
    description: "Anillos de líneas delicadas para llevar solos o combinar en tu propio estilo.",
    image: "/images/store/anillo-floral.png",
    imageAlt: "Anillo floral plateado sobre una composición en tonos marfil",
    jewelryTypes: ["anillo"],
  },
  {
    slug: "aretes-y-topos",
    label: "Aretes y topos",
    description: "Aretes, argollas y topos para acompañar desde lo cotidiano hasta una ocasión especial.",
    image: "/images/store/argollas-entrelazadas.png",
    imageAlt: "Argollas plateadas entrelazadas sobre fondo neutro",
    jewelryTypes: ["arete", "topo", "argolla"],
  },
  {
    slug: "cadenas",
    label: "Cadenas",
    description: "Cadenas plateadas para usar solas, combinar en capas o acompañar tus dijes favoritos.",
    image: "/images/store/cadena-venecia.png",
    imageAlt: "Cadena plateada estilo venecia sobre una composición neutra",
    jewelryTypes: ["cadena"],
  },
  {
    slug: "dijes",
    label: "Dijes",
    description: "Dijes con formas y detalles que aportan un significado personal a cada combinación.",
    image: "/images/store/dije-floral.png",
    imageAlt: "Dije floral plateado con piedras blancas sobre fondo neutro",
    jewelryTypes: ["dije"],
  },
  {
    slug: "pulseras",
    label: "Pulseras",
    description: "Pulseras plateadas para sumar un detalle sutil y luminoso a cada momento.",
    image: "/images/store/pulsera-floral-verde.png",
    imageAlt: "Pulsera plateada con detalles florales y piedras verdes",
    jewelryTypes: ["pulsera", "pulso"],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  description: string;
  image: string;
  imageAlt: string;
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
