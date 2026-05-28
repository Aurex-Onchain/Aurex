"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ENTER = { opacity: 0, y: 12, filter: "blur(6px)" };
const REST = { opacity: 1, y: 0, filter: "blur(0px)" };
const EXIT = { opacity: 0, y: -8, filter: "blur(4px)" };
const EXIT_DURATION_MS = 200;
const NAVIGATE_EVENT = "aurex:navigate";

type DisplayedRoute = {
  pathname: string;
  children: React.ReactNode;
};

let cachedRoute: DisplayedRoute | null = null;
let delayedNavigationInFlight = false;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [displayedRoute, setDisplayedRoute] = useState<DisplayedRoute>(() => {
    if (!reduceMotion && !delayedNavigationInFlight && cachedRoute && cachedRoute.pathname !== pathname) {
      return cachedRoute;
    }
    return { pathname, children };
  });
  const [exiting, setExiting] = useState(false);
  const pendingRoute = useRef<DisplayedRoute | null>(null);
  const exitComplete = useRef(false);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!reduceMotion) cachedRoute = displayedRoute;
  }, [displayedRoute, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      pendingRoute.current = null;
      exitComplete.current = false;
      return;
    }

    let frame = 0;
    if (pathname !== displayedRoute.pathname) {
      pendingRoute.current = { pathname, children };
      frame = window.requestAnimationFrame(() => {
        const next = pendingRoute.current;
        if (!next) return;
        if (exiting && exitComplete.current) {
          pendingRoute.current = null;
          exitComplete.current = false;
          delayedNavigationInFlight = false;
          setDisplayedRoute(next);
          setExiting(false);
        } else {
          setExiting(true);
        }
      });
    } else if (delayedNavigationInFlight) {
      delayedNavigationInFlight = false;
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [children, displayedRoute.pathname, exiting, pathname, reduceMotion]);

  useEffect(() => {
    function runNavigation(href: string) {
      if (reduceMotion) {
        router.push(href);
        return;
      }

      if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
      delayedNavigationInFlight = true;
      pendingRoute.current = null;
      exitComplete.current = false;
      setExiting(true);
      navigationTimer.current = window.setTimeout(() => {
        navigationTimer.current = null;
        router.push(href);
      }, EXIT_DURATION_MS);
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;

      event.preventDefault();
      runNavigation(next);
    }

    function onNavigate(event: Event) {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (!href) return;
      runNavigation(href);
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
      if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
    };
  }, [reduceMotion, router]);

  if (reduceMotion) {
    return <div className="min-h-0 flex-1 overflow-hidden">{children}</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <motion.div
        key={displayedRoute.pathname}
        className="h-full"
        initial={ENTER}
        animate={exiting ? EXIT : REST}
        onAnimationComplete={() => {
          if (!exiting) return;
          const next = pendingRoute.current;
          pendingRoute.current = null;
          if (next) {
            exitComplete.current = false;
            delayedNavigationInFlight = false;
            setDisplayedRoute(next);
            setExiting(false);
          } else {
            exitComplete.current = true;
          }
        }}
        transition={{
          duration: exiting ? 0.2 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {displayedRoute.children}
      </motion.div>
    </div>
  );
}
