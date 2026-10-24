"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { Header } from "./header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TopNavigationScrollManager } from "@/components/navigation/top-navigation-link";

export function SiteFrame({
  children,
  productNavigation,
}: {
  children: ReactNode;
  productNavigation: Record<string, string>;
}) {
  const pathname = usePathname();
  const usesIndependentLayout = pathname.startsWith("/admin") || pathname.startsWith("/studio");
  const footerVariant = pathname === "/" ? "light" : "dark";

  if (usesIndependentLayout) return children;

  return (
    <>
      <TopNavigationScrollManager />
      <AnnouncementBar />
      <Header productNavigation={productNavigation} />
      <main>{children}</main>
      <Footer variant={footerVariant} />
      <CartDrawer />
    </>
  );
}
