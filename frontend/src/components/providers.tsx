"use client";

import { useTheme } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SyncUser } from "@/components/auth/sync-user";

function ClerkWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      appearance={{
        theme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#e3a83f",
          colorBackground: isDark ? "#1f1220" : "#fbf7ef",
          colorForeground: isDark ? "#f2e4cd" : "#2a1b2e",
          colorInput: isDark ? "rgba(255,255,255,0.04)" : "rgba(20,10,25,0.03)",
          colorInputForeground: isDark ? "#f2e4cd" : "#2a1b2e",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
      }}
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
