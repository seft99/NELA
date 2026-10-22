import type { StoreCarouselSlide } from "@/components/home/store-image-carousel";
import type { Product } from "@/types/product";

export function getProductCarouselSlides(
  products: readonly Product[],
  fallback: readonly StoreCarouselSlide[],
  limit = 6,
) {
  const seen = new Set<string>();
  const productSlides: StoreCarouselSlide[] = [];

  for (const product of products) {
    for (const image of product.images) {
      if (!image.src || seen.has(image.src)) continue;
      seen.add(image.src);
      productSlides.push({
        src: image.src,
        alt: image.alt || `${product.name} de NELA Joyería`,
      });
      if (productSlides.length >= limit) return productSlides;
    }
  }

  return productSlides.length >= 2 ? productSlides : fallback.slice(0, limit);
}
