import type { CategorySlug, ProductCustomerDetails } from "@/types/product";

type PublicProductDetailsSource = ProductCustomerDetails & { category: CategorySlug };

export type PublicProductDetail = {
  key: keyof ProductCustomerDetails;
  label: string;
  value: string;
};

function cleanValue(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned || null;
}

export function getPublicProductDetails(product: PublicProductDetailsSource): PublicProductDetail[] {
  const candidates = product.category === "skincare"
    ? [
        { key: "presentation" as const, label: "Presentación", value: product.presentation },
        { key: "quantityOrVolume" as const, label: "Cantidad o volumen", value: product.quantityOrVolume },
      ]
    : [
        { key: "material" as const, label: "Material", value: product.material },
        { key: "finish" as const, label: "Color o acabado", value: product.finish },
        {
          key: "measurements" as const,
          label: product.category === "manillas-oro" ? "Dimensiones" : "Medidas",
          value: product.measurements,
        },
      ];

  return candidates.flatMap((detail) => {
    const value = cleanValue(detail.value);
    return value ? [{ ...detail, value }] : [];
  });
}

export function pickCustomerDetails(product: PublicProductDetailsSource): ProductCustomerDetails {
  return Object.fromEntries(
    getPublicProductDetails(product).map(({ key, value }) => [key, value]),
  ) as ProductCustomerDetails;
}
