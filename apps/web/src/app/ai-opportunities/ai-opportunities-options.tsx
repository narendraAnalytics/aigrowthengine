"use client";

import Link from "next/link";

import type { Route } from "next";
import type { CSSProperties, ReactNode } from "react";

/**
 * "Where should we start?" — the path picker a signed-in visitor lands on
 * after clicking "View Your AI Opportunities" in the hero.
 *
 * Deliberately a bright, self-contained surface (hard-coded light palette,
 * scoped <style>) so it renders identically regardless of the site's
 * dark-by-default theme. Design mirrors samplefolder + the dashboard.png
 * mockup: three animated option cards over a soft lavender wash.
 */

type Option = {
  id: string;
  title: string;
  accent: string;
  accentSoft: string;
  cardTint: string;
  icon: ReactNode;
  desc: string;
  points: string[];
  cta: string;
  href: Route | string;
  external?: boolean;
  delay: string;
};

const OPTIONS: Option[] = [
  {
    id: "business-growth",
    title: "Business Growth",
    accent: "#2563eb",
    accentSoft: "rgba(37,99,235,0.12)",
    cardTint: "linear-gradient(180deg,#eef4ff 0%,#ffffff 42%)",
    icon: <TargetIcon />,
    desc: "Discover high-impact AI opportunities in your business and unlock measurable growth.",
    points: [
      "Identify automation opportunities",
      "Improve efficiency & reduce costs",
      "Get AI-powered recommendations",
      "Start your transformation journey",
    ],
    cta: "Discover AI Opportunities",
    href: "/business-assessment",
    delay: "0s",
  },
  {
    id: "ai-ideas",
    title: "AI Ideas",
    accent: "#f97316",
    accentSoft: "rgba(249,115,22,0.12)",
    cardTint: "linear-gradient(180deg,#fff4ec 0%,#ffffff 42%)",
    icon: <BulbIcon />,
    desc: "Have an idea? Let's evaluate it and turn it into a validated, feasible solution.",
    points: [
      "Validate your idea's potential",
      "Assess technical feasibility",
      "Explore AI solution roadmap",
      "Build and launch with confidence",
    ],
    cta: "Explore My Idea",
    href: "/idea-assessment",
    delay: "0.12s",
  },
  {
    id: "investor-room",
    title: "Investor Room",
    accent: "#16a34a",
    accentSoft: "rgba(22,163,74,0.12)",
    cardTint: "linear-gradient(180deg,#ecfdf3 0%,#ffffff 42%)",
    icon: <GrowthIcon />,
    desc: "Explore our technology, traction, and vision for building the future with AI.",
    points: [
      "Company vision & roadmap",
      "Products, technology & capabilities",
      "Projects, case studies & traction",
      "Investment opportunity & growth",
    ],
    cta: "Enter Investor Room",
    href: "/investor-room",
    external: true,
    delay: "0.24s",
  },
];

const TRUST = [
  {
    title: "Secure & Confidential",
    desc: "Your data and ideas are safe with us.",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.12)",
    icon: <ShieldIcon />,
  },
  {
    title: "AI-Powered Insights",
    desc: "Get intelligent analysis in minutes.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
    icon: <BoltIcon />,
  },
  {
    title: "Human Expertise",
    desc: "Our experts help you succeed.",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.12)",
    icon: <UsersIcon />,
  },
];

export function AiOpportunitiesOptions() {
  return (
    <div className="aio-root">
      <style>{STYLES}</style>

      <div className="aio-wrap">
        <Link href={"/#top" as Route} className="aio-back">
          <span aria-hidden>←</span> Back to Home
        </Link>

        <div className="aio-head">
          <span className="aio-pill">
            <span aria-hidden>✦</span> Let&apos;s Get Started
          </span>
          <h1 className="aio-title">
            Where should we <span className="aio-title-accent">start?</span>
          </h1>
          <p className="aio-sub">
            Whether you&apos;re looking to transform your business, explore an
            AI idea, or understand our growth story — choose your path.
          </p>
        </div>

        <div className="aio-grid">
          {OPTIONS.map((opt) => (
            <OptionCard key={opt.id} opt={opt} />
          ))}
        </div>

        <div className="aio-trust">
          {TRUST.map((t) => (
            <div key={t.title} className="aio-trust-item">
              <span
                className="aio-trust-icon"
                style={{ background: t.bg, color: t.color }}
              >
                {t.icon}
              </span>
              <span>
                <span className="aio-trust-title">{t.title}</span>
                <span className="aio-trust-desc">{t.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionCard({ opt }: { opt: Option }) {
  const vars = {
    "--accent": opt.accent,
    "--accent-soft": opt.accentSoft,
    animationDelay: opt.delay,
  } as CSSProperties;

  return (
    <div className="aio-card" style={{ ...vars, background: opt.cardTint }}>
      <div className="aio-card-icon">{opt.icon}</div>
      <h3 className="aio-card-title">{opt.title}</h3>
      <span className="aio-card-rule" />
      <p className="aio-card-desc">{opt.desc}</p>
      <ul className="aio-points">
        {opt.points.map((p) => (
          <li key={p}>
            <CheckIcon />
            {p}
          </li>
        ))}
      </ul>
      {opt.external ? (
        <a className="aio-cta" href={opt.href}>
          {opt.cta} <span aria-hidden>→</span>
        </a>
      ) : (
        <Link className="aio-cta" href={opt.href as Route}>
          {opt.cta} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- icons --- */

function svgProps(size = 24) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function TargetIcon() {
  return (
    <svg {...svgProps(30)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg {...svgProps(30)}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg {...svgProps(30)}>
      <path d="M3 3v18h18" />
      <rect x="7" y="13" width="3" height="5" />
      <rect x="12" y="9" width="3" height="9" />
      <rect x="17" y="5" width="3" height="13" />
      <polyline points="7 9 12 5 17 8 21 3" />
      <polyline points="17 3 21 3 21 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...svgProps(17)} style={{ flex: "none" }} strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...svgProps(20)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...svgProps(20)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...svgProps(20)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* --------------------------------------------------------------- styles --- */

const STYLES = `
.aio-root {
  min-height: 100vh;
  background: linear-gradient(160deg,#f4f5fc 0%,#eef1fb 45%,#f7eef7 100%);
  color: #0f172a;
  padding: clamp(32px,5vw,64px) clamp(16px,4vw,56px) 72px;
}
.aio-wrap { max-width: 1180px; margin: 0 auto; }

.aio-back {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #475569;
  text-decoration: none; margin-bottom: 24px;
}
.aio-back:hover { color: #0f172a; }

.aio-head { text-align: center; max-width: 720px; margin: 0 auto clamp(40px,6vw,60px); }
.aio-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 18px; border-radius: 100px;
  background: #ece9fb; border: 1px solid #d9d2f7;
  color: #5b21b6; font-size: 12.5px; font-weight: 700; letter-spacing: 0.6px;
  margin-bottom: 22px;
  animation: aioPill 0.5s ease both;
}
.aio-title {
  font-weight: 800; font-size: clamp(34px,5.6vw,60px); line-height: 1.05;
  color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em;
}
.aio-title-accent {
  background: linear-gradient(90deg,#6d28d9,#4f46e5);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.aio-sub {
  font-size: clamp(15px,1.5vw,17.5px); line-height: 1.6;
  color: #5b6478; margin: 0;
}

.aio-grid {
  display: grid; gap: 26px;
  grid-template-columns: repeat(auto-fit,minmax(280px,1fr));
  align-items: start;
}

.aio-card {
  position: relative; padding: 34px 28px 30px;
  border-radius: 22px; background: #fff;
  border: 1px solid rgba(15,23,42,0.08);
  box-shadow: 0 18px 44px rgba(30,32,72,0.09);
  text-align: left;
  animation: aioCard 0.6s ease both;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.aio-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 60px rgba(30,32,72,0.16);
}
.aio-card-icon {
  width: 78px; height: 78px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  background: var(--accent-soft); color: var(--accent);
  box-shadow: 0 0 0 10px color-mix(in srgb, var(--accent) 6%, transparent);
}
.aio-card-title {
  text-align: center; font-size: 23px; font-weight: 800;
  color: var(--accent); margin: 0 0 12px;
}
.aio-card-rule {
  display: block; width: 40px; height: 3px; border-radius: 2px;
  background: var(--accent); margin: 0 auto 18px;
}
.aio-card-desc {
  text-align: center; font-size: 14.5px; line-height: 1.6;
  color: #64708a; margin: 0 auto 22px; max-width: 30ch;
}
.aio-points {
  list-style: none; padding: 0; margin: 0 0 26px;
  display: flex; flex-direction: column; gap: 12px;
}
.aio-points li {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #33404f;
}
.aio-points svg { color: var(--accent); }

.aio-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; border-radius: 12px;
  background: var(--accent); color: #fff;
  font-size: 14.5px; font-weight: 700; text-decoration: none;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--accent) 32%, transparent);
  transition: filter 0.2s ease, transform 0.2s ease;
}
.aio-cta:hover { filter: brightness(1.06); transform: translateY(-1px); }

.aio-trust {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: clamp(24px,5vw,56px); margin-top: clamp(44px,6vw,64px);
}
.aio-trust-item { display: flex; align-items: center; gap: 12px; }
.aio-trust-icon {
  width: 42px; height: 42px; flex: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.aio-trust-title { display: block; font-size: 13.5px; font-weight: 700; color: #0f172a; }
.aio-trust-desc { display: block; font-size: 12px; color: #6b7688; }

@keyframes aioCard {
  0% { opacity: 0; transform: translateY(36px) scale(0.94); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes aioPill {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .aio-card, .aio-pill { animation: none; }
  .aio-card:hover { transform: none; }
}
`;
