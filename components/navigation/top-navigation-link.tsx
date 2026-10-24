"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";

type ScrollResetScope = "all" | "mobile" | null;

let resetOnNextPathnameChange: ScrollResetScope = null;

export function TopNavigationLink({
  href,
  mobileOnly = false,
  onNavigate,
  scroll,
  ...props
}: ComponentProps<typeof Link> & { mobileOnly?: boolean }) {
  return (
    <Link
      {...props}
      href={href}
      scroll={scroll ?? true}
      onNavigate={(event) => {
        const targetPathname = typeof href === "string"
          ? new URL(href, window.location.href).pathname
          : href.pathname;
        resetOnNextPathnameChange = targetPathname && targetPathname !== window.location.pathname
          ? mobileOnly ? "mobile" : "all"
          : null;
        let prevented = false;
        onNavigate?.({
          preventDefault() {
            prevented = true;
            event.preventDefault();
          },
        });
        if (prevented) resetOnNextPathnameChange = null;
      }}
    />
  );
}

export function TopNavigationScrollManager() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const resetScope = resetOnNextPathnameChange;
    resetOnNextPathnameChange = null;
    if (!resetScope) return;
    if (resetScope === "mobile" && !window.matchMedia("(max-width: 560px)").matches) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.getClientRects();
    window.scrollTo(0, 0);

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [pathname]);

  return null;
}
