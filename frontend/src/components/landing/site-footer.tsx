import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS, IMAGES, SITE } from "@/lib/site";
import { Icon } from "./icons";

const SOCIALS = [
  { label: "LinkedIn", icon: Icon.linkedin, href: "#" },
  { label: "Twitter", icon: Icon.twitter, href: "#" },
  { label: "YouTube", icon: Icon.youtube, href: "#" },
  { label: "Instagram", icon: Icon.instagram, href: "#" },
] as const;

export function SiteFooter() {
  return (
    <footer
      id="about"
      className="scroll-mt-24 border-t border-gold-400/15 px-4 sm:px-6 lg:px-14"
    >
      <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-x-6 gap-y-9 py-12 sm:gap-10 sm:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <Image
              src={IMAGES.logo}
              alt=""
              width={30}
              height={30}
              className="size-8 object-contain"
            />
            <span className="font-heading text-[0.95rem] font-bold tracking-wide text-cream">
              AI GROWTH ENGINE
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-muted-warm">
            {SITE.description}
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIALS.map((s) => {
              const Glyph = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-lg border border-gold-400/20 bg-white/5 text-muted-warm transition hover:border-gold-400/40 hover:text-cream"
                >
                  <Glyph className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-[0.8rem] font-bold text-cream">{col.title}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-[0.82rem] text-muted-warm transition hover:text-cream"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-2">
          <h3 className="text-[0.8rem] font-bold text-cream">Stay Updated</h3>
          <p className="mt-4 text-[0.82rem] leading-relaxed text-muted-warm">
            Get the latest insights on AI and business transformation.
          </p>
          <form className="mt-4 flex gap-2" aria-label="Newsletter signup">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-xl border border-gold-400/25 bg-white/5 px-4 py-2.5 text-[0.82rem] text-cream outline-none placeholder:text-faint focus-visible:border-gold-400/60"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="btn-gold flex size-10 shrink-0 items-center justify-center rounded-xl"
            >
              <Icon.arrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-3 border-t border-gold-400/12 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="text-[0.78rem] text-faint">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </span>
        <div className="flex gap-6">
          <Link href="#" className="text-[0.78rem] text-faint hover:text-cream">
            Privacy Policy
          </Link>
          <Link href="#" className="text-[0.78rem] text-faint hover:text-cream">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
