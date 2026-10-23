import type { Product } from "@/types/product";

const greenStoneReplacements: Array<[RegExp, string]> = [
  [/\bUna piedra verde\b/g, "Un circón verde"],
  [/\buna piedra verde\b/g, "un circón verde"],
  [/\bLa piedra verde\b/g, "El circón verde"],
  [/\bla piedra verde\b/g, "el circón verde"],
  [/\bPiedras Verdes\b/g, "Circones Verdes"],
  [/\bPiedras verdes\b/g, "Circones verdes"],
  [/\bpiedras verdes\b/g, "circones verdes"],
  [/\bPiedra Verde\b/g, "Circón Verde"],
  [/\bPiedra verde\b/g, "Circón verde"],
  [/\bpiedra verde\b/g, "circón verde"],
];

export function clarifyGreenZirconCopy(value: string) {
  return greenStoneReplacements.reduce(
    (copy, [pattern, replacement]) => copy.replace(pattern, replacement),
    value,
  ).replace(
    /circones verdes como detalle principal, rodeadas/gi,
    (match) => match.replace(/rodeadas$/i, "rodeados"),
  );
}

export function normalizePublicProductCopy(product: Product): Product {
  return {
    ...product,
    name: clarifyGreenZirconCopy(product.name),
    shortDescription: clarifyGreenZirconCopy(product.shortDescription),
    description: clarifyGreenZirconCopy(product.description),
    images: product.images.map((image) => ({
      ...image,
      alt: clarifyGreenZirconCopy(image.alt),
    })),
    catalogAttributes: product.catalogAttributes
      ? {
          ...product.catalogAttributes,
          stone: product.catalogAttributes.stone
            ? /^\s*(?:piedra\s+)?verde\s*$/i.test(product.catalogAttributes.stone)
              ? "Circón verde"
              : clarifyGreenZirconCopy(product.catalogAttributes.stone)
            : undefined,
        }
      : undefined,
  };
}
