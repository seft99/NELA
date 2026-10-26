"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { Header } from "./header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TopNavigationScrollManager } from "@/components/navigation/top-navigation-link";
import type { SearchCatalogProduct } from "@/lib/products/search";

export function SiteFrame({
  children,
  productNavigation,
  searchCatalog,
}: {
  children: ReactNode;
  productNavigation: Record<string, string>;
  searchCatalog: SearchCatalogProduct[];
}) {
  const pathname = usePathname();
  const usesIndependentLayout = pathname.startsWith("/admin") || pathname.startsWith("/studio");
  const footerVariant = pathname === "/" ? "light" : "dark";

  if (usesIndependentLayout) return children;

  return (
    <>
      <TopNavigationScrollManager />
      <AnnouncementBar />
      <Header productNavigation={productNavigation} searchCatalog={searchCatalog} />
      <main>{children}</main>
      <Footer variant={footerVariant} />
      <CartDrawer />
    </>
  );
}
