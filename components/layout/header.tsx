"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { primaryNavigation } from "@/config/navigation";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "@/components/cart/cart-icon";

export function Header({ productNavigation }: { productNavigation: Record<string, string> }) {
  const pathname = usePathname();
  const productSlug = pathname.startsWith("/productos/")
    ? decodeURIComponent(pathname.slice("/productos/".length).split("/")[0] ?? "")
    : "";
  const activeProductCollection = productSlug ? productNavigation[productSlug] : undefined;
  const isCurrent = (href: string) => (
    href === activeProductCollection || pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <header className="site-header">
      <div className="header-inner">
        <MobileMenu productNavigation={productNavigation} />
        <Link
          href="/"
          className="brand-lockup"
          aria-label="NELA Joyería, inicio"
        >
          <Image
            src="/images/branding/nela-wordmark.png"
            alt="NELA Joyería"
            width={2172}
            height={724}
            sizes="(max-width: 1100px) 132px, 180px"
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {primaryNavigation.map((item) => (
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
          <Link href="/accesorios-plata#catalogo" className="icon-button header-search" aria-label="Buscar accesorios de plata ley 925">
            <Search size={19} />
          </Link>
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
