import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { SITE } from "@/lib/site";

const fontSans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontHeading = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE.name,
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1f1220",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} h-full`}
    >
      <body className="min-h-full">
        <ClerkProvider
          afterSignOutUrl="/"
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/"
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: "#e3a83f",
              colorBackground: "#1f1220",
              colorForeground: "#f2e4cd",
              colorInput: "rgba(255,255,255,0.04)",
              colorInputForeground: "#f2e4cd",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-sans)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
