"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/product";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const safeImages = images.length
    ? images
    : [{ src: "/images/editorial/hero-nela-demo.png", alt: `Marcador visual para ${productName}` }];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = safeImages[activeIndex] || safeImages[0];

  return (
    <div className="product-gallery">
      <div className="product-main-image">
        <Image src={active.src} alt={active.alt} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
      </div>
      {safeImages.length > 1 ? (
        <div className="product-thumbnails" aria-label="Seleccionar imagen">
          {safeImages.map((image, index) => (
            <button
              type="button"
              key={`${image.src}-${index}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-pressed={index === activeIndex}
            >
              <Image src={image.src} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
