import Image from "next/image";
import { IMAGES } from "@/lib/site";
import { OUTCOMES } from "./content";
import { Icon } from "./icons";
import { GoldLink } from "./primitives";
import { Reveal } from "./reveal";

export function Transformations() {
  return (
    <section
      id="usecases"
      className="relative scroll-mt-24 px-4 py-[clamp(3rem,8vw,6.5rem)] sm:px-6 lg:px-14"
    >
      <div className="mx-auto grid max-w-[1360px] items-center gap-12 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <p className="section-eyebrow mb-4">Business Transformations</p>
          <h2 className="text-cream text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight font-bold">
            Drive Real Business Outcomes
          </h2>

          <ul className="mt-8 flex flex-col gap-5">
            {OUTCOMES.map((o) => {
              const Glyph = Icon[o.icon];
              return (
                <li
                  key={o.title}
                  className="flex items-start gap-4 border-b border-gold-400/10 pb-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-magenta-400/30 bg-magenta-400/15 text-magenta-400">
                    <Glyph className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-[0.98rem] font-bold text-cream">
                      {o.title}
                    </h3>
                    <p className="mt-1 text-[0.86rem] leading-relaxed text-muted-warm">
                      {o.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <GoldLink href="#usecases" className="mt-8">
            Explore Use Cases
          </GoldLink>
        </Reveal>

        <Reveal
          delay={100}
          className="relative aspect-[6/5] overflow-hidden rounded-3xl border border-gold-400/20 shadow-[0_20px_50px_rgba(10,4,14,0.4)]"
        >
          <Image
            src={IMAGES.businessTransformation}
            alt="AI analytics dashboard visualising business outcomes"
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
