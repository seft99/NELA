import { getPublicProductDetails } from "@/lib/products/public-details";
import { jewelryAudienceLabels, jewelryTypeLabels } from "@/lib/products/catalog-filters";
import type { Product } from "@/types/product";

export function ProductInformation({ product }: { product: Product }) {
  const attributes = product.category === "accesorios-plata" ? product.catalogAttributes : undefined;
  const catalogDetails = [
    attributes?.audience ? { key: "audience", label: "Público", value: jewelryAudienceLabels[attributes.audience] } : null,
    attributes?.jewelryType ? { key: "jewelryType", label: "Tipo de joya", value: jewelryTypeLabels[attributes.jewelryType] } : null,
    attributes?.ringSizes?.length ? { key: "ringSizes", label: "Tallas disponibles", value: attributes.ringSizes.join(", ") } : null,
    attributes?.lengths?.length ? { key: "lengths", label: "Largos disponibles", value: attributes.lengths.join(", ") } : null,
    attributes?.weaveType?.trim() ? { key: "weaveType", label: "Tipo de tejido", value: attributes.weaveType.trim() } : null,
    attributes?.motif?.trim() ? { key: "motif", label: "Motivo o diseño", value: attributes.motif.trim() } : null,
    attributes?.stone?.trim() ? { key: "stone", label: "Piedra", value: attributes.stone.trim() } : null,
    typeof attributes?.hasStone === "boolean" ? { key: "hasStone", label: "Detalle con piedra", value: attributes.hasStone ? "Sí" : "No" } : null,
  ].filter((detail): detail is { key: string; label: string; value: string } => detail !== null);
  const details = [...getPublicProductDetails(product), ...catalogDetails];
  if (!details.length) return null;

  return (
    <section className="product-information" aria-labelledby="product-information-title">
      <h2 id="product-information-title">Detalles del producto</h2>
      <dl>
        {details.map((detail) => (
          <div key={detail.key}>
            <dt>{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
