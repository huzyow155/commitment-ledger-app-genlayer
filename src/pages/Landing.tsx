import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Check,
  Copy,
  ExternalLink,
  Quote,
  Clock,
  Scale,
  AlertTriangle,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOY_TX,
  CONTRACT_SOURCE_SHA256,
  CONTRACT_SCHEMA_VERSION,
  NETWORK_STATUS,
  ALLOWED_DOMAINS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  CONTRACT_REPO_URL,
  APP_REPO_URL,
} from "../config/chain";
import {
  AlwayzzLines,
  AlwayzzTicker,
  AlwayzzTrustedSection,
  useScrollReveal,
} from "../components/AlwayzzAtmosphere";
import { BrandLogoMark } from "../components/Header";

export const Landing: React.FC = () => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [demoStep, setDemoStep] = useState<"typing" | "open" | "resolving" | "resolved">("resolved");

  useScrollReveal("landing");

  // Hero card cycling demo
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => {
        if (prev === "open") return "resolving";
        if (prev === "resolving") return "resolved";
        return "open";
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const integrationSnippet = `import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const CONTRACT_ADDRESS = "${CONTRACT_ADDRESS}";

// Read commitment record
const recordJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_commitment",
  args: ["1fe69a47c557"],
});
console.log(JSON.parse(recordJson));`;

  const copySnippet = () => {
    navigator.clipboard.writeText(integrationSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="bg-white text-[#0a0a0a]">
      {/* SECTION 1 (ODD - EDITORIAL): DIRECT PORT OF ALWAYZZ HERO WITH SERIF SLOW-REVEAL HEADLINE */}
      <section id="top" className="hero" data-theme="editorial">
        <AlwayzzLines variant="light" />

        <div className="hero-content">
          <AlwayzzTicker />

          <h1 className="hero-title">
            <span className="hero-word-reveal" style={{ "--word-index": 0 } as React.CSSProperties}>
              A public
            </span>{" "}
            <span className="hero-word-reveal" style={{ "--word-index": 1 } as React.CSSProperties}>
              ledger of
            </span>{" "}
            <span className="hero-word-reveal" style={{ "--word-index": 2 } as React.CSSProperties}>
              promises,
            </span>{" "}
            <span className="hero-word-reveal" style={{ "--word-index": 3 } as React.CSSProperties}>
              <span className="serif-word">resolved</span>
              <sup>{CONTRACT_SCHEMA_VERSION}</sup>
            </span>{" "}
            <span className="hero-word-reveal" style={{ "--word-index": 4 } as React.CSSProperties}>
              from cited
            </span>{" "}
            <span className="hero-word-reveal" style={{ "--word-index": 5 } as React.CSSProperties}>
              sources.
            </span>
          </h1>

          <p className="hero-subtitle hero-subtitle-reveal">
            Public commitments are sealed on GenLayer and evaluated through multi-validator consensus
            against allowlisted public reference sources with verbatim quoted evidence.
          </p>

          <div className="cta-row hero-cta-reveal">
            <Link className="primary-button" to="/app">
              Open the app <span aria-hidden="true">↗</span>
            </Link>
            <a className="booking-button" href="#how-it-works">
              <span className="booking-avatar" aria-hidden="true">§</span>
              <span className="booking-copy">
                <strong>Read how it works</strong>
                <span>
                  <i />
                  {NETWORK_STATUS}
                </span>
              </span>
            </a>
          </div>

          {/* Honest Ground Truth Disclaimer Callout */}
          <div className="hero-cta-reveal mx-auto mt-8 max-w-2xl rounded-full border border-black/10 bg-white/85 px-5 py-3 text-sm text-[#6b6b6b] backdrop-blur-sm shadow-sm">
            <strong className="text-[#0a0a0a]">Source-grounded verdict, not an oracle of truth:</strong>{" "}
            Evaluates what the cited allowlisted page asserts via verbatim quotes.
          </div>

          {/* Interactive Commitment Record Preview Card (excluded from scroll-reveal; cycles automatically) */}
          <div className="w-full mt-10 max-w-2xl text-left">
            <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white/95 p-6 sm:p-8 shadow-[0_18px_50px_rgba(10,10,10,0.08)] backdrop-blur-md transition-all">
              <div className="flex items-center justify-between border-b border-black/10 pb-4 text-xs sm:text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#6b6b6b] uppercase text-xs tracking-wider">LEDGER ID:</span>
                  <span className="font-semibold text-[#0a0a0a]">1fe69a47c557</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3.5 py-1 font-sans font-semibold text-xs uppercase tracking-wider ${
                      demoStep === "resolved"
                        ? "bg-[#0a0a0a] text-white"
                        : "border border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {demoStep === "resolved" ? "RESOLVED" : "OPEN"}
                  </span>
                  {demoStep === "resolved" && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-bold text-xs text-emerald-800">
                      ★ KEPT
                    </span>
                  )}
                </div>
              </div>

              <div className="my-5">
                <p className="font-serif text-xl leading-relaxed text-[#0a0a0a] sm:text-2xl">
                  &ldquo;The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.&rdquo;
                </p>
              </div>

              {demoStep === "resolving" && (
                <div className="my-4 rounded-2xl border border-sky-200 bg-sky-50/90 p-4 text-sm text-sky-950 animate-pulse">
                  Validators fetching Wikipedia (Apollo 11) & running strict_eq consensus cascade...
                </div>
              )}

              {demoStep === "resolved" && (
                <div className="my-4 rounded-2xl border border-black/10 border-l-4 border-l-[#0a0a0a] bg-[#fbfbfb] p-4 sm:p-5 text-sm">
                  <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-xs text-[#0a0a0a]">
                    <Quote size={14} />
                    <span>Verbatim Grounded Quote (Verified)</span>
                  </div>
                  <p className="mt-2 font-serif text-base italic text-[#0a0a0a] leading-relaxed">
                    &ldquo;Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon&rdquo;
                  </p>
                  <div className="mt-2.5 text-xs text-[#6b6b6b] break-all">
                    Source: <span className="font-mono text-[#0a0a0a] underline">https://en.wikipedia.org/wiki/Apollo_11</span>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-xs sm:text-sm text-[#6b6b6b]">
                <span>Deadline: <strong className="font-mono text-[#0a0a0a]">1970-01-01</strong></span>
                <span>Round: <strong className="font-mono text-[#0a0a0a]">1</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="progressive-blur" aria-hidden="true" />
      </section>

      {/* DIRECT PORT OF ALWAYZZ TRUSTED MARQUEE SECTION */}
      <AlwayzzTrustedSection />

      {/* SECTION 2 (EVEN - OCEAN BLUE): THE PROBLEM */}
      <section className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">01 / The Problem</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              Promises are made in public and <span className="serif-word">quietly</span> reinterpreted.
            </h2>
            <p
              className="reveal-on-scroll mt-5 text-base sm:text-lg text-[var(--ocean-muted)] leading-relaxed max-w-2xl mx-auto tracking-[-0.02em]"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              Whether it is a DAO steward roadmap pledge, an open-source milestone, or a protocol promise, traditional verification fails when words change.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div
              className="ocean-card p-7 sm:p-8 reveal-on-scroll"
              style={{ "--stagger": 0 } as React.CSSProperties}
            >
              <div className="text-xs font-mono font-bold text-[#8fcaf0]">01 / PARAPHRASE DODGING</div>
              <h3 className="mt-2.5 font-serif text-xl sm:text-2xl font-semibold text-[var(--ocean-text)]">
                Exact Hashing Breaks
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--ocean-muted)] leading-relaxed">
                Exact string hashes (keccak256) break if a single word or synonym shifts (*&ldquo;In September, the audit finished&rdquo;* vs *&ldquo;Audit before Q4&rdquo;*). Bad actors exploit slight phrasing shifts to dodge accountability.
              </p>
            </div>

            <div
              className="ocean-card p-7 sm:p-8 reveal-on-scroll"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              <div className="text-xs font-mono font-bold text-[#8fcaf0]">02 / CALLER CIRCULARITY</div>
              <h3 className="mt-2.5 font-serif text-xl sm:text-2xl font-semibold text-[var(--ocean-text)]">
                Caller-Written Text is Flawed
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--ocean-muted)] leading-relaxed">
                If the contract accepts evidence text written by the caller, a &ldquo;grounded quote&rdquo; only proves the quote is in caller-written text. The registrant can self-certify KEPT with self-authored text.
              </p>
            </div>

            <div
              className="ocean-card p-7 sm:p-8 reveal-on-scroll"
              style={{ "--stagger": 2 } as React.CSSProperties}
            >
              <div className="text-xs font-mono font-bold text-[#8fcaf0]">03 / NAIVE FUZZY MATCHING</div>
              <h3 className="mt-2.5 font-serif text-xl sm:text-2xl font-semibold text-[var(--ocean-text)]">
                Distractor Confusion
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--ocean-muted)] leading-relaxed">
                Naive fuzzy search conflates superficially similar topics (e.g. launching a preview faucet vs verified contracts). Semantic evaluation must verify both the same subject AND the exact action.
              </p>
            </div>
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 3 (ODD - EDITORIAL): WHAT IT DOES */}
      <section className="section-editorial py-24 px-4 sm:px-8" data-theme="editorial">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ticker-item inline-block mb-4 reveal-on-scroll">02 / Architecture</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[#0a0a0a] tracking-[-0.06em]">
              An intelligent notary backed by <span className="serif-word">consensus</span>.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              className="reveal-on-scroll rounded-[24px] border border-black/10 bg-[#fbfbfb] p-8"
              style={{ "--stagger": 0 } as React.CSSProperties}
            >
              <Scale size={24} className="text-[#0a0a0a]" />
              <h3 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[#0a0a0a]">
                Two-Phase Consensus
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#6b6b6b] leading-relaxed">
                At registration, consensus isolates a normalized canonical predicate (<code>subject</code> and <code>action</code>). At resolution, consensus compares the fetched source against that predicate.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-black/10 bg-[#fbfbfb] p-8"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              <Shield size={24} className="text-[#0a0a0a]" />
              <h3 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[#0a0a0a]">
                Allowlisted Source Fetch
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#6b6b6b] leading-relaxed">
                No caller supplies raw evidence text. Callers provide an allowlisted public source URL (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB). The contract fetches the page text directly through <code>gl.nondet.web.render</code>.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-black/10 bg-[#fbfbfb] p-8"
              style={{ "--stagger": 2 } as React.CSSProperties}
            >
              <Quote size={24} className="text-[#0a0a0a]" />
              <h3 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[#0a0a0a]">
                Grounded Verbatim Quotes
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#6b6b6b] leading-relaxed">
                Every resolved outcome requires an extracted quote that must be at least 12 characters and exist verbatim within the first 6,000 characters of the fetched page.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-black/10 bg-[#fbfbfb] p-8"
              style={{ "--stagger": 3 } as React.CSSProperties}
            >
              <Clock size={24} className="text-[#0a0a0a]" />
              <h3 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[#0a0a0a]">
                Deterministic Calendar Deadlines
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#6b6b6b] leading-relaxed">
                Mandatory calendar dates in <code>YYYY-MM-DD</code> format. Leap years and calendar limits are verified. The contract uses the deterministic chain clock and strictly refuses resolution before the deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 (EVEN - OCEAN BLUE): HOW IT WORKS (STEP PIPELINE) */}
      <section id="how-it-works" className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">03 / Protocol Mechanics</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              How It Works: <span className="serif-word">Step-by-Step</span>
            </h2>
          </div>

          <div className="mt-14 space-y-4">
            {[
              {
                step: "01",
                title: "Register Commitment",
                detail: "Submit statement (1..400 characters, pure ASCII) along with a strict calendar date deadline (YYYY-MM-DD). Wrapped inside <UNTRUSTED_TEXT> delimiters to protect against prompt injection.",
              },
              {
                step: "02",
                title: "Canonical Extraction by Consensus",
                detail: "Validators run multi-node extraction via gl.eq_principle.strict_eq to isolate normalized {subject, action}. Stored permanently on-chain in canonical JSON.",
              },
              {
                step: "03",
                title: "Deadline Date Passes",
                detail: "The contract checks gl.message_raw['datetime']. Resolution is refused before the specified date. Clock unavailability reverts the transaction.",
              },
              {
                step: "04",
                title: "Submit Allowlisted Source URL",
                detail: "Anyone provides an allowlisted URL. The contract validates protocol, port, ASCII domain, and absence of userinfo or IP literals.",
              },
              {
                step: "05",
                title: "Page Retrieval & 6,000-Char Bound",
                detail: "Validators fetch the target web page (gl.nondet.web.render) and truncate text to the first 6,000 characters to maintain deterministic bounds.",
              },
              {
                step: "06",
                title: "Strict Resolution Cascade",
                detail: "NOMATCH (distractor rejection) -> INVALID (unrecognized outcome) -> UNGROUNDED (quote missing or <12 chars) -> MATCH (accepted).",
              },
              {
                step: "07",
                title: "Permanent Ledger Storage",
                detail: "Outcome (KEPT, BROKEN, or PARTIAL) is sealed with verbatim quote, resolver address, and timestamp. Reverted calls leave the commitment OPEN.",
              },
            ].map((s, idx) => (
              <div
                key={s.step}
                className="ocean-card flex gap-4 p-6 sm:p-7 reveal-on-scroll"
                style={{ "--stagger": idx } as React.CSSProperties}
              >
                <span className="font-mono text-sm sm:text-base font-bold text-[#8fcaf0] shrink-0 pt-0.5">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ocean-text)]">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-[var(--ocean-muted)] leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 5 (ODD - EDITORIAL): WHY PARAPHRASE WORKS */}
      <section className="section-editorial py-24 px-4 sm:px-8" data-theme="editorial">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="ticker-item inline-block mb-4 reveal-on-scroll">04 / Semantic Equivalence</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[#0a0a0a] tracking-[-0.06em]">
              Why <span className="serif-word">Paraphrase</span> Verification Works
            </h2>
            <p
              className="reveal-on-scroll mt-5 text-base sm:text-lg text-[#6b6b6b] max-w-2xl mx-auto leading-relaxed"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              The same-commitment check is semantic: validators verify that the cited source describes the same subject and action even when sentence structure, synonyms, or dates are phrased differently.
            </p>
          </div>

          <div
            className="reveal-on-scroll mt-12 rounded-[24px] border border-black/10 bg-[#fbfbfb] p-7 sm:p-9 text-sm sm:text-base text-[#6b6b6b]"
            style={{ "--stagger": 2 } as React.CSSProperties}
          >
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0a0a0a]">
              Distractor Handling Example
            </h3>
            <p className="mt-3 leading-relaxed">
              Suppose a commitment states: <em>&ldquo;NASA will verify the James Webb Space Telescope deployment.&rdquo;</em>
              If someone attempts to resolve it using the Wikipedia page for <em>SpaceX Falcon 9</em>, validators evaluate the source as describing a different subject/action and agree on <code>NOMATCH</code>.
              The transaction reverts with <code>&ldquo;source does not match this commitment&rdquo;</code>, leaving the commitment completely unchanged in its <strong>OPEN</strong> state.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 (EVEN - OCEAN BLUE): GUARDRAILS TABLE */}
      <section className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">05 / Contract Guardrails</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              Deterministic Pre-Conditions & <span className="serif-word">Revert</span> Map
            </h2>
            <p
              className="reveal-on-scroll mt-4 text-base sm:text-lg text-[var(--ocean-muted)]"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              Every guardrail is enforced on-chain via <code>gl.vm.UserError</code> and mapped to a specific revert reason.
            </p>
          </div>

          <div className="mt-10 text-center reveal-on-scroll" style={{ "--stagger": 2 } as React.CSSProperties}>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--ocean-text)] block mb-3.5">
              7 Fixed Allowlisted Domains (subdomains allowed):
            </span>
            <div className="flex flex-wrap justify-center gap-2.5">
              {ALLOWED_DOMAINS.map((dom, idx) => (
                <span
                  key={dom}
                  className="ocean-pill font-mono text-xs sm:text-sm reveal-on-scroll"
                  style={{ "--stagger": idx } as React.CSSProperties}
                >
                  {dom}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 ocean-table-wrap reveal-on-scroll" style={{ "--stagger": 3 } as React.CSSProperties}>
            <table className="w-full text-left text-sm sm:text-[15px]">
              <thead className="ocean-table-head">
                <tr>
                  <th className="p-4 font-semibold">Guardrail Rule</th>
                  <th className="p-4 font-semibold">Requirement</th>
                  <th className="p-4 font-semibold">Revert String</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ocean-border)]">
                {[
                  ["URL Scheme", "Must be https:// only", "source_url scheme must be https"],
                  ["Domain Allowlist", "Fixed 7 domains or subdomains", "source_url domain not in authorized allowlist"],
                  ["Calendar Deadline", "Strict YYYY-MM-DD calendar days", "deadline_hint must be YYYY-MM-DD"],
                  ["Timing Guard", "current_date >= deadline_hint", "cannot resolve before deadline date"],
                  ["Quote Length & Verbatim", ">= 12 chars verbatim in first 6,000 chars", "no grounded quote in source"],
                  ["Outcome Classification", "Must be KEPT, BROKEN, or PARTIAL", "model returned no valid outcome"],
                  ["Single Resolution", "Status must be OPEN", "commitment already resolved"],
                ].map(([rule, req, rev], idx) => (
                  <tr
                    key={rule}
                    className="reveal-on-scroll"
                    style={{ "--stagger": idx } as React.CSSProperties}
                  >
                    <td className="p-4 font-medium text-[var(--ocean-text)]">{rule}</td>
                    <td className="p-4 text-[var(--ocean-muted)]">{req}</td>
                    <td className="p-4 font-mono text-[#a5d8ff]">{rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 7 (ODD - EDITORIAL): OUTCOMES EXPLAINED */}
      <section className="section-editorial py-24 px-4 sm:px-8" data-theme="editorial">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ticker-item inline-block mb-4 reveal-on-scroll">06 / Classification</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[#0a0a0a] tracking-[-0.06em]">
              Outcomes <span className="serif-word">Explained</span>
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="reveal-on-scroll rounded-[24px] border border-emerald-300/80 bg-emerald-50/50 p-6 sm:p-7"
              style={{ "--stagger": 0 } as React.CSSProperties}
            >
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800">★ KEPT</span>
              <h3 className="mt-2.5 font-serif text-lg sm:text-xl font-semibold text-emerald-950">
                Fulfilled
              </h3>
              <p className="mt-2.5 text-sm text-emerald-900 leading-relaxed">
                The cited source confirms that the stated subject performed the action on or before deadline. Permanent.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-rose-300/80 bg-rose-50/50 p-6 sm:p-7"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              <span className="font-mono text-xs sm:text-sm font-bold text-rose-800">★ BROKEN</span>
              <h3 className="mt-2.5 font-serif text-lg sm:text-xl font-semibold text-rose-950">
                Not Fulfilled
              </h3>
              <p className="mt-2.5 text-sm text-rose-900 leading-relaxed">
                The cited source confirms that the action was aborted, failed, or missed. Permanent.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-amber-300/80 bg-amber-50/50 p-6 sm:p-7"
              style={{ "--stagger": 2 } as React.CSSProperties}
            >
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-800">★ PARTIAL</span>
              <h3 className="mt-2.5 font-serif text-lg sm:text-xl font-semibold text-amber-950">
                Partial Scope
              </h3>
              <p className="mt-2.5 text-sm text-amber-900 leading-relaxed">
                Evidence confirms only a portion of compound clauses were completed. Permanent.
              </p>
            </div>

            <div
              className="reveal-on-scroll rounded-[24px] border border-black/10 bg-[#fbfbfb] p-6 sm:p-7"
              style={{ "--stagger": 3 } as React.CSSProperties}
            >
              <span className="font-mono text-xs sm:text-sm font-bold text-[#0a0a0a]">○ OPEN</span>
              <h3 className="mt-2.5 font-serif text-lg sm:text-xl font-semibold text-[#0a0a0a]">
                Awaiting Evidence
              </h3>
              <p className="mt-2.5 text-sm text-[#6b6b6b] leading-relaxed">
                Registered and awaiting resolution. All rejected resolution attempts preserve this state.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 (EVEN - OCEAN BLUE): EVIDENCE FROM STUDIONET */}
      <section id="evidence" className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">07 / On-Chain Record</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              Verified Studionet Evidence
            </h2>
            <p
              className="reveal-on-scroll mt-4 text-sm sm:text-base text-[var(--ocean-muted)] break-words"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              Executed on GenLayer Studionet with contract{" "}
              <code className="font-mono text-xs sm:text-sm text-[#a5d8ff] break-all">{CONTRACT_ADDRESS}</code>. Full 66-character hashes linked directly to the explorer.
            </p>
          </div>

          <div className="mt-12 ocean-table-wrap reveal-on-scroll" style={{ "--stagger": 2 } as React.CSSProperties}>
            <table className="w-full text-left text-sm sm:text-[15px]">
              <thead className="ocean-table-head">
                <tr>
                  <th className="p-4 font-semibold">Case</th>
                  <th className="p-4 font-semibold">Commitment ID</th>
                  <th className="p-4 font-semibold">Outcome / State</th>
                  <th className="p-4 font-semibold">Register Tx</th>
                  <th className="p-4 font-semibold">Resolve Tx</th>
                  <th className="p-4 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ocean-border)]">
                <tr className="reveal-on-scroll" style={{ "--stagger": 0 } as React.CSSProperties}>
                  <td className="p-4 font-medium text-[var(--ocean-text)]">Case A (Paraphrased)</td>
                  <td className="p-4 font-mono text-[#a5d8ff]">1fe69a47c557</td>
                  <td className="p-4">
                    <span className="ocean-chip-kept rounded-full px-3 py-1 font-bold text-xs">KEPT</span>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0xd61b23...7abd
                    </a>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0x54b64f...15c5
                    </a>
                  </td>
                  <td className="p-4 text-[var(--ocean-muted)]">en.wikipedia.org/wiki/Apollo_11</td>
                </tr>

                <tr className="reveal-on-scroll" style={{ "--stagger": 1 } as React.CSSProperties}>
                  <td className="p-4 font-medium text-[var(--ocean-text)]">Case B (Grounded Quote)</td>
                  <td className="p-4 font-mono text-[#a5d8ff]">605aa94797d3</td>
                  <td className="p-4">
                    <span className="ocean-chip-broken rounded-full px-3 py-1 font-bold text-xs">BROKEN</span>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0xae2cd4...3823
                    </a>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0xf04a89...e943
                    </a>
                  </td>
                  <td className="p-4 text-[var(--ocean-muted)]">en.wikipedia.org/wiki/Apollo_13</td>
                </tr>

                <tr className="reveal-on-scroll" style={{ "--stagger": 2 } as React.CSSProperties}>
                  <td className="p-4 font-medium text-[var(--ocean-text)]">Case C (Distractor Rejection)</td>
                  <td className="p-4 font-mono text-[#a5d8ff]">4efe7cbd0772</td>
                  <td className="p-4">
                    <span className="ocean-chip-revert rounded-full px-3 py-1 font-bold text-xs">REVERT (OPEN)</span>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0x588c25...aec2
                    </a>
                  </td>
                  <td className="p-4">
                    <a
                      href={getExplorerTxUrl("0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--ocean-text)] underline"
                    >
                      0x7dda2f...4a59
                    </a>
                  </td>
                  <td className="p-4 text-[var(--ocean-muted)]">en.wikipedia.org/wiki/Falcon_9</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            className="mt-8 ocean-card p-6 sm:p-8 reveal-on-scroll"
            style={{ "--stagger": 3 } as React.CSSProperties}
          >
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ocean-text)]">
              5 On-Chain Negative Rejection Tests (Decoded from Leader Receipts)
            </h3>
            <div className="mt-4 space-y-2.5 text-sm">
              {[
                {
                  label: "Non-allowlisted Domain (GitHub)",
                  hash: "0x5700f1c0b10574950bf94bd8b6fa5b8a19774fdc6d5e1b35c9c5f51712362516",
                  revert: "source_url domain not in authorized allowlist",
                },
                {
                  label: "Insecure Protocol (http://)",
                  hash: "0x39b53afc63f6280205fc802b6edc9716878fa1ed73e1677aace2cbf89caef1ef",
                  revert: "source_url scheme must be https",
                },
                {
                  label: "Free-text Deadline ('end of Q2')",
                  hash: "0x334a98052827dae100223ef13febac25f35b7ed06a766435e1bbb8f9730ede43",
                  revert: "deadline_hint must be YYYY-MM-DD",
                },
                {
                  label: "Premature Resolution (before deadline)",
                  hash: "0xbf92e012a6ba8d58288b1138d4b66be0f6a25cef8364ce7d19d2639bfee8c11a",
                  revert: "cannot resolve before deadline date",
                },
                {
                  label: "Double Resolution (already resolved)",
                  hash: "0x909b41a144f8469f9983e103aee508601a6b499e1ef6db5ac1ea759906e2c5d2",
                  revert: "commitment already resolved",
                },
              ].map((test, idx) => (
                <div
                  key={test.hash}
                  className="ocean-card-inner reveal-on-scroll flex flex-wrap items-center justify-between gap-2 rounded-xl p-3.5"
                  style={{ "--stagger": idx } as React.CSSProperties}
                >
                  <div>
                    <span className="font-medium text-[var(--ocean-text)]">{test.label}: </span>
                    <span className="font-mono text-[#a5d8ff]">&ldquo;{test.revert}&rdquo;</span>
                  </div>
                  <a
                    href={getExplorerTxUrl(test.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs sm:text-sm text-[var(--ocean-text)] underline"
                  >
                    {test.hash.slice(0, 10)}...{test.hash.slice(-8)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 9 (ODD - EDITORIAL): HONEST SCOPE BOX */}
      <section className="section-editorial py-24 px-4 sm:px-8" data-theme="editorial">
        <div className="mx-auto max-w-4xl">
          <div className="reveal-on-scroll rounded-[28px] border border-amber-300 bg-amber-50/70 p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <AlertTriangle size={26} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <h3 className="reveal-heading font-serif text-xl sm:text-2xl font-bold text-amber-950">
                  Honest Scope: On-Chain vs Unit Test Coverage
                </h3>
                <div className="mt-4 space-y-3 text-sm sm:text-base text-amber-950/90 leading-relaxed">
                  <p>
                    <strong>Verified on Studionet:</strong> KEPT, BROKEN, source mismatch (distractor rejection), and 5 rejection tests. Full 66-character transactions are recorded and verified.
                  </p>
                  <p>
                    <strong>Unit-Tested Branches:</strong> The PARTIAL outcome path, ungrounded-quote rejection (<code>&ldquo;no grounded quote in source&rdquo;</code>), and invalid-outcome rejection (<code>&ldquo;model returned no valid outcome&rdquo;</code>) are fully covered by unit tests only.
                  </p>
                  <p>
                    <strong>Validator Disagreement on Compound Statements:</strong> During studionet verification, three on-chain resolution attempts on commitment <code>8099a3b46652</code> (compound statement regarding Apollo 13) ended in validator disagreement (<code>UNDETERMINED</code>) and changed nothing. They are documented openly in the contract repo.
                  </p>
                  <p>
                    <strong>Length Limitations:</strong> Only the first 6,000 characters of a web page are read. Allowlist is fixed in the contract to 7 trusted reference domains. Studionet status is Preview.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 (EVEN - OCEAN BLUE): CONTRACT AND VERIFICATION FACTS */}
      <section className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">08 / Contract Verification</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              Contract Coordinates & <span className="serif-word">Audit</span>
            </h2>
          </div>

          <div
            className="mt-12 ocean-card p-7 sm:p-9 text-sm sm:text-base space-y-4 reveal-on-scroll"
            style={{ "--stagger": 1 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ocean-border)] pb-4">
              <span className="text-[var(--ocean-muted)]">Contract Address:</span>
              <div className="flex items-center gap-2 break-all">
                <span className="font-mono font-bold text-[var(--ocean-text)]">{CONTRACT_ADDRESS}</span>
                <button
                  type="button"
                  onClick={copyContract}
                  className="text-[var(--ocean-muted)] hover:text-white"
                  aria-label="Copy contract address"
                >
                  {copiedContract ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
                </button>
                <a
                  href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ocean-text)]"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ocean-border)] pb-4">
              <span className="text-[var(--ocean-muted)]">Deploy Transaction:</span>
              <a
                href={getExplorerTxUrl(CONTRACT_DEPLOY_TX)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#a5d8ff] underline break-all"
              >
                {CONTRACT_DEPLOY_TX}
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ocean-border)] pb-4">
              <span className="text-[var(--ocean-muted)]">Source Code SHA-256:</span>
              <span className="font-mono font-bold text-[var(--ocean-text)] break-all">
                {CONTRACT_SOURCE_SHA256}
              </span>
            </div>

            <div className="ocean-card-inner rounded-2xl p-5 text-[var(--ocean-muted)] leading-relaxed">
              <strong className="text-[var(--ocean-text)]">Source Verification Method:</strong> The contract source in <code>contracts-reference/CommitmentLedger.py</code> matches the on-chain deployment transaction data byte-for-byte. Verified by querying <code>eth_getTransactionByHash</code>, base64-decoding <code>result.data.contract_code</code>, and asserting SHA-256 equality.
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <a
                href={CONTRACT_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ocean-text)] underline font-medium"
              >
                Contract GitHub Repository →
              </a>
              <a
                href={APP_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ocean-text)] underline font-medium"
              >
                dApp GitHub Repository →
              </a>
            </div>
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 11 (ODD - EDITORIAL): INTEGRATION SNIPPET */}
      <section id="integration" className="section-editorial py-24 px-4 sm:px-8" data-theme="editorial">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="ticker-item inline-block mb-4 reveal-on-scroll">09 / Developers</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[#0a0a0a] tracking-[-0.06em]">
              Integration Code <span className="serif-word">(genlayer-js)</span>
            </h2>
            <p
              className="reveal-on-scroll mt-4 text-base sm:text-lg text-[#6b6b6b]"
              style={{ "--stagger": 1 } as React.CSSProperties}
            >
              This snippet executes directly against the deployed contract address on Studionet.
            </p>
          </div>

          <div
            className="reveal-on-scroll relative mt-10 rounded-[28px] border border-[#0a0a0a] bg-[#0a0a0a] p-6 sm:p-8 text-white shadow-2xl"
            style={{ "--stagger": 2 } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={copySnippet}
              className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm text-white hover:bg-white/25 transition"
            >
              {copiedSnippet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSnippet ? "Copied" : "Copy"}</span>
            </button>
            <pre className="overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-white/90 pt-3">
              {integrationSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 12 (EVEN - OCEAN BLUE): FAQ */}
      <section className="section-ocean py-28 px-4 sm:px-8" data-theme="ocean">
        <div className="ocean-seam-top" aria-hidden="true" />
        <AlwayzzLines variant="ocean" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="text-center">
            <span className="ocean-pill inline-block mb-4 reveal-on-scroll">10 / FAQ</span>
            <h2 className="reveal-heading font-sans text-[34px] sm:text-[52px] lg:text-[58px] leading-[1.06] font-semibold text-[var(--ocean-text)] tracking-[-0.06em]">
              Frequently Asked <span className="serif-word">Questions</span>
            </h2>
          </div>

          <div className="mt-14 space-y-4 text-sm sm:text-base text-[var(--ocean-muted)]">
            {[
              {
                q: "What if the cited source is inaccurate or biased?",
                a: "CommitmentLedger proves that validator consensus agreed the cited allowlisted page contained a verbatim grounded statement regarding the commitment. It does not arbitrate external world truth beyond what the allowlisted source asserts.",
              },
              {
                q: "What happens when validators disagree during resolution?",
                a: "If validators cannot achieve quorum (e.g. status UNDETERMINED or MAJORITY_DISAGREE), the transaction fails without mutating contract storage. The commitment remains in its previous state (OPEN), and callers can retry or supply a clearer source URL.",
              },
              {
                q: "Why is the deadline mandatory and formatted as YYYY-MM-DD?",
                a: "Vague terms like “by Q3” enable griefing and premature resolution. A strict calendar date ensures deterministic enforcement via the chain message clock: resolution cannot be front-run before the deadline date.",
              },
              {
                q: "Why is the domain allowlist fixed at the contract level?",
                a: "To prevent callers from publishing self-written evidence pages on platforms like GitHub, Pastebin, or personal blogs. The fixed list of 7 public references (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB) prevents circular self-certification.",
              },
              {
                q: "Can a commitment be resolved twice?",
                a: "No. Once a commitment transitions to RESOLVED, its status and outcome are permanent. Subsequent resolution attempts revert with “commitment already resolved”.",
              },
              {
                q: "Who can resolve a commitment?",
                a: "Any address can submit a resolution once the deadline date has arrived, provided they cite an allowlisted source URL that fulfills the semantic and grounded quote checks.",
              },
              {
                q: "Is this financial, legal, or investment advice?",
                a: "No. CommitmentLedger holds no funds, issues no tokens, and is deployed as an experimental intelligent contract on GenLayer Studionet (Preview).",
              },
            ].map((item, idx) => (
              <div
                key={item.q}
                className="ocean-card p-6 sm:p-7 reveal-on-scroll"
                style={{ "--stagger": idx } as React.CSSProperties}
              >
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ocean-text)]">
                  {item.q}
                </h3>
                <p className="mt-2.5 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ocean-seam-bottom" aria-hidden="true" />
      </section>

      {/* SECTION 13 (ODD - EDITORIAL): FOOTER */}
      <footer className="section-editorial py-14 px-4 sm:px-8 text-sm text-[#6b6b6b]" data-theme="editorial">
        <div className="reveal-on-scroll mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="wordmark">
              <BrandLogoMark className="wordmark-logo wordmark-logo-sm" variant="editorial" />
              <span style={{ fontSize: "24px" }}>CommitmentLedger</span>
              <sup>v3.1</sup>
            </span>
            <span>·</span>
            <span>GenLayer Studionet (Preview)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/app" className="hover:text-[#0a0a0a] transition">
              Workbench (/app)
            </Link>
            <a href={CONTRACT_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#0a0a0a] transition">
              Contract Repo
            </a>
            <a href={APP_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#0a0a0a] transition">
              App Repo
            </a>
            <a href={getExplorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className="hover:text-[#0a0a0a] transition">
              Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
