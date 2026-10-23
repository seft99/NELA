import { getPublicProductDetails } from "@/lib/products/public-details";
import type { Product } from "@/types/product";

export type ProductDisplayDetail = {
  key: string;
  label: string;
  value: string;
  kind: "material" | "size" | "finish" | "detail";
};

export function getProductDisplayDetails(product: Product): ProductDisplayDetail[] {
  const customerDetails = getPublicProductDetails(product).map((detail) => ({
    ...detail,
    key: String(detail.key),
    kind: detail.key === "material"
      ? "material" as const
      : detail.key === "finish"
        ? "finish" as const
        : detail.key === "measurements"
          ? "size" as const
          : "detail" as const,
  }));
  const attributes = product.category === "accesorios-plata" ? product.catalogAttributes : undefined;
  const mentionsGreenZircon = /(?:circón verde|circones verdes)/i.test(
    `${product.name} ${product.shortDescription} ${product.description}`,
  );
  const catalogDetails: Array<ProductDisplayDetail | null> = [
    attributes?.ringSizes?.length
      ? {
          key: "ringSizes",
          label: attributes.ringSizes.length === 1 ? "Talla" : "Tallas",
          value: attributes.ringSizes.join(", "),
          kind: "size",
        }
      : null,
    attributes?.lengths?.length
      ? {
          key: "lengths",
          label: attributes.lengths.length === 1 ? "Longitud" : "Longitudes",
          value: attributes.lengths.join(", "),
          kind: "size",
        }
      : null,
    attributes?.weaveType?.trim()
      ? { key: "weaveType", label: "Tejido", value: attributes.weaveType.trim(), kind: "detail" }
      : null,
    attributes?.motif?.trim()
      ? { key: "motif", label: "Diseño", value: attributes.motif.trim(), kind: "detail" }
      : null,
    attributes?.stone?.trim()
      ? { key: "stone", label: "Piedra", value: attributes.stone.trim(), kind: "detail" }
      : null,
    attributes?.hasStone === true && !attributes.stone?.trim()
      ? {
          key: "hasStone",
          label: "Detalle",
          value: mentionsGreenZircon ? "Con circón verde" : "Con piedra",
          kind: "detail",
        }
      : null,
  ];

  return [...customerDetails, ...catalogDetails.filter((detail): detail is ProductDisplayDetail => detail !== null)];
}
