"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { getProductDisplayDetails } from "@/lib/products/display-details";
import type { Product } from "@/types/product";

type DetailTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function ProductDetailTabs({ product }: { product: Product }) {
  const baseId = useId();
  const details = getProductDisplayDetails(product);
  const materialDetails = details.filter((detail) => detail.kind === "material" || detail.kind === "finish");
  const expandedDescription = product.description.trim() !== product.shortDescription.trim()
    ? product.description.trim()
    : "";
  const tabs: DetailTab[] = [
    {
      id: "details",
      label: "Descripción y detalles",
      content: (
        <div className="product-tab-copy">
          {expandedDescription ? <p>{expandedDescription}</p> : null}
          {details.length ? (
            <dl className="product-tab-details">
              {details.map((detail) => (
                <div key={detail.key}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {!expandedDescription && !details.length ? <p>No hay información ampliada disponible para esta referencia.</p> : null}
        </div>
      ),
    },
    ...(materialDetails.length
      ? [{
          id: "materials",
          label: "Materiales",
          content: (
            <div className="product-tab-copy">
              <p>Información confirmada para esta referencia:</p>
              <dl className="product-tab-details">
                {materialDetails.map((detail) => (
                  <div key={detail.key}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ),
        } satisfies DetailTab]
      : []),
    {
      id: "purchase",
      label: "Información de compra",
      content: (
        <div className="product-tab-copy">
          <p>La compra se coordina por WhatsApp. Allí confirmaremos la disponibilidad final, el valor del envío y los detalles del pedido.</p>
          <p>
            Consulta nuestras <Link href="/preguntas-frecuentes">preguntas frecuentes</Link> y la <Link href="/politica-de-privacidad">política de privacidad</Link>.
          </p>
        </div>
      ),
    },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tabs[activeIndex] ?? tabs[0];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = activeIndex;
    if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    document.getElementById(`${baseId}-tab-${tabs[nextIndex].id}`)?.focus();
  };

  return (
    <section className="product-detail-tabs" aria-label="Información ampliada del producto">
      <div className="product-tabs-list" role="tablist" aria-label="Información del producto">
        {tabs.map((tab, index) => (
          <button
            id={`${baseId}-tab-${tab.id}`}
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel-${active.id}`}
        className="product-tab-panel"
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
      >
        {active.content}
      </div>
    </section>
  );
}
