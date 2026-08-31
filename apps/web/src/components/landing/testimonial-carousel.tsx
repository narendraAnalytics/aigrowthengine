"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "./content";

const INTERVAL_MS = 7000;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (TESTIMONIALS.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      if (!paused.current) setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const go = (dir: number) =>
    setActive((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div
      className="glass-panel flex h-full flex-col justify-between gap-6 rounded-2xl p-7"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="relative grid">
        {TESTIMONIALS.map((t, i) => (
          <blockquote
            key={t.name}
            aria-hidden={i !== active}
            className={cn(
              "col-start-1 row-start-1 transition-opacity duration-500",
              i === active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="font-heading text-4xl leading-none text-gold-300">
              &ldquo;
            </div>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-cream-dim italic">
              {t.quote}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {t.avatar ? (
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/15 text-[0.8rem] font-bold text-gold-200">
                  {initials(t.name)}
                </span>
              )}
              <div>
                <div className="text-[0.88rem] font-bold text-cream">
                  {t.name}
                </div>
                <div className="text-[0.78rem] text-faint">{t.role}</div>
              </div>
            </div>
            <div
              aria-label={`${t.rating} out of 5 stars`}
              className="mt-4 tracking-[0.2em] text-gold-400"
            >
              {"★".repeat(t.rating)}
            </div>
          </blockquote>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-6 bg-gold-300" : "w-2.5 bg-cream/25 hover:bg-cream/45",
              )}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="flex size-8 items-center justify-center rounded-lg border border-gold-400/25 text-cream-dim transition hover:border-gold-400/50 hover:text-cream"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="flex size-8 items-center justify-center rounded-lg border border-gold-400/25 text-cream-dim transition hover:border-gold-400/50 hover:text-cream"
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
}
