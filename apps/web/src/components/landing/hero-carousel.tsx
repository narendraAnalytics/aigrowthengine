"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { HERO_SLIDES } from "@/lib/site";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (HERO_SLIDES.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      if (paused.current) return;
      setActive((i) => (i + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="absolute inset-0 -z-10"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="hero-slide absolute inset-0 overflow-hidden"
          data-active={i === active}
        >
          <Image
            src={slide.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: slide.position }}
          />
        </div>
      ))}

      {/* readability gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,18,32,0.88)_0%,rgba(37,20,40,0.55)_35%,rgba(28,14,26,0.7)_75%,var(--background)_100%)]" />

      {HERO_SLIDES.length > 1 && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2.5 sm:left-14 sm:translate-x-0">
          {HERO_SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "bg-gold-300 w-7"
                  : "bg-cream/30 hover:bg-cream/50 w-3",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
