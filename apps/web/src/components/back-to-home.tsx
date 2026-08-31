import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A plain "← Back to home" link to the landing page. Used at the top of the
 * assessment flow pages so a signed-in user always has a way out.
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
      href="/"
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
