import { FEATURES } from "./content";
import { Icon } from "./icons";
import { IconBadge, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

export function Platform() {
  return (
    <section
      id="platform"
      className="relative scroll-mt-24 px-4 py-[clamp(4.5rem,10vw,8rem)] sm:px-6 lg:px-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60%] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(80,44,68,0.35)_0%,rgba(31,18,32,0)_60%)]"
      />
      <div className="mx-auto max-w-[1360px]">
        <Reveal>
          <SectionHeading
            eyebrow="Our Platform"
            title={
              <>
                Everything You Need to{" "}
                <span className="text-gradient-gold">Grow</span>
              </>
            }
          >
            An end-to-end platform to assess, strategize, implement and scale AI
            solutions for your business.
          </SectionHeading>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 80}
              as="article"
              className="glass-card group rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1.5"
            >
              <IconBadge name={f.icon} tone={f.tone} />
              <h3 className="mt-5 font-heading text-lg font-bold text-cream">
                {f.title}
              </h3>
              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-muted-warm">
                {f.desc}
              </p>
              <span className="mt-4 inline-flex text-gold-300 transition-transform group-hover:translate-x-1">
                <Icon.arrowRight className="size-4" />
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
