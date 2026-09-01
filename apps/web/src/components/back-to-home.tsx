import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { Route } from "next";

/**
 * A plain "← Back to home" link to the landing page. Targets the `#top` anchor
 * (in `app/page.tsx`) so a signed-in user lands on the hero, not wherever the
 * browser last restored the landing page's scroll (usually the footer).
 * Used at the top of the assessment flow pages.
 */
export function BackToHome({
  className,
  label = "Back to home",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={"/#top" as Route}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
