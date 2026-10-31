"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 820px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const revealGroups = [
  { root: ".home-collections", items: ".home-collections-heading, .home-collections-grid" },
  { root: ".favorites-editorial", items: ".favorites-editorial-intro, .favorite-product-media, .favorites-mobile-carousel" },
  { root: ".brand-essence", items: ".brand-essence-copy, .brand-essence-media" },
  { root: ".contact-invitation", items: ".contact-invitation-copy, .contact-invitation-action" },
  { root: ".category-editorial-hero", items: ".category-editorial-copy, .category-editorial-visual" },
  { root: ".category-hero", items: ".category-hero-copy, .category-hero-image" },
  { root: ".catalog-explorer-shell", items: ".catalog-explorer-heading" },
  { root: ".product-detail-lower", items: ".product-detail-tabs, .product-recommendations" },
] as const;

export function MobileMotionController() {
  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let observer: IntersectionObserver | null = null;

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
      document.querySelectorAll<HTMLElement>("[data-nela-mobile-reveal]").forEach((element) => {
        element.removeAttribute("data-nela-mobile-reveal");
        element.style.removeProperty("--nela-mobile-reveal-delay");
      });
    };

    const initialize = () => {
      cleanup();
      if (!mobile.matches || reducedMotion.matches) return;

      observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.nelaMobileReveal = "visible";
          currentObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -5%", threshold: 0.1 });

      revealGroups.forEach((group) => {
        document.querySelectorAll<HTMLElement>(group.root).forEach((root) => {
          root.querySelectorAll<HTMLElement>(group.items).forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
              item.dataset.nelaMobileReveal = "visible";
              return;
            }
            item.dataset.nelaMobileReveal = "pending";
            item.style.setProperty("--nela-mobile-reveal-delay", `${Math.min(index, 3) * 40}ms`);
            observer?.observe(item);
          });
        });
      });
    };

    initialize();
    mobile.addEventListener("change", initialize);
    reducedMotion.addEventListener("change", initialize);
    return () => {
      mobile.removeEventListener("change", initialize);
      reducedMotion.removeEventListener("change", initialize);
      cleanup();
    };
  }, []);

  return null;
}
