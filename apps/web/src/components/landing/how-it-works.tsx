import { STEPS, TONE } from "./content";
import { Icon } from "./icons";
import { SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative scroll-mt-24 overflow-hidden px-4 py-[clamp(4rem,10vw,7.5rem)] sm:px-6 lg:px-14"
    >
      {/* lit band so the section reads as its own lighter surface */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,transparent_0%,rgba(92,58,80,0.22)_16%,rgba(92,58,80,0.22)_84%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[26rem] w-[52rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(227,168,63,0.16),rgba(201,85,143,0.08)_45%,transparent_72%)] blur-2xl"
      />

      <div className="mx-auto max-w-[1360px]">
        <Reveal>
          <SectionHeading
            eyebrow="How It Works"
            title={
              <>
                From Insight to Impact in{" "}
                <span className="text-gradient-gold">4 Simple Steps</span>
              </>
            }
          >
            A guided path from your first assessment to measurable, compounding
            growth.
          </SectionHeading>
        </Reveal>

        <Reveal
          delay={80}
          as="div"
          className="glass-panel mt-14 rounded-3xl p-5 sm:p-8"
        >
          <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* connector rail behind the icon row (desktop) */}
            <div
              aria-hidden
              className="absolute inset-x-[12%] top-[3.35rem] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(243,205,124,0.55),rgba(201,85,143,0.55),rgba(243,205,124,0.55),transparent)] lg:block"
            />
            {STEPS.map((s, i) => {
              const Glyph = Icon[s.icon];
              const t = TONE[s.tone];
              return (
                <Reveal
                  key={s.num}
                  as="li"
                  delay={i * 90}
                  className="group border-gold-400/15 bg-foreground/[0.04] hover:border-gold-400/35 hover:bg-foreground/[0.07] relative overflow-hidden rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-1.5"
                >
                  <span
                    aria-hidden
                    className="font-heading text-foreground/[0.06] group-hover:text-foreground/[0.1] pointer-events-none absolute -top-3 right-2 text-[3.5rem] font-bold transition-colors"
                  >
                    {s.num}
                  </span>
                  <div
                    className={`relative z-10 mx-auto flex size-14 items-center justify-center rounded-full ${t.chip} ${t.ring} ${t.text}`}
                  >
                    <Glyph className="size-6" />
                    <span className="border-gold-400/40 bg-plum-900 text-gold-300 absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border text-[0.65rem] font-bold">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-heading text-cream mt-5 text-base font-bold">
                    {s.title}
                  </h3>
                  <p className="text-cream-dim/85 mt-2 text-[0.9rem] leading-relaxed">
                    {s.desc}
                  </p>
                </Reveal>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
