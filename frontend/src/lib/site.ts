/**
 * Site-wide constants for AI Growth Engine.
 * Image URLs come from imagesurl.txt (Cloudinary).
 */

export const SITE = {
  name: "AI Growth Engine",
  tagline: "Turn Business Challenges Into Growth Opportunities",
  description:
    "AI Growth Engine helps businesses discover high-impact opportunities, implement AI solutions, and achieve measurable results.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://aigrowthengine.com",
} as const;

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dkqbzwicr/image/upload";

/** Build a Cloudinary URL with optional transformation string. */
function cld(path: string, transform?: string) {
  return transform
    ? `${CLOUDINARY_BASE}/${transform}/${path}`
    : `${CLOUDINARY_BASE}/${path}`;
}

export const IMAGES = {
  /** On-page logo. PWA / favicon icons live in public/ + src/app/ (see manifest.ts). */
  logo: "/logoaipoweredbusiness.png",
  heroBanner: cld("v1788069110/herosection_dwrwdv.png"),
  businessTransformation: cld("v1788069207/businesstransformation_jouf85.png"),
  processAutomation: cld("v1788069266/ProcessAutomation_zxgaze.png"),
  aiPoweredSupport: cld("v1788069325/AIPoweredSupport_ttvyqf.png"),
  demandForecasting: cld("v1788069382/DemandForecasting_jbpm6j.png"),
  person1: cld("v1788069411/personimage1_zrwmkt.png"),
} as const;

export const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How It Works", href: "#how" },
  { label: "Use Cases", href: "#usecases" },
  { label: "Success Stories", href: "#stories" },
  { label: "About", href: "#about" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      "Assessment",
      "Roadmap",
      "Implementation",
      "AI Agents",
      "Analytics",
    ],
  },
  {
    title: "Solutions",
    links: [
      "By Industry",
      "By Function",
      "AI Automation",
      "Data & Analytics",
      "Security",
    ],
  },
  {
    title: "Resources",
    links: ["Case Studies", "Guides", "Webinars", "Blog", "Documentation"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Partners", "Press", "Contact Us"],
  },
] as const;
