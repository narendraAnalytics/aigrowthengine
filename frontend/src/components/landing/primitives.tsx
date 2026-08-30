import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";
import { TONE, type Tone } from "./content";

export function SectionHeading({
  eyebrow,
  title,
  children,
  center = true,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        center && "mx-auto text-center",
        className,
      )}
    >
      <p className="section-eyebrow mb-4">{eyebrow}</p>
      <h2 className="text-cream text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.12] font-bold">
        {title}
      </h2>
      {children ? (
        <p className="text-muted-warm mx-auto mt-4 text-base leading-relaxed">
          {children}
        </p>
      ) : null}
    </div>
  );
}

export function IconBadge({
  name,
  tone,
  size = "md",
}: {
  name: keyof typeof Icon;
  tone: Tone;
  size?: "sm" | "md";
}) {
  const Glyph = Icon[name];
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        t.chip,
        t.ring,
        t.text,
        size === "md"
          ? "h-13 w-13 [&_svg]:size-6"
          : "h-10 w-10 [&_svg]:size-5",
      )}
    >
      <Glyph />
    </span>
  );
}

type GoldLinkProps = ComponentProps<typeof Link> & { withArrow?: boolean };

export function GoldLink({
  className,
  children,
  withArrow = true,
  ...props
}: GoldLinkProps) {
  return (
    <Link
      className={cn(
        "btn-gold inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-bold transition hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
      {withArrow ? <Icon.arrowRight className="size-4" /> : null}
    </Link>
  );
}

export function GlassLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "btn-glass inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-semibold transition hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
