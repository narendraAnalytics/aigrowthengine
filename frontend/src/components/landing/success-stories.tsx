import Image from "next/image";
import { CASES } from "./content";
import { SectionHeading } from "./primitives";
import { Reveal } from "./reveal";
import { TestimonialCarousel } from "./testimonial-carousel";

export function SuccessStories() {
  return (
    <section
      id="stories"
      className="relative scroll-mt-24 px-4 py-[clamp(3rem,8vw,6.5rem)] sm:px-6 lg:px-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(80,44,68,0.3)_0%,rgba(31,18,32,0)_60%)]"
      />
      <div className="mx-auto max-w-[1360px]">
        <Reveal>
          <SectionHeading
            eyebrow="Success Stories"
            title="Real Impact, Real Results"
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-3">
            {CASES.map((c, i) => (
              <Reveal
                key={c.company}
                delay={i * 80}
                as="article"
                className="glass-card overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={c.image}
                    alt={`${c.company} — ${c.tag}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 280px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="text-[0.82rem] font-semibold text-cream-dim">
                    {c.company}
                  </div>
                  <div className="mt-0.5 text-[0.75rem] text-faint">{c.tag}</div>
                  <div className="mt-3 font-heading text-[1.75rem] font-bold text-gold-300">
                    {c.metric}
                  </div>
                  <div className="mt-0.5 text-[0.78rem] text-muted-warm">
                    {c.metricLabel}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="h-full">
            <TestimonialCarousel />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
