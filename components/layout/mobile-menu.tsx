"use client";

import { ArrowUpRight, ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { mainNavigation, silverNavigationLinks } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { createWhatsappUrl } from "@/lib/whatsapp";

export function MobileMenu({ productNavigation }: { productNavigation: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [layerTop, setLayerTop] = useState(72);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const pathname = usePathname();
  const productSlug = pathname.startsWith("/productos/")
    ? decodeURIComponent(pathname.slice("/productos/".length).split("/")[0] ?? "")
    : "";
  const activeProductCollection = productSlug ? productNavigation[productSlug] : undefined;
  const whatsappUrl = createWhatsappUrl(siteConfig.contact.whatsappNumber);
  const isCatalogCurrent = pathname === "/accesorios-plata"
    || pathname.startsWith("/accesorios-plata/")
    || activeProductCollection?.startsWith("/accesorios-plata") === true;

  const openMenu = useCallback(() => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    setRendered(true);
    setCatalogOpen(isCatalogCurrent);
    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = window.requestAnimationFrame(() => setOpen(true));
    });
  }, [isCatalogCurrent]);

  const closeMenu = useCallback(() => {
    if (openFrameRef.current !== null) window.cancelAnimationFrame(openFrameRef.current);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimerRef.current = window.setTimeout(() => setRendered(false), reducedMotion ? 0 : 280);
  }, []);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    if (openFrameRef.current !== null) window.cancelAnimationFrame(openFrameRef.current);
  }, []);

  useEffect(() => {
    if (!rendered) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    const updateLayerTop = () => {
      if (window.innerWidth > 1100) {
        closeMenu();
        return;
      }
      const header = triggerRef.current?.closest("header");
      setLayerTop(Math.max(0, Math.round(header?.getBoundingClientRect().bottom ?? 72)));
    };

    body.classList.add("mobile-menu-open");
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    window.addEventListener("resize", updateLayerTop);
    window.addEventListener("orientationchange", updateLayerTop);
    updateLayerTop();

    return () => {
      body.classList.remove("mobile-menu-open");
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      window.removeEventListener("resize", updateLayerTop);
      window.removeEventListener("orientationchange", updateLayerTop);
      window.scrollTo(0, scrollY);
    };
  }, [closeMenu, rendered]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        const panelFocusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const focusable = [...(panelFocusable ?? []), ...(triggerRef.current ? [triggerRef.current] : [])];
        if (!focusable.length) return;
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

    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [closeMenu, open]);

  const isCurrent = (href: string) => href === "/"
    ? pathname === "/"
    : href === activeProductCollection || pathname === href || pathname.startsWith(`${href}/`);
  const isCatalogLinkCurrent = (href: string) => href === "/accesorios-plata"
    ? pathname === href
    : href === activeProductCollection || pathname === href || pathname.startsWith(`${href}/`);

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
          onClick={open ? closeMenu : openMenu}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {rendered
        ? createPortal(
        <div
          className={`mobile-nav-layer${open ? " is-open" : ""}`}
          style={{ "--mobile-nav-top": `${layerTop}px` } as React.CSSProperties}
        >
          <button
            className="mobile-nav-backdrop"
            type="button"
            tabIndex={-1}
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
            aria-hidden={!open}
          >
            <div className="mobile-nav-heading">
              <span className="mobile-nav-eyebrow">Explora NELA</span>
              <p id="mobile-navigation-title">Plata ley 925 para cada momento.</p>
            </div>

            <nav aria-label="Navegación móvil">
              {mainNavigation.map((item, index) => item.href === "/accesorios-plata" ? (
                <details
                  className={`mobile-catalog-menu${isCurrent(item.href) ? " is-active" : ""}`}
                  key={item.href}
                  open={catalogOpen}
                  onToggle={(event) => setCatalogOpen(event.currentTarget.open)}
                >
                  <summary aria-expanded={catalogOpen} aria-controls="mobile-catalog-links">
                    <span className="mobile-nav-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                    <ChevronDown className="mobile-nav-arrow" size={17} aria-hidden="true" />
                  </summary>
                  <div className="mobile-catalog-links" id="mobile-catalog-links">
                    {silverNavigationLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={isCatalogLinkCurrent(link.href) ? "is-active" : undefined}
                        aria-current={isCatalogLinkCurrent(link.href) ? "page" : undefined}
                        onClick={closeMenu}
                      >
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
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escribir a NELA por WhatsApp (abre en una pestaña nueva)"
                    onClick={closeMenu}
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    WhatsApp
                  </a>
                ) : null}
                {siteConfig.contact.instagramUrl ? (
                  <a
                    href={siteConfig.contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visitar ${siteConfig.contact.instagramHandle} en Instagram (abre en una pestaña nueva)`}
                    onClick={closeMenu}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                    </svg>
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
