"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { Header } from "./header";
import { CartDrawer } from "@/components/cart/cart-drawer";

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
      <AnnouncementBar />
      <Header productNavigation={productNavigation} />
      <main>{children}</main>
      <Footer variant={footerVariant} />
      <CartDrawer />
    </>
  );
}
