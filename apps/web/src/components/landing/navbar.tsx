"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { IMAGES, NAV_LINKS, SITE } from "@/lib/site";
import { WelcomeName } from "@/components/auth/welcome-name";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "./icons";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollToTop = (e: MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      setOpen(false);
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      history.replaceState(null, "", "/");
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-4 transition-all duration-300 sm:px-6 lg:px-14",
        scrolled ? "pt-2" : "pt-5",
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex max-w-[1360px] items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5",
          scrolled
            ? "glass-panel border-gold-400/30 py-2.5 shadow-[0_10px_40px_rgba(10,4,14,0.55)]"
            : "border border-hairline bg-plum-900/70 backdrop-blur-md",
        )}
      >
        <Link
          href="/"
          onClick={scrollToTop}
          className="flex items-center gap-2.5"
          aria-label={`${SITE.name} — back to top`}
        >
          <Image
            src={IMAGES.logo}
            alt=""
            width={40}
            height={40}
            priority
            className={cn(
              "object-contain drop-shadow-[0_0_10px_rgba(227,168,63,0.4)] transition-all duration-300",
              scrolled ? "size-8" : "size-9 sm:size-10",
            )}
          />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-[0.95rem] font-bold tracking-wide text-cream sm:text-[1.05rem]">
              AI GROWTH
            </span>
            <span className="text-[0.6rem] font-semibold tracking-[0.25em] text-gold-500">
              ENGINE
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.9rem] font-medium text-cream-dim/90 transition hover:text-cream"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <button
                type="button"
                className="btn-gold inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                Book a Demo <Icon.arrowRight className="size-3.5" />
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <WelcomeName className="text-sm font-semibold text-cream" />
            <UserButton />
          </Show>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-xl border border-gold-400/25 bg-white/5 text-cream"
          >
            {open ? (
              <Icon.close className="size-5" />
            ) : (
              <Icon.menu className="size-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu: full-screen dimmed backdrop + solid panel */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 -z-10 bg-plum-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        className={cn(
          "mx-auto mt-2 max-w-[1360px] origin-top overflow-hidden rounded-2xl border border-gold-400/30 bg-plum-950 shadow-[0_24px_70px_rgba(8,3,12,0.85)] transition-all duration-300 ease-out lg:hidden",
          open
            ? "max-h-[34rem] translate-y-0 p-3 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 p-0 opacity-0",
        )}
      >
        <div className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-[0.95rem] font-semibold text-cream transition hover:bg-gold-400/10 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <div className="mx-2 my-3 h-px bg-gold-400/15" />
          <div className="px-1 pb-1">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-gold block w-full rounded-xl px-4 py-3 text-center text-sm font-bold"
                >
                  Book a Demo
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center justify-between rounded-xl border border-gold-400/25 px-4 py-2.5">
                <WelcomeName className="text-sm font-semibold text-cream" />
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}
