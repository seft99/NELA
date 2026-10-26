"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/config/navigation";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "@/components/cart/cart-icon";
import { TopNavigationLink } from "@/components/navigation/top-navigation-link";
import { GlobalProductSearch } from "@/components/search/global-product-search";
import type { SearchCatalogProduct } from "@/lib/products/search";

export function Header({
  productNavigation,
  searchCatalog,
}: {
  productNavigation: Record<string, string>;
  searchCatalog: SearchCatalogProduct[];
}) {
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
            <TopNavigationLink
              key={item.href}
              href={item.href}
              className={isCurrent(item.href) ? "is-active" : undefined}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {item.label}
            </TopNavigationLink>
          ))}
        </nav>
        <div className="header-actions">
          <GlobalProductSearch products={searchCatalog} />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
