"use client";

import Image from "next/image";
import { ZoomIn, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ProductImage } from "@/types/product";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const active = images[activeIndex] || images[0];

  const openZoom = () => dialogRef.current?.showModal();
  const closeZoom = () => dialogRef.current?.close();

  return (
    <div className="product-gallery">
      <div className="product-gallery-stage">
        <span className="product-gallery-backdrop" aria-hidden="true" />
        <span className="product-gallery-editorial" aria-hidden="true">
          <i />
          Detalles que perduran
        </span>
        {active ? (
          <div className="product-main-image">
            <Image
              src={active.src}
              alt={active.alt}
              fill
              priority
              sizes="(max-width: 820px) calc(100vw - 32px), 54vw"
            />
            <button
              ref={zoomTriggerRef}
              className="product-zoom-trigger"
              type="button"
              onClick={openZoom}
              aria-label={`Ampliar fotografía de ${productName}`}
            >
              <ZoomIn size={20} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="product-main-image product-main-image--empty" role="img" aria-label={`Fotografía no disponible para ${productName}`}>
            <p>Fotografía temporalmente no disponible.</p>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="product-thumbnails" aria-label={`Galería de ${productName}`}>
          {images.map((image, index) => (
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

      {active ? (
        <dialog
          ref={dialogRef}
          className="product-lightbox"
          aria-label={`Vista ampliada de ${productName}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeZoom();
          }}
          onClose={() => zoomTriggerRef.current?.focus()}
        >
          <div className="product-lightbox-inner">
            <button className="product-lightbox-close" type="button" onClick={closeZoom} aria-label="Cerrar imagen ampliada">
              <X size={22} aria-hidden="true" />
            </button>
            <div className="product-lightbox-image">
              <Image src={active.src} alt={active.alt} fill sizes="96vw" />
            </div>
            <p>{productName}</p>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
