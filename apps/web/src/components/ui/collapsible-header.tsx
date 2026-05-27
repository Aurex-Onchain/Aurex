"use client";

import { useRef, useState, useEffect, useCallback, createContext, useContext } from "react";

interface CollapsibleHeaderProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  tickerSlot?: React.ReactNode;
}

const CollapseContext = createContext(false);

export function useCollapsed() {
  return useContext(CollapseContext);
}

const SCROLL_THRESHOLD = 60;

export function CollapsibleHeader({ title, description, children, tickerSlot }: CollapsibleHeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const p = Math.min(el.scrollTop / SCROLL_THRESHOLD, 1);
    setProgress(p);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const fontSize = 18 - progress * 4;
  const descOpacity = 1 - progress;
  const borderOpacity = progress * 0.5;
  const collapsed = progress >= 0.95;
  const headerHeight = tickerSlot ? 96 : description ? 90 : 68;

  return (
    <CollapseContext.Provider value={collapsed}>
      <div className="flex flex-col h-full relative">
        <div
          className="sticky top-0 z-20 shrink-0 bg-white/70 px-3 backdrop-blur-xl dark:bg-zinc-950/70 sm:px-5"
          style={{
            height: `${headerHeight}px`,
            borderBottom: `1px solid color-mix(in srgb, var(--border) ${Math.round(borderOpacity * 100)}%, transparent)`,
          }}
        >
          <div className="relative h-full pt-6">
            <h2
              className="font-bold leading-tight text-zinc-900 dark:text-zinc-100"
              style={{
                fontSize: `${fontSize}px`,
                transform: `translateY(${-progress * 4}px)`,
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                className="absolute left-0 right-0 top-12 overflow-hidden text-sm text-zinc-400"
                style={{
                  opacity: descOpacity,
                  transform: `translateY(${-progress * 6}px)`,
                  pointerEvents: descOpacity > 0.05 ? "auto" : "none",
                }}
              >
                {description}
              </p>
            )}

            {tickerSlot && (
              <div
                className="absolute inset-x-0 bottom-1 overflow-hidden transition-[opacity,transform] duration-200"
                style={{
                  opacity: collapsed ? 1 : 0,
                  pointerEvents: collapsed ? "auto" : "none",
                  transform: `translateY(${collapsed ? 0 : 6}px)`,
                }}
              >
                {tickerSlot}
              </div>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto [overflow-anchor:none]">
          {children}
        </div>
      </div>
    </CollapseContext.Provider>
  );
}
