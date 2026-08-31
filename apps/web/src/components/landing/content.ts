import { IMAGES } from "@/lib/site";
import type { IconName } from "./icons";

export type Tone = "gold" | "magenta" | "mint";

export const TONE: Record<Tone, { text: string; chip: string; ring: string }> = {
  gold: {
    text: "text-gold-300",
    chip: "bg-gold-400/15 border border-gold-400/35",
    ring: "shadow-[0_0_26px_rgba(227,168,63,0.22)]",
  },
  magenta: {
    text: "text-magenta-400",
    chip: "bg-magenta-400/15 border border-magenta-400/35",
    ring: "shadow-[0_0_26px_rgba(201,85,143,0.22)]",
  },
  mint: {
    text: "text-mint-400",
    chip: "bg-mint-400/15 border border-mint-400/30",
    ring: "shadow-[0_0_26px_rgba(111,174,148,0.2)]",
  },
};

export const STATS = [
  { value: "250+", label: "Projects Delivered", icon: "rocket", tone: "magenta" },
  { value: "40%", label: "Average Cost Saving", icon: "trend", tone: "gold" },
  { value: "98%", label: "Client Satisfaction", icon: "users", tone: "magenta" },
  { value: "3x", label: "ROI on Average", icon: "trophy", tone: "gold" },
] satisfies ReadonlyArray<{
  value: string;
  label: string;
  icon: IconName;
  tone: Tone;
}>;

export const TRUST_LOGOS = [
  { name: "CloudFin", glyph: "◆" },
  { name: "Nexora", glyph: "▲" },
  { name: "Brightpath", glyph: "⬢" },
  { name: "InnovaTech", glyph: "✺" },
  { name: "ScaleFlow", glyph: "◈" },
];

export const FEATURES = [
  {
    title: "AI Opportunity Assessment",
    desc: "Identify high-impact AI opportunities tailored to your business.",
    icon: "clipboard",
    tone: "magenta",
  },
  {
    title: "Strategic Roadmap",
    desc: "Get a clear, actionable roadmap with prioritized initiatives.",
    icon: "target",
    tone: "gold",
  },
  {
    title: "Solution Implementation",
    desc: "We build and integrate AI solutions that deliver real results.",
    icon: "box",
    tone: "gold",
  },
  {
    title: "AI Agents & Automation",
    desc: "Automate workflows and enhance productivity with AI agents.",
    icon: "bolt",
    tone: "magenta",
  },
  {
    title: "Secure & Compliant by Design",
    desc: "Enterprise-grade security with TRiSM and governance built-in.",
    icon: "shield",
    tone: "mint",
  },
  {
    title: "Measure, Optimize & Scale",
    desc: "Track performance, optimize continuously and scale fast.",
    icon: "gauge",
    tone: "gold",
  },
] satisfies ReadonlyArray<{
  title: string;
  desc: string;
  icon: IconName;
  tone: Tone;
}>;

export const STEPS = [
  {
    num: "01",
    title: "Discover",
    desc: "Assess your business and uncover high-value AI opportunities.",
    icon: "search",
    tone: "magenta",
  },
  {
    num: "02",
    title: "Strategize",
    desc: "We create a tailored roadmap aligned with your goals.",
    icon: "network",
    tone: "gold",
  },
  {
    num: "03",
    title: "Implement",
    desc: "Our experts build and deploy AI solutions that work.",
    icon: "rocket",
    tone: "magenta",
  },
  {
    num: "04",
    title: "Grow",
    desc: "Measure results, optimize, and scale for continuous growth.",
    icon: "trend",
    tone: "gold",
  },
] satisfies ReadonlyArray<{
  num: string;
  title: string;
  desc: string;
  icon: IconName;
  tone: Tone;
}>;

export const OUTCOMES = [
  {
    title: "Cost Reduction",
    desc: "Reduce operational costs by up to 40% through automation.",
    icon: "users",
  },
  {
    title: "Revenue Growth",
    desc: "Identify new revenue streams and increase top-line growth.",
    icon: "trend",
  },
  {
    title: "Operational Efficiency",
    desc: "Streamline workflows and boost productivity across teams.",
    icon: "gauge",
  },
  {
    title: "Data-Driven Decisions",
    desc: "Leverage AI insights to make smarter, faster decisions.",
    icon: "box",
  },
] satisfies ReadonlyArray<{ title: string; desc: string; icon: IconName }>;

export const CASES = [
  {
    company: "Manufacturing Co.",
    tag: "Process Automation",
    metric: "35%",
    metricLabel: "Cost Reduction",
    image: IMAGES.processAutomation,
  },
  {
    company: "FinTech Company",
    tag: "AI-Powered Support",
    metric: "50%",
    metricLabel: "Faster Resolution",
    image: IMAGES.aiPoweredSupport,
  },
  {
    company: "Retail Enterprise",
    tag: "Demand Forecasting",
    metric: "2.8x",
    metricLabel: "Revenue Growth",
    image: IMAGES.demandForecasting,
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "AI Growth Engine helped us turn complex challenges into real growth opportunities. Their team delivered measurable results from day one.",
    name: "Rohan Mehta",
    role: "CTO, Nexora",
    avatar: IMAGES.person1,
    rating: 5,
  },
  {
    quote:
      "The assessment pinpointed automation wins we'd overlooked for years. We recovered 30 hours a week across the ops team in the first quarter.",
    name: "Sarah Chen",
    role: "VP Operations, CloudFin",
    avatar: IMAGES.person2,
    rating: 5,
  },
  {
    quote:
      "What stood out was the honesty — a clear, explainable score and a roadmap we could actually execute, not a black box.",
    name: "Marcus Lindqvist",
    role: "Founder, ScaleFlow",
    avatar: IMAGES.person3,
    rating: 5,
  },
  {
    quote:
      "From first conversation to a live pilot took six weeks. The forecasting model is now core to how we plan inventory.",
    name: "Priya Nair",
    role: "Head of Data, Brightpath",
    avatar: IMAGES.person4,
    rating: 5,
  },
] satisfies ReadonlyArray<{
  quote: string;
  name: string;
  role: string;
  avatar: string | null;
  rating: number;
}>;
