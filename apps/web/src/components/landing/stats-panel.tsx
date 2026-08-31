"use client";

import { STATS } from "./content";
import { CountUp } from "./count-up";
import { IconBadge } from "./primitives";

function parse(value: string) {
  const match = value.match(/^([\d.]+)(.*)$/);
  if (!match) return { num: 0, suffix: value, decimals: 0 };
  const raw = match[1] ?? "0";
  return {
    num: Number.parseFloat(raw),
    suffix: match[2] ?? "",
    decimals: raw.includes(".") ? 1 : 0,
  };
}

export function StatsPanel() {
  return (
    <div className="glass-panel mt-9 grid gap-6 rounded-3xl p-6 sm:p-8 md:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s, i) => {
        const { num, suffix, decimals } = parse(s.value);
        return (
          <div key={s.label} className="flex items-center gap-4">
            <IconBadge name={s.icon} tone={s.tone} />
            <div>
              <CountUp
                value={num}
                suffix={suffix}
                decimals={decimals}
                duration={1400 + i * 200}
                className="font-heading text-cream block text-[clamp(1.5rem,3vw,2rem)] leading-none font-bold tabular-nums"
              />
              <div className="text-muted-warm mt-1 text-[0.8rem]">
                {s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
