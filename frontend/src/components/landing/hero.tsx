import { TRUST_LOGOS } from "./content";
import { HeroCarousel } from "./hero-carousel";
import { Icon } from "./icons";
import { GoldLink, GlassLink } from "./primitives";
import { Reveal } from "./reveal";
import { StatsPanel } from "./stats-panel";

export function Hero() {
  return (
    <section className="relative isolate min-h-[52rem] overflow-hidden">
      <HeroCarousel />

      <div className="mx-auto max-w-[1360px] px-4 pt-28 pb-14 sm:px-6 sm:pt-36 lg:px-14">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2">
            <Icon.sparkle className="size-3.5 text-gold-300" />
            <span className="text-[0.72rem] font-bold tracking-[0.14em] text-gold-300">
              AI-POWERED GROWTH PLATFORM
            </span>
          </span>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.4rem,6.2vw,4.6rem)] leading-[1.05] font-bold tracking-tight text-cream">
            Turn Business Challenges Into{" "}
            <span className="text-gradient-shimmer">Growth Opportunities</span>
          </h1>

          <p className="mt-6 max-w-xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-cream-dim">
            AI Growth Engine helps businesses discover high-impact opportunities,
            implement AI solutions, and achieve measurable results that drive real
            growth.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <GoldLink href="/business-assessment">
              Start Your Free Assessment
            </GoldLink>
            <GlassLink href="#how">
              How It Works <Icon.play className="size-3" />
            </GlassLink>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-14">
          <p className="text-[0.72rem] font-semibold tracking-[0.12em] text-faint">
            TRUSTED BY INNOVATIVE COMPANIES
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            {TRUST_LOGOS.map((b) => (
              <li
                key={b.name}
                className="flex items-center gap-2 text-[0.95rem] font-semibold text-[#c9a877] opacity-75"
              >
                <span aria-hidden>{b.glyph}</span>
                {b.name}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <StatsPanel />
        </Reveal>
      </div>
    </section>
  );
}
