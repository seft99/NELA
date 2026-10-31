"use client";

import { useEffect } from "react";

const DESKTOP_QUERY = "(min-width: 821px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const revealGroups = [
  { root: ".home-collections", items: ".home-collection-item", delay: 60 },
  { root: ".favorites-editorial", items: ".favorites-editorial-intro, .favorite-product-card", delay: 70 },
] as const;

export function DesktopMotionController() {
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let observer: IntersectionObserver | null = null;
    let parallaxFrame = 0;
    let essenceSection: HTMLElement | null = null;

    const updateParallax = () => {
      parallaxFrame = 0;
      if (!essenceSection) return;
      const rect = essenceSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      if (rect.bottom < -viewportHeight * 0.15 || rect.top > viewportHeight * 1.15) return;
      const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      essenceSection.style.setProperty("--nela-essence-progress", progress.toFixed(4));
    };

    const scheduleParallax = () => {
      if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
    };

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
      window.cancelAnimationFrame(parallaxFrame);
      window.removeEventListener("scroll", scheduleParallax);
      document.querySelectorAll<HTMLElement>("[data-nela-reveal]").forEach((element) => {
        element.removeAttribute("data-nela-reveal");
        element.style.removeProperty("--nela-reveal-delay");
      });
      essenceSection?.style.removeProperty("--nela-essence-progress");
      essenceSection = null;
    };

    const initialize = () => {
      cleanup();
      if (!desktop.matches || reducedMotion.matches) return;

      observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.nelaReveal = "visible";
          currentObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.12 });

      revealGroups.forEach((group) => {
        document.querySelectorAll<HTMLElement>(group.root).forEach((root) => {
          root.querySelectorAll<HTMLElement>(group.items).forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
              item.dataset.nelaReveal = "visible";
              return;
            }
            item.dataset.nelaReveal = "pending";
            item.style.setProperty("--nela-reveal-delay", `${index * group.delay}ms`);
            observer?.observe(item);
          });
        });
      });

      essenceSection = document.querySelector<HTMLElement>(".brand-essence");
      if (essenceSection) {
        window.addEventListener("scroll", scheduleParallax, { passive: true });
        scheduleParallax();
      }
    };

    initialize();
    desktop.addEventListener("change", initialize);
    reducedMotion.addEventListener("change", initialize);
    return () => {
      desktop.removeEventListener("change", initialize);
      reducedMotion.removeEventListener("change", initialize);
      cleanup();
    };
  }, []);

  return null;
}
