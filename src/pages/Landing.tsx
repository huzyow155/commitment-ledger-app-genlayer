import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Shield,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  Quote,
  Clock,
  Sparkles,
  Scale,
  FileCheck2,
  FileX2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOY_TX,
  CONTRACT_SOURCE_SHA256,
  CONTRACT_SCHEMA_VERSION,
  NETWORK_STATUS,
  ALLOWED_DOMAINS,
  SOURCE_TRUNCATION_LIMIT,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  CONTRACT_REPO_URL,
  APP_REPO_URL,
} from "../config/chain";
import { REVERT_MAP } from "../lib/revertMap";

export const Landing: React.FC = () => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [demoStep, setDemoStep] = useState<"typing" | "open" | "resolving" | "resolved">("resolved");

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

  // Ticker items inspired by Alwayzz
  const tickerServices = [
    "Public Accountability",
    "Source-Grounded Resolution",
    "Multi-Validator Consensus",
    "Allowlisted Citation",
    "Verbatim Evidence",
    "Intelligent Notary",
  ];

  return (
    <div className="relative overflow-x-hidden bg-[#FCFAF8] text-[#0E0E0D]">
      {/* SECTION 1: HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[840px] px-4 pt-20 pb-28 md:pt-28 md:pb-36 sm:px-8 overflow-hidden">
        {/* Atmospheric Background Inspired by Alwayzz */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(158,58,38,0.06),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.7),rgba(252,250,248,0.3)_45%,rgba(247,244,239,0.7))]" />
        
        {/* Ruled ledger motif background grid */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#E8E5DF_1px,transparent_1px),linear-gradient(to_bottom,#E8E5DF_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_20%,#000_65%,transparent_100%)] opacity-35" />

        {/* Ambient Pulsing Curved Lines from Alwayzz */}
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-0 hidden lg:flex" aria-hidden="true">
          {[...Array(14)].map((_, i) => (
            <span
              key={`left-curve-${i}`}
              className="curve-line rounded-r-full"
              style={{
                width: `${50 + i * 14}px`,
                animationDelay: `${i * 0.22}s`,
                borderLeft: "0",
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1.5 z-0 hidden lg:flex" aria-hidden="true">
          {[...Array(14)].map((_, i) => (
            <span
              key={`right-curve-${i}`}
              className="curve-line rounded-l-full"
              style={{
                width: `${50 + i * 14}px`,
                animationDelay: `${i * 0.22}s`,
                borderRight: "0",
              }}
            />
          ))}
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center">
          {/* Ticker / Pill Marquee from Alwayzz */}
          <div className="mask-marquee w-full max-w-[min(90vw,500px)] overflow-hidden mb-6 mx-auto">
            <div className="animate-marquee flex gap-2">
              {[...tickerServices, ...tickerServices].map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-[#E8E5DF] bg-white/90 px-3.5 py-1 text-[11px] font-medium text-[#6B6A65] tracking-tight whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Network and Schema Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E5DF] bg-[#F7F4EF] px-3.5 py-1 text-xs font-semibold text-[#0E0E0D] mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Deployed on {NETWORK_STATUS}</span>
            <span className="text-[#6B6A65]">·</span>
            <span className="font-mono text-[#9E3A26]">Schema {CONTRACT_SCHEMA_VERSION}</span>
          </div>

          {/* Editorial Headline with Source Serif 4 italic emphasis */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#0E0E0D] leading-[1.05] max-w-3xl">
            A public ledger of promises, resolved from <span className="italic font-semibold text-[#0E0E0D]">cited sources</span>.
          </h1>

          {/* Editorial Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base sm:text-lg text-[#6B6A65] leading-relaxed tracking-tight">
            Public commitments are made in the open and quietly renegotiated when deadlines pass.
            CommitmentLedger seals promises on GenLayer and resolves them through multi-validator consensus
            against allowlisted public reference sources with verbatim quoted evidence.
          </p>

          {/* Honest Ground Truth Disclaimer Callout */}
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-950 leading-relaxed shadow-sm">
            <strong>Source-grounded verdict, not an oracle of truth:</strong> The contract resolves commitments strictly from cited allowlisted pages with verified verbatim quotes. It evaluates what the source asserts—it does not claim omniscient real-world truth.
          </div>

          {/* Action CTAs: Pill Buttons inspired by Alwayzz */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Link
              to="/app"
              className="pill-button-primary text-sm shadow-md"
            >
              <span>Open the app</span>
              <ArrowUpRight size={17} />
            </Link>
            <a
              href="#how-it-works"
              className="pill-button-secondary text-sm"
            >
              <span>Read how it works</span>
              <ChevronDown size={17} />
            </a>
          </div>

          {/* Interactive Archival Commitment Preview Card (Cycles OPEN -> RESOLVED) */}
          <div className="w-full mt-14 max-w-2xl text-left">
            <div className="overflow-hidden rounded-3xl border border-[#E8E5DF] bg-white p-7 shadow-[0_12px_40px_-16px_rgba(20,20,19,0.08)] transition-all">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#6B6A65] uppercase text-[10px] tracking-wider">LEDGER ID:</span>
                  <span className="font-semibold text-[#0E0E0D]">1fe69a47c557</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 font-sans font-semibold text-[11px] uppercase tracking-wider ${
                      demoStep === "resolved"
                        ? "bg-[#0E0E0D] text-white"
                        : "border border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {demoStep === "resolved" ? "RESOLVED" : "OPEN"}
                  </span>
                  {demoStep === "resolved" && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-bold text-[11px] text-emerald-800">
                      ★ KEPT
                    </span>
                  )}
                </div>
              </div>

              <div className="my-5">
                <p className="font-serif text-lg leading-relaxed text-[#0E0E0D] sm:text-xl">
                  &ldquo;The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.&rdquo;
                </p>
              </div>

              {demoStep === "resolving" && (
                <div className="my-4 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 animate-pulse">
                  Validators fetching Wikipedia (Apollo 11) & running strict_eq consensus cascade...
                </div>
              )}

              {demoStep === "resolved" && (
                <div className="my-4 rounded-xl border border-[#E8E5DF] border-l-4 border-l-[#9E3A26] bg-[#FCFAF8] p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px] text-[#9E3A26]">
                    <Quote size={13} />
                    <span>Verbatim Grounded Quote (Verified)</span>
                  </div>
                  <p className="mt-1.5 font-serif text-sm italic text-[#0E0E0D] leading-relaxed">
                    &ldquo;Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon&rdquo;
                  </p>
                  <div className="mt-2.5 text-[11px] text-[#6B6A65]">
                    Source: <span className="font-mono text-[#9E3A26]">https://en.wikipedia.org/wiki/Apollo_11</span>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-[#E8E5DF] pt-4 text-xs text-[#6B6A65]">
                <span>Deadline: <strong className="font-mono text-[#0E0E0D]">1970-01-01</strong></span>
                <span>Round: <strong className="font-mono text-[#0E0E0D]">1</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Blur Bottom Fade from Alwayzz */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent via-[#FCFAF8]/40 to-[#FCFAF8] z-10"
          aria-hidden="true"
        />
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">The Problem</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Promises are made in public and quietly reinterpreted.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#6B6A65] leading-relaxed max-w-2xl mx-auto">
              Whether it is a DAO steward roadmap pledge, an open-source milestone, or a protocol promise, traditional verification fails when words change.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="notary-surface rounded-2xl p-7">
              <div className="text-[11px] font-mono font-bold text-[#9E3A26]">01 / PARAPHRASE DODGING</div>
              <h3 className="mt-2 font-serif text-lg font-semibold text-[#0E0E0D]">Exact Hashing Breaks</h3>
              <p className="mt-2.5 text-xs text-[#6B6A65] leading-relaxed">
                Exact string hashes (keccak256) break if a single word or synonym shifts (*&ldquo;In September, the audit finished&rdquo;* vs *&ldquo;Audit before Q4&rdquo;*). Bad actors exploit slight phrasing shifts to dodge accountability.
              </p>
            </div>

            <div className="notary-surface rounded-2xl p-7">
              <div className="text-[11px] font-mono font-bold text-[#9E3A26]">02 / CALLER CIRCULARITY</div>
              <h3 className="mt-2 font-serif text-lg font-semibold text-[#0E0E0D]">Caller-Written Text is Flawed</h3>
              <p className="mt-2.5 text-xs text-[#6B6A65] leading-relaxed">
                If the contract accepts evidence text written by the caller, a &ldquo;grounded quote&rdquo; only proves the quote is in caller-written text. The registrant can self-certify KEPT with self-authored text.
              </p>
            </div>

            <div className="notary-surface rounded-2xl p-7">
              <div className="text-[11px] font-mono font-bold text-[#9E3A26]">03 / NAIVE FUZZY MATCHING</div>
              <h3 className="mt-2 font-serif text-lg font-semibold text-[#0E0E0D]">Distractor Confusion</h3>
              <p className="mt-2.5 text-xs text-[#6B6A65] leading-relaxed">
                Naive fuzzy search conflates superficially similar topics (e.g. launching a preview faucet vs verified contracts). Semantic evaluation must verify both the same subject AND the exact action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT IT DOES */}
      <section className="py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">What It Does</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              An intelligent notary backed by validator consensus.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/50 p-8 hover:border-[#D1CDC4] transition">
              <Scale size={24} className="text-[#9E3A26]" />
              <h3 className="mt-3.5 font-serif text-xl font-semibold text-[#0E0E0D]">Two-Phase Consensus</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                At registration, consensus isolates a normalized canonical predicate (<code>subject</code> and <code>action</code>). At resolution, consensus compares the fetched source against that predicate.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/50 p-8 hover:border-[#D1CDC4] transition">
              <Shield size={24} className="text-[#9E3A26]" />
              <h3 className="mt-3.5 font-serif text-xl font-semibold text-[#0E0E0D]">Allowlisted Source Fetch</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                No caller supplies raw evidence text. Callers provide an allowlisted public source URL (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB). The contract fetches the page text directly through <code>gl.nondet.web.render</code>.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/50 p-8 hover:border-[#D1CDC4] transition">
              <Quote size={24} className="text-[#9E3A26]" />
              <h3 className="mt-3.5 font-serif text-xl font-semibold text-[#0E0E0D]">Grounded Verbatim Quotes</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                Every resolved outcome requires an extracted quote that must be at least 12 characters and exist verbatim within the first 6,000 characters of the fetched page.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/50 p-8 hover:border-[#D1CDC4] transition">
              <Clock size={24} className="text-[#9E3A26]" />
              <h3 className="mt-3.5 font-serif text-xl font-semibold text-[#0E0E0D]">Deterministic Calendar Deadlines</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                Mandatory calendar dates in <code>YYYY-MM-DD</code> format. Leap years and calendar limits are verified. The contract uses the deterministic chain clock and strictly refuses resolution before the deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS (STEP PIPELINE) */}
      <section id="how-it-works" className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Protocol Mechanics</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              How It Works: Step-by-Step
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
            ].map((s) => (
              <div key={s.step} className="flex gap-4 rounded-2xl border border-[#E8E5DF] bg-white p-5 sm:p-6 shadow-sm hover:border-[#D1CDC4] transition">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#9E3A26] shrink-0 pt-0.5">{s.step}</span>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">{s.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY PARAPHRASE WORKS */}
      <section className="py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Semantic Equivalence</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Why Paraphrase Verification Works
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#6B6A65] max-w-2xl mx-auto leading-relaxed">
              The same-commitment check is semantic: validators verify that the cited source describes the same subject and action even when sentence structure, synonyms, or dates are phrased differently.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/70 p-7 sm:p-8 text-xs sm:text-sm text-[#6B6A65]">
            <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">Distractor Handling Example</h3>
            <p className="mt-2.5 leading-relaxed">
              Suppose a commitment states: <em>&ldquo;NASA will verify the James Webb Space Telescope deployment.&rdquo;</em>
              If someone attempts to resolve it using the Wikipedia page for <em>SpaceX Falcon 9</em>, validators evaluate the source as describing a different subject/action and agree on <code>NOMATCH</code>.
              The transaction reverts with <code>&ldquo;source does not match this commitment&rdquo;</code>, leaving the commitment completely unchanged in its <strong>OPEN</strong> state.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: GUARDRAILS TABLE */}
      <section className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Contract Guardrails</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Deterministic Pre-Conditions & Revert Map
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#6B6A65]">
              Every guardrail is enforced on-chain via <code>gl.vm.UserError</code> and mapped to a specific revert reason.
            </p>
          </div>

          {/* Allowlist domain chips */}
          <div className="mt-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0E0E0D] block mb-3">
              7 Fixed Allowlisted Domains (subdomains allowed):
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {ALLOWED_DOMAINS.map((dom) => (
                <span key={dom} className="rounded-full border border-[#E8E5DF] bg-white px-3.5 py-1 font-mono text-xs text-[#0E0E0D] shadow-sm">
                  {dom}
                </span>
              ))}
            </div>
          </div>

          {/* Guardrails table */}
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[#E8E5DF] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E8E5DF] bg-[#F7F4EF] text-[#6B6A65]">
                <tr>
                  <th className="p-3.5 font-semibold">Guardrail Rule</th>
                  <th className="p-3.5 font-semibold">Requirement</th>
                  <th className="p-3.5 font-semibold">Revert String</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DF]">
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">URL Scheme</td>
                  <td className="p-3.5 text-[#6B6A65]">Must be https:// only</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">source_url scheme must be https</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Domain Allowlist</td>
                  <td className="p-3.5 text-[#6B6A65]">Fixed 7 domains or subdomains</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">source_url domain not in authorized allowlist</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Calendar Deadline</td>
                  <td className="p-3.5 text-[#6B6A65]">Strict YYYY-MM-DD calendar days</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">deadline_hint must be YYYY-MM-DD</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Timing Guard</td>
                  <td className="p-3.5 text-[#6B6A65]">current_date &gt;= deadline_hint</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">cannot resolve before deadline date</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Quote Length & Verbatim</td>
                  <td className="p-3.5 text-[#6B6A65]">&gt;= 12 chars verbatim in first 6,000 chars</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">no grounded quote in source</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Outcome Classification</td>
                  <td className="p-3.5 text-[#6B6A65]">Must be KEPT, BROKEN, or PARTIAL</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">model returned no valid outcome</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Single Resolution</td>
                  <td className="p-3.5 text-[#6B6A65]">Status must be OPEN</td>
                  <td className="p-3.5 font-mono text-[#9E3A26]">commitment already resolved</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 7: OUTCOMES EXPLAINED */}
      <section className="py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Classification</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Outcomes Explained
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/50 p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-emerald-800">★ KEPT</span>
              <h3 className="mt-2 font-serif text-base font-semibold text-emerald-950">Fulfilled</h3>
              <p className="mt-2 text-xs text-emerald-900 leading-relaxed">
                The cited source confirms that the stated subject performed the action on or before deadline. Permanent.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-300/80 bg-rose-50/50 p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-rose-800">★ BROKEN</span>
              <h3 className="mt-2 font-serif text-base font-semibold text-rose-950">Not Fulfilled</h3>
              <p className="mt-2 text-xs text-rose-900 leading-relaxed">
                The cited source confirms that the action was aborted, failed, or missed. Permanent.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/50 p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-amber-800">★ PARTIAL</span>
              <h3 className="mt-2 font-serif text-base font-semibold text-amber-950">Partial Scope</h3>
              <p className="mt-2 text-xs text-amber-900 leading-relaxed">
                Evidence confirms only a portion of compound clauses were completed. Permanent.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-[#F7F4EF] p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-[#0E0E0D]">○ OPEN</span>
              <h3 className="mt-2 font-serif text-base font-semibold text-[#0E0E0D]">Awaiting Evidence</h3>
              <p className="mt-2 text-xs text-[#6B6A65] leading-relaxed">
                Registered and awaiting resolution. All rejected resolution attempts preserve this state.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: EVIDENCE FROM STUDIONET */}
      <section id="evidence" className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">On-Chain Record</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Verified Studionet Evidence
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#6B6A65]">
              Executed on GenLayer Studionet with contract <code className="font-mono text-xs text-[#0E0E0D]">{CONTRACT_ADDRESS}</code>. Full 66-character hashes linked directly to the explorer.
            </p>
          </div>

          {/* Cases Table */}
          <div className="mt-12 overflow-x-auto rounded-2xl border border-[#E8E5DF] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E8E5DF] bg-[#F7F4EF] text-[#6B6A65]">
                <tr>
                  <th className="p-3.5 font-semibold">Case</th>
                  <th className="p-3.5 font-semibold">Commitment ID</th>
                  <th className="p-3.5 font-semibold">Outcome / State</th>
                  <th className="p-3.5 font-semibold">Register Tx</th>
                  <th className="p-3.5 font-semibold">Resolve Tx</th>
                  <th className="p-3.5 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DF]">
                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Case A (Paraphrased)</td>
                  <td className="p-3.5 font-mono">1fe69a47c557</td>
                  <td className="p-3.5"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">KEPT</span></td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0xd61b23...7abd
                    </a>
                  </td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0x54b64f...15c5
                    </a>
                  </td>
                  <td className="p-3.5 text-[#6B6A65]">en.wikipedia.org/wiki/Apollo_11</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Case B (Grounded Quote)</td>
                  <td className="p-3.5 font-mono">605aa94797d3</td>
                  <td className="p-3.5"><span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-800">BROKEN</span></td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0xae2cd4...3823
                    </a>
                  </td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0xf04a89...e943
                    </a>
                  </td>
                  <td className="p-3.5 text-[#6B6A65]">en.wikipedia.org/wiki/Apollo_13</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-medium text-[#0E0E0D]">Case C (Distractor Rejection)</td>
                  <td className="p-3.5 font-mono">4efe7cbd0772</td>
                  <td className="p-3.5"><span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900">REVERT (OPEN)</span></td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0x588c25...aec2
                    </a>
                  </td>
                  <td className="p-3.5">
                    <a
                      href={getExplorerTxUrl("0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#9E3A26] hover:underline"
                    >
                      0x7dda2f...4a59
                    </a>
                  </td>
                  <td className="p-3.5 text-[#6B6A65]">en.wikipedia.org/wiki/Falcon_9</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Negative Rejection Tests */}
          <div className="mt-8 rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
            <h3 className="font-serif text-sm font-semibold text-[#0E0E0D]">
              5 On-Chain Negative Rejection Tests (Decoded from Leader Receipts)
            </h3>
            <div className="mt-4 space-y-2 text-xs">
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
              ].map((test) => (
                <div key={test.hash} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F7F4EF] p-3 border border-[#E8E5DF]">
                  <div>
                    <span className="font-medium text-[#0E0E0D]">{test.label}: </span>
                    <span className="font-mono text-[#9E3A26]">&ldquo;{test.revert}&rdquo;</span>
                  </div>
                  <a
                    href={getExplorerTxUrl(test.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#6B6A65] hover:text-[#0E0E0D] hover:underline"
                  >
                    {test.hash.slice(0, 10)}...{test.hash.slice(-8)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: HONEST SCOPE BOX */}
      <section className="py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-7 sm:p-9 shadow-sm">
            <div className="flex items-start gap-3.5">
              <AlertTriangle size={24} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <h3 className="font-serif text-xl font-bold text-amber-950">
                  Honest Scope: On-Chain vs Unit Test Coverage
                </h3>
                <div className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-amber-950/90 leading-relaxed">
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

      {/* SECTION 10: CONTRACT AND VERIFICATION FACTS */}
      <section className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Contract Verification</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Contract Coordinates & Byte-for-Byte Audit
            </h2>
          </div>

          <div className="mt-12 rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-8 shadow-sm text-xs sm:text-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-3.5">
              <span className="text-[#6B6A65]">Contract Address:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#0E0E0D]">{CONTRACT_ADDRESS}</span>
                <button type="button" onClick={copyContract} className="text-[#6B6A65] hover:text-[#0E0E0D]">
                  {copiedContract ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                </button>
                <a href={getExplorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className="text-[#9E3A26]">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-3.5">
              <span className="text-[#6B6A65]">Deploy Transaction:</span>
              <a href={getExplorerTxUrl(CONTRACT_DEPLOY_TX)} target="_blank" rel="noopener noreferrer" className="font-mono text-[#9E3A26] hover:underline">
                {CONTRACT_DEPLOY_TX}
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-3.5">
              <span className="text-[#6B6A65]">Source Code SHA-256:</span>
              <span className="font-mono font-bold text-[#0E0E0D]">{CONTRACT_SOURCE_SHA256}</span>
            </div>

            <div className="rounded-2xl bg-[#F7F4EF] p-4 text-[#6B6A65] leading-relaxed border border-[#E8E5DF]">
              <strong>Source Verification Method:</strong> The contract source in <code>contracts-reference/CommitmentLedger.py</code> matches the on-chain deployment transaction data byte-for-byte. Verified by querying <code>eth_getTransactionByHash</code>, base64-decoding <code>result.data.contract_code</code>, and asserting SHA-256 equality.
            </div>

            <div className="flex flex-wrap gap-5 pt-2">
              <a href={CONTRACT_REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[#9E3A26] underline font-medium hover:text-[#7A2B1C]">
                Contract GitHub Repository →
              </a>
              <a href={APP_REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[#9E3A26] underline font-medium hover:text-[#7A2B1C]">
                dApp GitHub Repository →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: INTEGRATION SNIPPET */}
      <section id="integration" className="py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Developers</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Integration Code (genlayer-js)
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#6B6A65]">
              This snippet executes directly against the deployed contract address on Studionet.
            </p>
          </div>

          <div className="relative mt-10 rounded-3xl border border-[#0E0E0D] bg-[#0E0E0D] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={copySnippet}
              className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#262624] px-3.5 py-1.5 text-xs text-white hover:bg-[#383835] transition"
            >
              {copiedSnippet ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedSnippet ? "Copied" : "Copy"}</span>
            </button>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-[#FCFAF8]/90 pt-3">
              {integrationSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 12: FAQ */}
      <section className="border-t border-[#E8E5DF] bg-[#F7F4EF]/60 py-24 px-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">Questions & Answers</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl font-normal text-[#0E0E0D] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-14 space-y-5 text-xs sm:text-sm text-[#6B6A65]">
            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                What if the cited source is inaccurate or biased?
              </h3>
              <p className="mt-2 leading-relaxed">
                CommitmentLedger proves that validator consensus agreed the cited allowlisted page contained a verbatim grounded statement regarding the commitment. It does not arbitrate external world truth beyond what the allowlisted source asserts.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                What happens when validators disagree during resolution?
              </h3>
              <p className="mt-2 leading-relaxed">
                If validators cannot achieve quorum (e.g. status <code>UNDETERMINED</code> or <code>MAJORITY_DISAGREE</code>), the transaction fails without mutating contract storage. The commitment remains in its previous state (OPEN), and callers can retry or supply a clearer source URL.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                Why is the deadline mandatory and formatted as YYYY-MM-DD?
              </h3>
              <p className="mt-2 leading-relaxed">
                Vague terms like &ldquo;by Q3&rdquo; enable griefing and premature resolution. A strict calendar date ensures deterministic enforcement via the chain message clock: resolution cannot be front-run before the deadline date.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                Why is the domain allowlist fixed at the contract level?
              </h3>
              <p className="mt-2 leading-relaxed">
                To prevent callers from publishing self-written evidence pages on platforms like GitHub, Pastebin, or personal blogs. The fixed list of 7 public references (Wikipedia, Reuters, AP, BBC, NASA, NOAA, ECB) prevents circular self-certification.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                Can a commitment be resolved twice?
              </h3>
              <p className="mt-2 leading-relaxed">
                No. Once a commitment transitions to <code>RESOLVED</code>, its status and outcome are permanent. Subsequent resolution attempts revert with <code>&ldquo;commitment already resolved&rdquo;</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                Who can resolve a commitment?
              </h3>
              <p className="mt-2 leading-relaxed">
                Any address can submit a resolution once the deadline date has arrived, provided they cite an allowlisted source URL that fulfills the semantic and grounded quote checks.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                Is this financial, legal, or investment advice?
              </h3>
              <p className="mt-2 leading-relaxed">
                No. CommitmentLedger holds no funds, issues no tokens, and is deployed as an experimental intelligent contract on GenLayer Studionet (Preview).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 13: FOOTER */}
      <footer className="border-t border-[#E8E5DF] py-14 px-4 sm:px-8 text-xs text-[#6B6A65]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold italic text-[#0E0E0D]">CommitmentLedger</span>
            <span>·</span>
            <span>GenLayer Studionet (Preview)</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/app" className="hover:text-[#0E0E0D] transition">
              Workbench (/app)
            </Link>
            <a href={CONTRACT_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#0E0E0D] transition">
              Contract Repo
            </a>
            <a href={APP_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#0E0E0D] transition">
              App Repo
            </a>
            <a href={getExplorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className="hover:text-[#0E0E0D] transition">
              Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
