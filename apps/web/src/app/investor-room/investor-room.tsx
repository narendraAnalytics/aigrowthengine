"use client";

import { useEffect, useState } from "react";

import { InvestorAccessForm } from "./investor-access-form";
import { Reveal } from "./reveal";

/**
 * The Investor Room (V1) — a public, self-contained investor presentation.
 *
 * Deliberately a different design language from the Business Growth / AI Ideas
 * flows: a dark, sophisticated hero that transitions into bright, spacious
 * sections. Hard-coded palette + scoped <style> so it renders identically
 * regardless of the site's dark-by-default theme (same pattern as
 * `ai-opportunities-options.tsx`).
 *
 * Every claim here is qualitative or points at the live platform. No invented
 * traction, market-size, valuation or funding numbers (see imagesurl.txt).
 */

const NAV = [
  ["overview", "Overview"],
  ["opportunity", "Opportunity"],
  ["platform", "Platform"],
  ["technology", "Technology"],
  ["traction", "Traction"],
  ["roadmap", "Roadmap"],
  ["investment", "Investment"],
] as const;

const CAPABILITIES = [
  "AI Opportunity Engine",
  "AI Automation",
  "AI Agents",
  "AI Security & TRiSM",
];

const FLOW = [
  "Business Challenge",
  "AI Opportunity",
  "Automation / Agent",
  "Secure Deployment",
  "Measurable Value",
  "Scale",
];

const PLATFORM = [
  {
    tag: "01",
    title: "AI Opportunity Engine",
    desc: "Identify where AI can create measurable business value — an explainable assessment that matches a real problem to a capability we can deliver.",
  },
  {
    tag: "02",
    title: "AI Automation",
    desc: "Turn repetitive, rules-heavy workflows into intelligent automated processes that stay auditable end to end.",
  },
  {
    tag: "03",
    title: "AI Agents",
    desc: "Agents that reason, call systems and execute controlled workflows — always with a recorded human approval on outbound actions.",
  },
  {
    tag: "04",
    title: "AI Security & TRiSM",
    desc: "Make AI and agentic systems secure, governed, observable and trustworthy — identity, policy and audit built into the journey.",
  },
];

const STACK = [
  "Next.js",
  "FastAPI",
  "Python",
  "PostgreSQL + pgvector",
  "LLM (structured output)",
  "Cloud infrastructure",
  "AI governance",
];

const WHY = [
  {
    n: "01",
    title: "Business-first AI",
    desc: "We start with the business problem, not the technology.",
  },
  {
    n: "02",
    title: "Discovery to deployment",
    desc: "We don't stop at recommendations — we take opportunities toward pilots and implementation.",
  },
  {
    n: "03",
    title: "AI + security together",
    desc: "Governance and security are designed into the AI journey, not bolted on afterward.",
  },
  {
    n: "04",
    title: "Reusable capabilities",
    desc: "Solutions, workflows and learnings compound into a reusable capability library.",
  },
  {
    n: "05",
    title: "Long-term expansion",
    desc: "Discovery → automation → agents → AI security → TRiSM → enterprise AI.",
  },
];

const PROGRESS = [
  {
    title: "Foundation",
    desc: "Architecture, security model, capability library and data contracts in place.",
    live: true,
  },
  {
    title: "Platform development",
    desc: "Next.js PWA, multi-tenant auth, deterministic scoring engine.",
    live: true,
  },
  {
    title: "AI Opportunity Engine",
    desc: "End-to-end assessment → explainable match → qualified opportunity. Live today.",
    live: true,
  },
  {
    title: "AI Ideas Engine",
    desc: "A parallel engine that pressure-tests new ideas into a BUILD / REFINE / VALIDATE / RETHINK verdict. Live today.",
    live: true,
  },
  {
    title: "Business validation",
    desc: "Real businesses through the funnel → consultation → paid pilot → case study.",
    live: false,
  },
  {
    title: "AI Agents",
    desc: "Controlled agentic workflows with human-in-the-loop approval.",
    live: false,
  },
  {
    title: "AI Security / TRiSM",
    desc: "Trust, risk and security management as a first-class product surface.",
    live: false,
  },
];

const ROADMAP = [
  [
    "AI Opportunity Discovery",
    "Find where AI creates measurable value — live today.",
  ],
  [
    "AI Automation",
    "Convert validated opportunities into automated workflows.",
  ],
  ["AI Agents", "Agentic execution across connected business systems."],
  ["AI Security", "Identity, policy and audit for every AI and agent action."],
  [
    "TRiSM & Governance",
    "Trust, risk and security management as a managed layer.",
  ],
  [
    "Enterprise AI Platform",
    "One governed platform from discovery to deployment.",
  ],
  ["Global Scale", "Repeatable delivery across verticals and regions."],
];

const REVENUE = [
  "AI consulting",
  "Solution development",
  "Automation implementation",
  "AI agent development",
  "AI security / TRiSM",
  "Managed AI services",
  "Platform / software",
];

const VALUE_FLOW = [
  "AI Discovery",
  "Consultation",
  "Solution Design",
  "Pilot",
  "Implementation",
  "Recurring Engagement",
];

const USE_OF_FUNDS = [
  ["Product & AI development", 92],
  ["Go-to-market", 68],
  ["Engineering & talent", 58],
  ["AI security / TRiSM", 44],
  ["Market expansion", 38],
] as const;

function useActiveSection() {
  const [active, setActive] = useState<string>("overview");
  useEffect(() => {
    const ids = NAV.map(([id]) => id);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return active;
}

export function InvestorRoom() {
  const active = useActiveSection();

  return (
    <div className="ir-root">
      <style>{STYLES}</style>

      <header className="ir-nav">
        <a href="/ai-opportunities" className="ir-nav-back">
          <span aria-hidden>←</span> Options
        </a>
        <a href="#overview" className="ir-nav-brand">
          <span className="ir-nav-dot" aria-hidden />
          AI Growth Engine
          <span className="ir-nav-sub">Investor Room</span>
        </a>
        <nav className="ir-nav-links">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? "is-active" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
        <a href="#investor-access" className="ir-btn ir-btn-nav">
          Request Investor Access
        </a>
      </header>

      {/* ---------------------------------------------------------- hero --- */}
      <section id="overview" className="ir-hero">
        <div className="ir-hero-bg" aria-hidden />
        <div className="ir-hero-grid" aria-hidden />
        <div className="ir-hero-inner">
          <span className="ir-eyebrow">Investor Room</span>
          <h1>
            Building the Infrastructure for{" "}
            <span className="ir-grad">AI-Powered Business Growth</span>
          </h1>
          <p className="ir-hero-sub">
            We help businesses discover where AI can create measurable value —
            then turn those opportunities into secure, scalable solutions.
          </p>
          <div className="ir-chips">
            {CAPABILITIES.map((c, i) => (
              <span
                key={c}
                className="ir-chip"
                style={{ animationDelay: `${0.15 + i * 0.09}s` }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="ir-hero-cta">
            <a href="#opportunity" className="ir-btn ir-btn-ghost">
              Explore the company
            </a>
            <a href="#investor-access" className="ir-btn ir-btn-primary">
              Request Investor Access →
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- opportunity --- */}
      <section id="opportunity" className="ir-section">
        <Reveal>
          <p className="ir-kicker">The Opportunity</p>
          <h2>
            AI adoption is accelerating — value discovery is the bottleneck
          </h2>
          <p className="ir-lead">
            Businesses are moving from AI experimentation toward practical
            deployment. The hard part is no longer discovering AI — it is
            identifying where AI creates measurable business value and
            implementing it securely.
          </p>
        </Reveal>
        <Reveal className="ir-flow" delay={100}>
          {FLOW.map((step, i) => (
            <span key={step} className="ir-flow-step">
              {step}
              {i < FLOW.length - 1 ? (
                <span className="ir-flow-arrow" aria-hidden>
                  →
                </span>
              ) : null}
            </span>
          ))}
        </Reveal>
      </section>

      {/* ----------------------------------------------------- platform --- */}
      <section id="platform" className="ir-section ir-section-tint">
        <Reveal>
          <p className="ir-kicker">Our Platform</p>
          <h2>One platform, four connected capabilities</h2>
          <p className="ir-lead">
            An AI-powered business growth platform that connects business
            problems with AI opportunities, solutions and implementation.
          </p>
        </Reveal>
        <div className="ir-cards">
          {PLATFORM.map((p, i) => (
            <Reveal
              as="article"
              key={p.title}
              className="ir-card"
              delay={i * 80}
            >
              <span className="ir-card-tag">{p.tag}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- technology --- */}
      <section id="technology" className="ir-section">
        <Reveal>
          <p className="ir-kicker">Technology</p>
          <h2>Technology built for the AI era</h2>
          <p className="ir-lead">
            The question that matters to an investor is what the technology
            enables — not which library it uses. Ours is modern, secure,
            scalable and AI-native.
          </p>
        </Reveal>

        <Reveal className="ir-arch" delay={80}>
          <div className="ir-arch-top">AI Business Platform</div>
          <div className="ir-arch-row">
            {["AI Opportunity", "AI Automation", "AI Agents"].map((n) => (
              <span key={n} className="ir-arch-node">
                {n}
              </span>
            ))}
          </div>
          <div className="ir-arch-spine">
            <span>AI Security</span>
            <span>TRiSM</span>
            <span>Enterprise AI</span>
          </div>
        </Reveal>

        <Reveal className="ir-stack" delay={120}>
          {STACK.map((s) => (
            <span key={s} className="ir-stack-item">
              {s}
            </span>
          ))}
        </Reveal>
      </section>

      {/* -------------------------------------------------------- trust --- */}
      <section className="ir-section ir-section-dark">
        <Reveal>
          <p className="ir-kicker ir-kicker-light">The Differentiator</p>
          <h2>AI that businesses can trust</h2>
          <p className="ir-lead ir-lead-light">
            Our long-term vision is not simply to make businesses AI-powered. It
            is to make AI-powered businesses secure, governed and scalable.
          </p>
        </Reveal>
        <Reveal className="ir-trust" delay={90}>
          {["Identity", "Policy", "Audit"].map((n) => (
            <span key={n} className="ir-trust-node">
              {n}
            </span>
          ))}
          <span className="ir-trust-arrow" aria-hidden>
            ↓
          </span>
          <span className="ir-trust-core">TRiSM</span>
          <span className="ir-trust-arrow" aria-hidden>
            ↓
          </span>
          <span className="ir-trust-out">Enterprise Adoption</span>
        </Reveal>
      </section>

      {/* --------------------------------------------------- business ----- */}
      <section id="business" className="ir-section ir-section-tint">
        <Reveal>
          <p className="ir-kicker">Business Model</p>
          <h2>How we create value</h2>
        </Reveal>
        <Reveal className="ir-flow" delay={80}>
          {VALUE_FLOW.map((step, i) => (
            <span key={step} className="ir-flow-step">
              {step}
              {i < VALUE_FLOW.length - 1 ? (
                <span className="ir-flow-arrow" aria-hidden>
                  →
                </span>
              ) : null}
            </span>
          ))}
        </Reveal>
        <Reveal className="ir-pills" delay={120}>
          {REVENUE.map((r) => (
            <span key={r} className="ir-pill">
              {r}
            </span>
          ))}
        </Reveal>
        <Reveal>
          <p className="ir-note">
            Revenue streams reflect a services-led model today;
            platform/software revenue grows as reusable capabilities mature. We
            do not claim recurring SaaS revenue we do not yet have.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------- why we win ----- */}
      <section className="ir-section">
        <Reveal>
          <p className="ir-kicker">Competitive Advantage</p>
          <h2>Why we can win</h2>
        </Reveal>
        <div className="ir-why">
          {WHY.map((w, i) => (
            <Reveal as="div" key={w.n} className="ir-why-item" delay={i * 70}>
              <span className="ir-why-n">{w.n}</span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- traction ------ */}
      <section id="traction" className="ir-section ir-section-tint">
        <Reveal>
          <p className="ir-kicker">Traction</p>
          <h2>Our progress</h2>
          <p className="ir-lead">
            Evidence over adjectives. The platform runs end to end today — the
            fastest way to judge execution is to use it.
          </p>
          <a
            href="/ai-opportunities"
            className="ir-btn ir-btn-ghost ir-btn-dark"
          >
            Try the live platform →
          </a>
        </Reveal>
        <div className="ir-timeline">
          {PROGRESS.map((p, i) => (
            <Reveal
              as="div"
              key={p.title}
              className="ir-tl-item"
              delay={i * 60}
            >
              <span
                className={`ir-tl-dot ${p.live ? "is-live" : ""}`}
                aria-hidden
              />
              <div>
                <h3>
                  {p.title}
                  {p.live ? <span className="ir-tl-badge">Live</span> : null}
                </h3>
                <p>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- roadmap ------ */}
      <section id="roadmap" className="ir-section">
        <Reveal>
          <p className="ir-kicker">Roadmap</p>
          <h2>Discovery → Enterprise AI</h2>
        </Reveal>
        <div className="ir-roadmap">
          {ROADMAP.map(([title, desc], i) => (
            <Reveal as="div" key={title} className="ir-rm-item" delay={i * 60}>
              <span className="ir-rm-step">{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ investment ------ */}
      <section id="investment" className="ir-section ir-section-dark">
        <Reveal>
          <p className="ir-kicker ir-kicker-light">Investment Opportunity</p>
          <h2>We&apos;re building the next layer of business AI</h2>
          <p className="ir-lead ir-lead-light">
            We are exploring strategic investment partnerships to accelerate
            product development, market expansion and AI capabilities. We are
            not publishing a round size or valuation here — those are shared
            directly with qualified partners.
          </p>
        </Reveal>
        <Reveal className="ir-funds" delay={90}>
          <p className="ir-funds-title">Indicative use of capital</p>
          {USE_OF_FUNDS.map(([label, pct]) => (
            <div key={label} className="ir-fund-row">
              <span>{label}</span>
              <span className="ir-fund-bar" aria-hidden>
                <span style={{ width: `${pct}%` }} />
              </span>
            </div>
          ))}
          <p className="ir-funds-note">
            Relative emphasis only — final allocation is set with our investment
            partners.
          </p>
        </Reveal>
      </section>

      {/* --------------------------------------------- access form ------- */}
      <section id="investor-access" className="ir-section ir-section-form">
        <Reveal>
          <p className="ir-kicker">Request Investor Access</p>
          <h2>Tell us a little about yourself</h2>
          <p className="ir-lead">
            Interested in learning more about our company and the investment
            opportunity? Share a few details and we&apos;ll follow up with the
            appropriate materials.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <InvestorAccessForm />
        </Reveal>
      </section>

      <footer className="ir-footer">
        <p>
          AI Growth Engine — turning business challenges into growth
          opportunities.
        </p>
        <p className="ir-footer-fine">
          This page is informational and does not constitute an offer to sell or
          a solicitation of an offer to buy any securities.
        </p>
      </footer>
    </div>
  );
}

/* --------------------------------------------------------------- styles --- */

const STYLES = `
.ir-root {
  --ink: #141d38;
  --ink-2: #1b2547;
  --ink-soft: #22305a;
  --paper: #ffffff;
  --tint: #f5f7fb;
  --line: rgba(15,23,42,0.10);
  --text: #1b2436;
  --muted: #5b6577;
  --accent: #7c3aed;
  --accent-2: #ec4899;
  --gold: #e3a83f;
  color: var(--text);
  background: var(--paper);
  font-synthesis-weight: none;
  -webkit-font-smoothing: antialiased;
}
.ir-root h2 {
  font-size: clamp(1.7rem, 3.4vw, 2.6rem);
  line-height: 1.1; letter-spacing: -0.02em; font-weight: 800;
  margin: 0 0 18px; color: inherit;
}
.ir-root h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 6px; }
.ir-root p { margin: 0; }

/* nav */
.ir-nav {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; gap: 20px;
  padding: 12px clamp(16px, 4vw, 44px);
  background: linear-gradient(180deg, rgba(30,41,78,0.66), rgba(18,26,52,0.44));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.10);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 12px 34px -14px rgba(6,10,26,0.6);
  animation: irNavIn 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.ir-nav-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 600; text-decoration: none;
  color: rgba(255,255,255,0.6); white-space: nowrap;
  padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.16);
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}
.ir-nav-back:hover {
  color: #fff; background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.28);
}
.ir-nav-back span { font-size: 1rem; line-height: 1; }
.ir-nav-brand {
  display: flex; align-items: center; gap: 9px;
  font-weight: 700; font-size: 0.92rem; color: #fff; text-decoration: none;
  white-space: nowrap;
}
.ir-nav-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 14px rgba(124,58,237,0.7);
  animation: irPulse 2.8s ease-in-out infinite;
}
.ir-nav-sub {
  color: rgba(255,255,255,0.5); font-weight: 500; font-size: 0.8rem;
  padding-left: 9px; margin-left: 3px; border-left: 1px solid rgba(255,255,255,0.18);
}
.ir-nav-links {
  display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap;
}
.ir-nav-links a {
  color: rgba(255,255,255,0.62); text-decoration: none;
  font-size: 0.82rem; font-weight: 500; padding: 6px 10px; border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}
.ir-nav-links a:hover { color: #fff; }
.ir-nav-links a.is-active {
  color: #fff;
  background: linear-gradient(135deg, rgba(124,58,237,0.30), rgba(236,72,153,0.24));
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14);
}

.ir-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-weight: 700; font-size: 0.9rem; text-decoration: none; cursor: pointer;
  border-radius: 12px; padding: 12px 22px; border: 1px solid transparent;
  transition: transform 0.18s ease, filter 0.18s ease, background 0.18s ease;
}
.ir-btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff; box-shadow: 0 12px 30px rgba(124,58,237,0.34);
}
.ir-btn-primary:hover { transform: translateY(-1px); filter: brightness(1.07); }
.ir-btn-primary:disabled { opacity: 0.6; cursor: default; transform: none; }
.ir-btn-ghost {
  background: rgba(255,255,255,0.06); color: #fff;
  border-color: rgba(255,255,255,0.22);
}
.ir-btn-ghost:hover { background: rgba(255,255,255,0.12); }
.ir-btn-dark {
  color: var(--text); border-color: var(--line); background: #fff;
}
.ir-btn-dark:hover { background: var(--tint); }
.ir-btn-nav {
  margin-left: 4px; padding: 9px 15px; font-size: 0.8rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff; white-space: nowrap;
}
.ir-btn-nav:hover { filter: brightness(1.08); }

/* hero */
.ir-hero {
  position: relative; overflow: hidden;
  color: #fff;
  background:
    radial-gradient(125% 120% at 50% 0%, #22305a 0%, #16204010 40%, transparent 70%),
    linear-gradient(180deg, #1b2547 0%, #141d38 60%, #101833 100%);
  padding: clamp(80px, 13vw, 160px) clamp(20px, 5vw, 64px) clamp(90px, 12vw, 150px);
}
.ir-hero-bg {
  position: absolute; inset: -30% -10% auto -10%; height: 130%;
  background:
    radial-gradient(42% 48% at 15% 16%, rgba(139,92,246,0.50), transparent 62%),
    radial-gradient(40% 44% at 88% 12%, rgba(236,72,153,0.42), transparent 63%),
    radial-gradient(48% 44% at 68% 92%, rgba(56,189,248,0.22), transparent 62%),
    radial-gradient(38% 40% at 42% 58%, rgba(227,168,63,0.12), transparent 62%);
  animation: irDrift 22s ease-in-out infinite alternate;
}
.ir-hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent 85%);
}
.ir-hero-inner { position: relative; max-width: 880px; margin: 0 auto; text-align: center; }
.ir-hero-inner > * { animation: irHeroUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) both; }
.ir-hero-inner > *:nth-child(1) { animation-delay: 0.06s; }
.ir-hero-inner > *:nth-child(2) { animation-delay: 0.14s; }
.ir-hero-inner > *:nth-child(3) { animation-delay: 0.22s; }
.ir-hero-inner > *:nth-child(4) { animation-delay: 0.30s; }
.ir-hero-inner > *:nth-child(5) { animation-delay: 0.38s; }
.ir-hero h1 {
  font-size: clamp(2.2rem, 6vw, 4.1rem); line-height: 1.05;
  letter-spacing: -0.03em; font-weight: 800; margin: 18px 0 20px;
}
.ir-grad {
  background: linear-gradient(100deg, #c4b5fd, #f0abfc 42%, #fcd34d 72%, #c4b5fd 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: irShimmer 9s linear infinite;
}
.ir-hero-sub {
  font-size: clamp(1rem, 1.7vw, 1.25rem); line-height: 1.6;
  color: rgba(255,255,255,0.72); max-width: 620px; margin: 0 auto;
}
.ir-eyebrow {
  display: inline-block; font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(255,255,255,0.55);
  padding: 7px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 100px;
}
.ir-chips {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
  margin: 28px 0 34px;
}
.ir-chip {
  font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.88);
  padding: 8px 16px; border-radius: 100px;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
  opacity: 0; animation: irChip 0.6s ease forwards;
}
.ir-hero-cta { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }

/* sections */
.ir-section {
  max-width: 1080px; margin: 0 auto;
  padding: clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px);
}
.ir-section-tint { max-width: none; background: var(--tint); }
.ir-section-tint > * { max-width: 1080px; margin-left: auto; margin-right: auto; }
.ir-section-dark {
  max-width: none; color: #fff;
  background:
    radial-gradient(80% 120% at 100% 0%, rgba(236,72,153,0.16), transparent 55%),
    radial-gradient(70% 120% at 0% 100%, rgba(124,58,237,0.18), transparent 55%),
    linear-gradient(180deg, var(--ink-2), var(--ink));
}
.ir-section-dark > * { max-width: 1080px; margin-left: auto; margin-right: auto; }
.ir-section-form { max-width: 860px; }

.ir-kicker {
  font-size: 0.74rem; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 12px;
}
.ir-kicker-light { color: #d8b4fe; }
.ir-lead {
  font-size: clamp(1rem, 1.5vw, 1.15rem); line-height: 1.65;
  color: var(--muted); max-width: 640px;
}
.ir-lead-light { color: rgba(255,255,255,0.72); }
.ir-note, .ir-funds-note, .ir-form-fine {
  font-size: 0.82rem; color: var(--muted); line-height: 1.6; margin-top: 16px;
  max-width: 620px;
}

/* reveal */
.ir-reveal {
  opacity: 0; transform: translateY(26px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.ir-reveal.is-in { opacity: 1; transform: none; }

/* flow */
.ir-flow {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px 4px;
  margin-top: 34px;
}
.ir-flow-step {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 11px 16px; border-radius: 12px;
  background: var(--paper); border: 1px solid var(--line);
  font-size: 0.85rem; font-weight: 600; color: var(--text);
  box-shadow: 0 6px 18px rgba(16,24,40,0.05);
}
.ir-section-tint .ir-flow-step { background: #fff; }
.ir-flow-arrow { color: var(--accent); font-weight: 700; }

/* cards */
.ir-cards {
  display: grid; gap: 20px; margin-top: 40px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.ir-card {
  padding: 26px 24px; border-radius: 18px; background: #fff;
  border: 1px solid var(--line); box-shadow: 0 14px 40px rgba(16,24,40,0.07);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.ir-card:hover { transform: translateY(-6px); box-shadow: 0 26px 56px rgba(16,24,40,0.13); }
.ir-card-tag {
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em;
  color: var(--accent);
}
.ir-card h3 { margin: 10px 0 8px; }
.ir-card p { font-size: 0.9rem; line-height: 1.6; color: var(--muted); }

/* architecture */
.ir-arch {
  margin-top: 40px; padding: 32px; border-radius: 20px;
  background: linear-gradient(180deg, var(--ink-2), var(--ink));
  color: #fff; text-align: center;
}
.ir-arch-top {
  display: inline-block; padding: 10px 22px; border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  font-weight: 700; font-size: 0.9rem;
}
.ir-arch-row {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
  margin: 22px 0;
}
.ir-arch-node {
  padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16);
}
.ir-arch-spine {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.ir-arch-spine span {
  font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.78);
  position: relative; padding-top: 20px;
}
.ir-arch-spine span::before {
  content: ""; position: absolute; top: 0; left: 50%; width: 1px; height: 12px;
  background: rgba(255,255,255,0.3);
}
.ir-stack {
  display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px;
}
.ir-stack-item {
  font-size: 0.8rem; font-weight: 600; color: var(--muted);
  padding: 8px 14px; border-radius: 100px; border: 1px solid var(--line);
  background: #fff;
}

/* trust diagram */
.ir-trust {
  margin-top: 36px; display: flex; flex-direction: column; align-items: center;
  gap: 12px;
}
.ir-trust-node, .ir-trust-core, .ir-trust-out {
  padding: 11px 20px; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
}
.ir-trust { position: relative; }
.ir-trust-node {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
  color: #fff;
}
.ir-trust > .ir-trust-node { display: inline-block; margin: 0 5px; }
.ir-trust-core {
  background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff;
}
.ir-trust-out { background: rgba(227,168,63,0.16); color: #ffd98a; border: 1px solid rgba(227,168,63,0.3); }
.ir-trust-arrow { color: rgba(255,255,255,0.5); }

/* pills */
.ir-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.ir-pill {
  font-size: 0.82rem; font-weight: 600; color: var(--text);
  padding: 9px 16px; border-radius: 100px; background: #fff;
  border: 1px solid var(--line);
}

/* why */
.ir-why {
  display: grid; gap: 4px; margin-top: 34px;
}
.ir-why-item {
  display: flex; gap: 20px; padding: 22px 6px;
  border-top: 1px solid var(--line);
}
.ir-why-item:last-child { border-bottom: 1px solid var(--line); }
.ir-why-n {
  font-size: 1.1rem; font-weight: 800; color: var(--accent);
  flex: none; width: 44px;
}
.ir-why-item p { color: var(--muted); font-size: 0.92rem; line-height: 1.6; }

/* timeline */
.ir-timeline { margin-top: 38px; display: grid; gap: 2px; }
.ir-tl-item {
  display: flex; gap: 18px; padding: 18px 0 18px 4px;
  position: relative;
}
.ir-tl-item::before {
  content: ""; position: absolute; left: 9px; top: 26px; bottom: -2px;
  width: 2px; background: var(--line);
}
.ir-tl-item:last-child::before { display: none; }
.ir-tl-dot {
  flex: none; width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--line); background: #fff; margin-top: 3px; z-index: 1;
}
.ir-tl-dot.is-live {
  border-color: var(--accent);
  background: radial-gradient(circle, var(--accent) 40%, #fff 45%);
}
.ir-tl-item h3 { display: flex; align-items: center; gap: 10px; }
.ir-tl-item p { color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
.ir-tl-badge, .ir-tl-item .ir-tl-badge {
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--accent);
  background: rgba(124,58,237,0.12); padding: 3px 8px; border-radius: 6px;
}

/* roadmap */
.ir-roadmap { margin-top: 36px; display: grid; gap: 12px; }
.ir-rm-item {
  display: flex; gap: 18px; padding: 18px 20px; border-radius: 14px;
  background: var(--tint); border: 1px solid var(--line);
}
.ir-rm-step {
  flex: none; width: 30px; height: 30px; border-radius: 8px;
  display: grid; place-items: center; font-weight: 800; font-size: 0.85rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff;
}
.ir-rm-item p { color: var(--muted); font-size: 0.9rem; line-height: 1.55; }

/* use of funds */
.ir-funds { margin-top: 34px; }
.ir-funds-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 16px; color: #fff; }
.ir-fund-row {
  display: grid; grid-template-columns: minmax(130px, 220px) 1fr; gap: 16px;
  align-items: center; margin-bottom: 12px; font-size: 0.85rem;
  color: rgba(255,255,255,0.82);
}
.ir-fund-bar {
  height: 10px; border-radius: 6px; background: rgba(255,255,255,0.10);
  overflow: hidden;
}
.ir-fund-bar span {
  display: block; height: 100%; border-radius: 6px; width: 0;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  transition: width 1s ease 0.2s;
}
.ir-reveal:not(.is-in) .ir-fund-bar span { width: 0 !important; }

/* form */
.ir-form { margin-top: 30px; display: flex; flex-direction: column; gap: 22px; }
.ir-form-grid {
  display: grid; gap: 18px; grid-template-columns: repeat(2, 1fr);
}
.ir-field { display: flex; flex-direction: column; gap: 7px; }
.ir-field-wide { grid-column: 1 / -1; }
.ir-field > span { font-size: 0.85rem; font-weight: 600; color: var(--text); }
.ir-field em { color: var(--accent); font-style: normal; }
.ir-field input, .ir-field select, .ir-field textarea {
  font: inherit; font-size: 0.9rem; color: var(--text);
  padding: 11px 13px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.ir-field input:focus, .ir-field select:focus, .ir-field textarea:focus {
  border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.18);
}
.ir-field small { color: #d64545; font-size: 0.78rem; }
.ir-checks { border: 0; padding: 0; margin: 0; }
.ir-checks legend {
  font-size: 0.85rem; font-weight: 600; color: var(--text); margin-bottom: 10px;
}
.ir-checks-grid {
  display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.ir-check {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  padding: 11px 14px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; font-size: 0.86rem;
}
.ir-check input { width: 16px; height: 16px; accent-color: var(--accent); }
.ir-form-error { color: #d64545; font-size: 0.85rem; }
.ir-form .ir-btn-primary { align-self: flex-start; }

/* thank you */
.ir-thanks {
  margin-top: 30px; padding: 40px 32px; border-radius: 20px;
  background: var(--tint); border: 1px solid var(--line); text-align: center;
}
.ir-thanks-mark {
  width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 18px;
  display: grid; place-items: center; font-size: 1.4rem; color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}
.ir-thanks h3 { font-size: 1.3rem; margin-bottom: 10px; }
.ir-thanks p { color: var(--muted); max-width: 460px; margin: 0 auto; line-height: 1.6; }
.ir-thanks-links {
  display: flex; flex-direction: column; gap: 8px; margin-top: 24px;
  align-items: center;
}
.ir-thanks-links span {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--muted);
}
.ir-thanks-links a { color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.9rem; }
.ir-thanks-links a:hover { text-decoration: underline; }

/* footer */
.ir-footer {
  background: var(--ink); color: rgba(255,255,255,0.7); text-align: center;
  padding: 44px 24px; font-size: 0.85rem; line-height: 1.7;
}
.ir-footer-fine { color: rgba(255,255,255,0.4); font-size: 0.76rem; margin-top: 8px; }

/* animations */
@keyframes irDrift {
  0% { transform: translate3d(0,0,0) scale(1); }
  100% { transform: translate3d(-4%, 3%, 0) scale(1.08); }
}
@keyframes irChip { to { opacity: 1; } }
@keyframes irNavIn {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: none; }
}
@keyframes irHeroUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}
@keyframes irShimmer { to { background-position: -220% 0; } }
@keyframes irPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(124,58,237,0.55); }
  50% { box-shadow: 0 0 22px rgba(236,72,153,0.9); }
}

@media (max-width: 860px) {
  .ir-nav-links { display: none; }
  .ir-form-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .ir-reveal { opacity: 1; transform: none; transition: none; }
  .ir-hero-bg { animation: none; }
  .ir-chip { opacity: 1; animation: none; }
  .ir-fund-bar span { transition: none; }
  .ir-nav, .ir-nav-dot, .ir-grad { animation: none; }
  .ir-hero-inner > * { animation: none; opacity: 1; transform: none; }
}
`;
