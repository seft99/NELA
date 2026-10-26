"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";

type ScrollResetScope = "all" | "mobile" | null;

const mobileRouteMedia = "(max-width: 820px)";
let resetOnNextPathnameChange: ScrollResetScope = null;

export function prepareTopNavigationScrollReset(scope: Exclude<ScrollResetScope, null> = "all") {
  resetOnNextPathnameChange = scope;
}

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
  const cancelPendingReset = useRef<(() => void) | null>(null);

  const resetViewportToTop = useCallback(() => {
    cancelPendingReset.current?.();

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    let settleFrame = 0;
    let restored = false;
    const restoreBehavior = () => {
      if (restored) return;
      restored = true;
      root.style.scrollBehavior = previousScrollBehavior;
    };
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    root.style.scrollBehavior = "auto";
    root.getClientRects();
    resetScroll();
    const frame = window.requestAnimationFrame(() => {
      resetScroll();
      settleFrame = window.requestAnimationFrame(() => {
        resetScroll();
        restoreBehavior();
        cancelPendingReset.current = null;
      });
    });

    cancelPendingReset.current = () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(settleFrame);
      restoreBehavior();
    };
  }, []);

  useLayoutEffect(() => {
    if (!window.matchMedia(mobileRouteMedia).matches) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const handleInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const samePath = destination.pathname === window.location.pathname;
      const sameQuery = destination.search === window.location.search;

      // Keep intentional anchors within the current document. Links to the
      // current route itself (for example the logo while already on Inicio)
      // must still return to the page header.
      if (samePath && sameQuery && destination.hash) return;
      if (samePath) resetViewportToTop();
    };

    const handlePageShow = () => resetViewportToTop();
    document.addEventListener("click", handleInternalLink, true);
    window.addEventListener("pageshow", handlePageShow);
    resetViewportToTop();

    return () => {
      document.removeEventListener("click", handleInternalLink, true);
      window.removeEventListener("pageshow", handlePageShow);
      window.history.scrollRestoration = previousScrollRestoration;
      cancelPendingReset.current?.();
      cancelPendingReset.current = null;
    };
  }, [resetViewportToTop]);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const resetScope = resetOnNextPathnameChange;
    resetOnNextPathnameChange = null;
    const isMobile = window.matchMedia(mobileRouteMedia).matches;

    // Mobile route changes must always begin at the page header, regardless of
    // whether navigation came from the menu, footer, a CTA or a link with a
    // hash. Same-page hash navigation does not change `pathname`, so anchors
    // within the current page keep their native behavior.
    if (!isMobile && resetScope !== "all") return;

    resetViewportToTop();
  }, [pathname, resetViewportToTop]);

  return null;
}
