import { Gem, Palette, Ruler, Sparkles } from "lucide-react";
import { getProductDisplayDetails } from "@/lib/products/display-details";
import type { Product } from "@/types/product";

export function ProductInformation({ product }: { product: Product }) {
  const details = getProductDisplayDetails(product).slice(0, 4);
  if (!details.length) return null;

  return (
    <section className="product-information" aria-label="Características principales">
      <dl className="product-feature-list">
        {details.map((detail) => {
          const Icon = detail.kind === "material"
            ? Gem
            : detail.kind === "size"
              ? Ruler
              : detail.kind === "finish"
                ? Palette
                : Sparkles;
          return (
            <div key={detail.key}>
              <Icon size={22} strokeWidth={1.45} aria-hidden="true" />
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
