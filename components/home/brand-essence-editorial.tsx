import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { JewelryType, Product } from "@/types/product";

const MAIN_PRODUCT_REFERENCE = "NELA-CA-005";
const INSET_PRODUCT_REFERENCE = "NELA-AN-006";
const REUSED_HOME_REFERENCES = ["NELA-CA-001", "NELA-AN-004"];

const hasJewelryType = (product: Product, types: JewelryType[]) => (
  product.catalogAttributes?.jewelryType
    ? types.includes(product.catalogAttributes.jewelryType)
    : false
);

function findEditorialProduct(
  products: Product[],
  reference: string,
  types: JewelryType[],
  excludedId?: string,
) {
  const candidates = products.filter((product) => (
    product.id !== excludedId
    && Boolean(product.images[0]?.src)
    && !REUSED_HOME_REFERENCES.includes(product.reference ?? "")
  ));

  return candidates.find((product) => product.reference === reference)
    ?? candidates.find((product) => hasJewelryType(product, types));
}

export function BrandEssenceEditorial({ products }: { products: Product[] }) {
  const mainProduct = findEditorialProduct(products, MAIN_PRODUCT_REFERENCE, ["cadena", "collar"]);
  const insetProduct = findEditorialProduct(products, INSET_PRODUCT_REFERENCE, ["anillo"], mainProduct?.id);
  const mainImage = mainProduct?.images[0];
  const insetImage = insetProduct?.images[0];

  if (!mainImage) return null;

  return (
    <section className="brand-essence" id="esencia-nela" aria-labelledby="brand-essence-title">
      <div className="page-shell brand-essence-layout">
        <div className="brand-essence-copy">
          <div className="brand-essence-kicker">
            <span aria-hidden="true" />
            <p className="eyebrow">La esencia de NELA</p>
          </div>
          <h2 id="brand-essence-title">Más que joyas,<br />detalles que acompañan</h2>
          <p className="brand-essence-description">
            Piezas en plata ley 925 pensadas para acompañar tus momentos especiales y resaltar la belleza de lo esencial.
          </p>
          <Link href="/nosotros" className="button brand-essence-cta">
            Descubre NELA <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <div className="brand-essence-motto" aria-hidden="true">
            <span />
            <p>Belleza<br />en cada<br />historia</p>
          </div>
        </div>

        <div className="brand-essence-media">
          <figure className="brand-essence-main-image">
            <Image
              src={mainImage.src}
              alt={mainImage.alt || `${mainProduct?.name || "Cadena"} de NELA Joyería`}
              fill
              sizes="(max-width: 820px) calc(100vw - 32px), (max-width: 1100px) 58vw, 56vw"
            />
          </figure>

          {insetImage ? (
            <figure className="brand-essence-inset-image">
              <Image
                src={insetImage.src}
                alt={insetImage.alt || `${insetProduct?.name || "Anillo"} de NELA Joyería`}
                fill
                sizes="(max-width: 560px) 52vw, (max-width: 1100px) 28vw, 24vw"
              />
            </figure>
          ) : null}

          <p className="brand-essence-material" aria-hidden="true">
            <span /> Plata ley 925
          </p>
        </div>
      </div>
    </section>
  );
}
