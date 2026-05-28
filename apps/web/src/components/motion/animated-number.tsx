"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
  format?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 0.45,
  format,
}: AnimatedNumberProps) {
  return (
    <CountUp
      end={value}
      decimals={decimals}
      duration={duration}
      preserveValue
      formattingFn={(current) => format ? format(current) : `${prefix}${current.toFixed(decimals)}${suffix}`}
    >
      {({ countUpRef }) => <span ref={countUpRef} className={className} />}
    </CountUp>
  );
}

export function useNumberFlash(value: number) {
  const previous = useRef(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value === previous.current) return;
    setDirection(value > previous.current ? "up" : "down");
    previous.current = value;
    const timer = window.setTimeout(() => setDirection(null), 520);
    return () => window.clearTimeout(timer);
  }, [value]);

  return useMemo(() => {
    if (direction === "up") return "number-flash-up";
    if (direction === "down") return "number-flash-down";
    return "";
  }, [direction]);
}
