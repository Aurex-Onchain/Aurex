"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface CollapsibleHeaderProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SCROLL_THRESHOLD = 60;

export function CollapsibleHeader({ title, description, children }: CollapsibleHeaderProps) {
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
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const fontSize = 18 - progress * 4;
  const descOpacity = 1 - progress;
  const descMaxHeight = (1 - progress) * 24;
  const borderOpacity = progress * 0.5;

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 px-3 sm:px-5 pt-6 pb-5"
        style={{
          borderBottom: `1px solid color-mix(in srgb, var(--border) ${Math.round(borderOpacity * 100)}%, transparent)`,
        }}
      >
        <h2 className="font-bold leading-tight text-zinc-900 dark:text-zinc-100" style={{ fontSize: `${fontSize}px` }}>
          {title}
        </h2>
        {description && (
          <p
            className="text-sm text-zinc-400 overflow-hidden"
            style={{ maxHeight: `${descMaxHeight}px`, opacity: descOpacity, marginTop: descOpacity > 0 ? "2px" : "0" }}
          >
            {description}
          </p>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
