import Image from "next/image";
import Link from "next/link";

import { FOOTER_COLUMNS, IMAGES, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

// Evaluated once at build time — baked into the static shell. `new Date()`
// during render is rejected under `cacheComponents` (unstable value).
const COPYRIGHT_YEAR = new Date().getFullYear();

import { Icon } from "./icons";

const SOCIALS = [
  {
    label: "LinkedIn",
    icon: Icon.linkedin,
    href: "#",
    hover:
      "hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/15 hover:text-[#4aa3ff]",
  },
  {
    label: "Twitter",
    icon: Icon.twitter,
    href: "#",
    hover: "hover:border-white/60 hover:bg-white/10 hover:text-white",
  },
  {
    label: "YouTube",
    icon: Icon.youtube,
    href: "#",
    hover:
      "hover:border-[#FF0000]/60 hover:bg-[#FF0000]/15 hover:text-[#ff5c5c]",
  },
  {
    label: "Instagram",
    icon: Icon.instagram,
    href: "#",
    hover:
      "hover:border-[#E4405F]/60 hover:bg-[#E4405F]/15 hover:text-[#f27196]",
  },
] as const;

export function SiteFooter() {
  return (
    <footer
      id="about"
      className="border-gold-400/15 scroll-mt-24 border-t px-4 sm:px-6 lg:px-14"
    >
      <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-x-6 gap-y-9 py-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-6">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <Image
              src={IMAGES.logo}
              alt=""
              width={30}
              height={30}
              className="size-8 object-contain"
            />
            <span className="font-heading text-cream text-[0.95rem] font-bold tracking-wide">
              AI GROWTH ENGINE
            </span>
          </div>
          <p className="text-muted-warm mt-4 max-w-xs text-[0.85rem] leading-relaxed">
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
                  className={cn(
                    "border-gold-400/20 text-muted-warm flex size-9 items-center justify-center rounded-lg border bg-white/5 transition duration-200 hover:-translate-y-0.5",
                    s.hover,
                  )}
                >
                  <Glyph className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-cream text-[0.8rem] font-bold">{col.title}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-muted-warm hover:text-cream text-[0.82rem] transition"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-2">
          <h3 className="text-cream text-[0.8rem] font-bold">Stay Updated</h3>
          <p className="text-muted-warm mt-4 text-[0.82rem] leading-relaxed">
            Get the latest insights on AI and business transformation.
          </p>
          <form className="mt-4 flex gap-2" aria-label="Newsletter signup">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="border-gold-400/25 text-cream placeholder:text-faint focus-visible:border-gold-400/60 min-w-0 flex-1 rounded-xl border bg-white/5 px-4 py-2.5 text-[0.82rem] outline-none"
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

      <div className="border-gold-400/12 mx-auto flex max-w-[1360px] flex-col items-center gap-3 border-t py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="text-faint text-[0.78rem]">
          &copy; {COPYRIGHT_YEAR} {SITE.name}. All rights reserved.
        </span>
        <div className="flex gap-6">
          <Link href="#" className="text-faint hover:text-cream text-[0.78rem]">
            Privacy Policy
          </Link>
          <Link href="#" className="text-faint hover:text-cream text-[0.78rem]">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
