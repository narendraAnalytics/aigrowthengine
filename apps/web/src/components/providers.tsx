"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import { SyncUser } from "@/components/auth/sync-user";
import { ThemeProvider } from "@/components/theme-provider";

import type { ComponentProps, ReactNode } from "react";

type ClerkAppearance = NonNullable<
  ComponentProps<typeof ClerkProvider>["appearance"]
>;

function ClerkWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // `as ClerkAppearance`: Clerk's vendored theme types aren't clean under
  // `exactOptionalPropertyTypes` (optional `cssLayerName` on the prebuilt
  // `dark` theme). The shape is correct; the cast only bridges that.
  const appearance = {
    ...(isDark ? { theme: dark } : {}),
    variables: {
      colorPrimary: "#e3a83f",
      colorBackground: isDark ? "#1f1220" : "#fbf7ef",
      colorForeground: isDark ? "#f2e4cd" : "#2a1b2e",
      colorInput: isDark ? "rgba(255,255,255,0.04)" : "rgba(20,10,25,0.03)",
      colorInputForeground: isDark ? "#f2e4cd" : "#2a1b2e",
      borderRadius: "0.75rem",
      fontFamily: "var(--font-sans)",
    },
  } as ClerkAppearance;

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      appearance={appearance}
    >
      <SyncUser />
      {children}
    </ClerkProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ClerkWithTheme>{children}</ClerkWithTheme>
    </ThemeProvider>
  );
}
