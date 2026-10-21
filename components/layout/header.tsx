"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { mainNavigation, silverNavigationLinks } from "@/config/navigation";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "@/components/cart/cart-icon";

export function Header() {
  const pathname = usePathname();
  const catalogMenuRef = useRef<HTMLDetailsElement>(null);
  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (catalogMenuRef.current?.open && !catalogMenuRef.current.contains(event.target as Node)) {
        catalogMenuRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <MobileMenu />
        <Link href="/" className="brand-lockup" aria-label="NELA Joyería, inicio">
          <Image
            src="/images/branding/nela-logo-transparent.png"
            alt="NELA Joyería"
            width={78}
            height={78}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {mainNavigation.map((item) => item.href === "/accesorios-plata" ? (
            <details
              ref={catalogMenuRef}
              className={`desktop-catalog-menu${isCurrent(item.href) ? " is-active" : ""}`}
              key={item.href}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  catalogMenuRef.current?.removeAttribute("open");
                  catalogMenuRef.current?.querySelector("summary")?.focus();
                }
              }}
            >
              <summary>
                {item.label} <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div className="desktop-catalog-panel">
                {silverNavigationLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={pathname === link.href ? "is-current" : undefined}
                    onClick={() => catalogMenuRef.current?.removeAttribute("open")}
                  >
                    {index === 0 ? <span>Todos</span> : <span>{String(index).padStart(2, "0")}</span>}
                    <strong>{link.label}</strong>
                  </Link>
                ))}
              </div>
            </details>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={isCurrent(item.href) ? "is-active" : undefined}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/accesorios-plata#catalogo" className="icon-button header-search" aria-label="Buscar accesorios de plata">
            <Search size={19} />
          </Link>
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
