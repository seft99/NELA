"use client";

import { ArrowUpRight, Camera, ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { mainNavigation, silverNavigationLinks } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { createWhatsappUrl } from "@/lib/whatsapp";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [layerTop, setLayerTop] = useState(72);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const whatsappUrl = createWhatsappUrl(siteConfig.contact.whatsappNumber);

  useEffect(() => {
    if (!open) return;

    const updateLayerTop = () => {
      const header = triggerRef.current?.closest("header");
      setLayerTop(Math.max(0, Math.round(header?.getBoundingClientRect().bottom ?? 72)));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.body.classList.add("mobile-menu-open");
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateLayerTop);
    window.addEventListener("orientationchange", updateLayerTop);
    updateLayerTop();
    const focusFrame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      document.body.classList.remove("mobile-menu-open");
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateLayerTop);
      window.removeEventListener("orientationchange", updateLayerTop);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="mobile-nav">
        <button
          ref={triggerRef}
          className={`icon-button mobile-nav-trigger${open ? " is-open" : ""}`}
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {open
        ? createPortal(
        <div className="mobile-nav-layer" style={{ top: layerTop }}>
          <button
            className="mobile-nav-backdrop"
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />
          <aside
            ref={panelRef}
            className="mobile-nav-panel"
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
          >
            <div className="mobile-nav-heading">
              <span className="mobile-nav-eyebrow">Explora NELA</span>
              <p id="mobile-navigation-title">Plata para cada momento.</p>
            </div>

            <nav aria-label="Navegación móvil">
              {mainNavigation.map((item, index) => item.href === "/accesorios-plata" ? (
                <details className={`mobile-catalog-menu${isCurrent(item.href) ? " is-active" : ""}`} key={item.href} open={isCurrent(item.href) || undefined}>
                  <summary>
                    <span className="mobile-nav-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                    <ChevronDown className="mobile-nav-arrow" size={17} aria-hidden="true" />
                  </summary>
                  <div className="mobile-catalog-links">
                    {silverNavigationLinks.map((link) => (
                      <Link key={link.href} href={link.href} className={pathname === link.href ? "is-active" : undefined} onClick={closeMenu}>
                        {link.label} <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-link${isCurrent(item.href) ? " is-active" : ""}`}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onClick={closeMenu}
                >
                  <span className="mobile-nav-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mobile-nav-label">{item.label}</span>
                  <ArrowUpRight className="mobile-nav-arrow" size={17} aria-hidden="true" />
                </Link>
              ))}
            </nav>

            <div className="mobile-nav-footer">
              <p>Atención personalizada</p>
              <div className="mobile-nav-socials">
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} aria-hidden="true" />
                    WhatsApp
                  </a>
                ) : null}
                {siteConfig.contact.instagramUrl ? (
                  <a href={siteConfig.contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Camera size={16} aria-hidden="true" />
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
