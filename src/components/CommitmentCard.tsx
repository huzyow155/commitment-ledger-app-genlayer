import React, { useState, useEffect } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Quote,
  Clock,
  User,
  History,
  CheckCircle,
  XCircle,
  HelpCircle,
  Gavel,
  Fingerprint,
} from "lucide-react";
import type { CommitmentRecord, DecisionRecord } from "../lib/outcome";

interface CommitmentCardProps {
  commitment: CommitmentRecord;
  onResolveClick?: (id: string) => void;
  onChallengeClick?: (id: string) => void;
  onFinalizeClick?: (id: string) => void;
  showActions?: boolean;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
  commitment,
  onResolveClick,
  onChallengeClick,
  onFinalizeClick,
  showActions = true,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFp, setCopiedFp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  const status = commitment.status;
  const isFinal = status === "FINAL" || status === "RESOLVED";
  const isProvisional = status === "PROVISIONAL";
  const isOpen = status === "OPEN";
  const outcome = commitment.outcome;

  // Second interval countdown ticker during provisional window
  useEffect(() => {
    if (!isProvisional) return;
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isProvisional]);

  const copyId = () => {
    navigator.clipboard.writeText(commitment.commitment_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyFingerprint = (fp: string) => {
    navigator.clipboard.writeText(fp);
    setCopiedFp(true);
    setTimeout(() => setCopiedFp(false), 2000);
  };

  const decisions: DecisionRecord[] = commitment.decisions || [];
  const currentIdx = commitment.current_decision_index ?? (decisions.length - 1);
  const effectiveDecision: DecisionRecord | undefined =
    currentIdx >= 0 && currentIdx < decisions.length ? decisions[currentIdx] : decisions[decisions.length - 1];

  const elements = effectiveDecision?.elements || [];

  // 600-second challenge window calculation
  const deadlineSec =
    commitment.challenge_deadline_ts ??
    (effectiveDecision?.decided_at_ts
      ? effectiveDecision.decided_at_ts + 600
      : effectiveDecision?.decided_at
      ? Math.floor(new Date(effectiveDecision.decided_at).getTime() / 1000) + 600
      : null);

  const remainingSec = deadlineSec ? Math.max(0, deadlineSec - nowSec) : 0;
  const isWindowActive = remainingSec > 0;
  const decisionsCount = decisions.length;
  const isBudgetExhausted = decisionsCount >= 3;
  const canFinalize = isProvisional && (!isWindowActive || isBudgetExhausted);

  return (
    <article className="group relative rounded-[24px] border border-black/10 bg-white/96 p-6 sm:p-7 shadow-[0_8px_30px_rgba(10,10,10,0.04)] transition-all duration-300 hover:border-black/20 hover:shadow-[0_14px_40px_rgba(10,10,10,0.08)] text-left">
      {/* Top Header: ID + Status + Outcome Stamps */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">ID</span>
          <span className="font-mono text-sm font-semibold tracking-tight text-[#0a0a0a]">
            {commitment.commitment_id}
          </span>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex items-center rounded-full p-1 text-[#6b6b6b] transition hover:bg-black/5 hover:text-[#0a0a0a]"
            title="Copy Commitment ID"
          >
            {copiedId ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              isFinal
                ? "bg-[#0a0a0a] text-white"
                : isProvisional
                ? "border border-indigo-300 bg-indigo-50 text-indigo-900"
                : "border border-amber-300/80 bg-amber-50 text-amber-900"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFinal ? "bg-[#17c964]" : isProvisional ? "bg-indigo-600 animate-pulse" : "bg-amber-600 animate-pulse"
              }`}
            />
            {status}
          </span>

          {/* Outcome Stamp */}
          {(isFinal || isProvisional) && outcome && (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                outcome === "KEPT"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : outcome === "BROKEN"
                  ? "border-rose-300 bg-rose-50 text-rose-800"
                  : outcome === "PARTIAL"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-purple-300 bg-purple-50 text-purple-800"
              }`}
            >
              ★ {outcome}
            </span>
          )}

          {/* Temporal Classification Badge */}
          {commitment.registration_class && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                commitment.registration_class === "PROSPECTIVE"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-stone-100 text-stone-700 border border-stone-200"
              }`}
              title={
                commitment.registration_class === "PROSPECTIVE"
                  ? "Registered prospectively before deadline (Accountability Track)"
                  : "Historical analysis record (Past deadline with explicit acknowledgment)"
              }
            >
              {commitment.registration_class === "PROSPECTIVE" ? "Prospective" : "Historical"}
            </span>
          )}

          {/* Claim Kind Notice */}
          <span
            className="inline-flex items-center rounded-full border border-black/10 bg-[#f7f7f7] px-2.5 py-0.5 text-[10px] font-mono text-[#6b6b6b]"
            title={
              commitment.claim_kind === "SELF_DECLARED"
                ? "Self-declared statement by claimant. Signer identity is unverified on-chain."
                : "Third-party report from public source."
            }
          >
            {commitment.claim_kind === "SELF_DECLARED" ? "Self-Declared" : "Third-Party"} (Unverified)
          </span>
        </div>
      </div>

      {/* Provisional 600-Second Challenge Window Banner */}
      {isProvisional && (
        <div
          className={`my-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border p-3.5 text-xs ${
            isWindowActive
              ? "border-amber-300 bg-amber-50/90 text-amber-950"
              : "border-emerald-300 bg-emerald-50/90 text-emerald-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock
              size={14}
              className={isWindowActive ? "text-amber-700 animate-pulse" : "text-emerald-700"}
            />
            <span className="font-semibold">
              {isWindowActive ? "600s Challenge Window Active:" : "Challenge Window Elapsed:"}
            </span>
            {isWindowActive ? (
              <span className="font-mono font-bold">
                {Math.floor(remainingSec / 60)}m {String(remainingSec % 60).padStart(2, "0")}s remaining
              </span>
            ) : (
              <span className="font-medium text-emerald-800">
                Window closed (eligible to finalize)
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-[#6b6b6b]">
            Decision Round {decisionsCount}/3 {isBudgetExhausted ? "(Cap reached)" : ""}
          </div>
        </div>
      )}

      {/* Raw Commitment Text */}
      <div className="my-5">
        <p className="font-serif text-lg leading-relaxed text-[#0a0a0a] sm:text-xl">
          &ldquo;{commitment.raw_text}&rdquo;
        </p>
      </div>

      {/* Canonical Extraction fields */}
      {(commitment.subject || commitment.action) && (
        <div className="my-4 grid grid-cols-1 gap-2.5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-3.5 text-xs md:grid-cols-2">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6b6b6b] block mb-0.5">
              Canonical Subject:
            </span>
            <span className="font-mono text-[#0a0a0a] text-xs">{commitment.subject || "—"}</span>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6b6b6b] block mb-0.5">
              Canonical Action:
            </span>
            <span className="font-mono text-[#0a0a0a] text-xs">{commitment.action || "—"}</span>
          </div>
        </div>
      )}

      {/* Element-by-Element Adjudication Breakdown */}
      {elements.length > 0 && (
        <div className="my-4 rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-xs">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#0a0a0a]">
              Adjudicated Statement Elements ({elements.length})
            </span>
            {effectiveDecision?.coverage && (
              <span className="font-mono text-[10px] text-[#6b6b6b]">
                Coverage: {effectiveDecision.coverage} ({effectiveDecision.source_chars_inspected || 0} chars inspected)
              </span>
            )}
          </div>
          <div className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white">
            {elements.map((el) => {
              const statusUpper = String(el.status).toUpperCase();
              const citedPassages = effectiveDecision?.passages?.filter((p) =>
                el.passage_ids?.includes(p.id)
              );
              return (
                <div key={el.id} className="p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-semibold uppercase text-[#6b6b6b] bg-black/5 px-1.5 py-0.5 rounded">
                        {el.kind}
                      </span>
                      <span className="text-[#0a0a0a] font-medium truncate">{el.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          statusUpper === "SATISFIED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : statusUpper === "NOT_SATISFIED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {statusUpper === "SATISFIED" ? (
                          <CheckCircle size={10} />
                        ) : statusUpper === "NOT_SATISFIED" ? (
                          <XCircle size={10} />
                        ) : (
                          <HelpCircle size={10} />
                        )}
                        {statusUpper}
                      </span>
                      {(el.passage_ids || el.cited_segment_ids) && (
                        <span className="font-mono text-[10px] text-[#6b6b6b]" title="Cited segment IDs">
                          [{((el.passage_ids || el.cited_segment_ids) as number[]).join(", ")}]
                        </span>
                      )}
                    </div>
                  </div>
                  {citedPassages && citedPassages.length > 0 && (
                    <div className="pl-2 border-l-2 border-black/10 text-[11px] text-[#6b6b6b] italic font-serif">
                      &ldquo;{citedPassages.map((p) => p.text).join(" ")}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grounded Quote & Evidence Source */}
      {(commitment.resolution_quote || effectiveDecision?.passages?.[0]?.text) && (
        <div className="my-5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 border-l-4 border-l-[#0a0a0a]">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#0a0a0a]">
            <span className="flex items-center gap-1.5">
              <Quote size={13} />
              <span>Grounded Evidence Quote</span>
            </span>
          </div>
          <p className="mt-2 font-serif text-sm italic text-[#0a0a0a] leading-relaxed">
            &ldquo;{commitment.resolution_quote || effectiveDecision?.passages?.[0]?.text}&rdquo;
          </p>

          {/* SHA-256 Fingerprint Display */}
          {effectiveDecision?.evidence_sha256 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Fingerprint size={13} className="text-[#0a0a0a] shrink-0" />
                <span className="font-semibold text-[#0a0a0a]">SHA-256 Fingerprint:</span>
                <span
                  className="font-mono text-[#0a0a0a]"
                  title="SHA-256 fingerprint computed across source URL and retrieved page content at adjudication time."
                >
                  {effectiveDecision.evidence_sha256.slice(0, 12)}...{effectiveDecision.evidence_sha256.slice(-8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#6b6b6b] hidden sm:inline">
                  (covers URL + content at adjudication)
                </span>
                <button
                  type="button"
                  onClick={() => copyFingerprint(effectiveDecision.evidence_sha256!)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-[#6b6b6b] hover:text-[#0a0a0a] transition"
                  title="Copy full 64-hex SHA-256 fingerprint"
                >
                  {copiedFp ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                  <span>{copiedFp ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}

          {(commitment.source_url || effectiveDecision?.source_url) && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6b6b6b]">
              <span>Source:</span>
              <a
                href={commitment.source_url || effectiveDecision?.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[#0a0a0a] underline hover:opacity-75 truncate max-w-xs sm:max-w-md"
              >
                <span className="truncate">{commitment.source_url || effectiveDecision?.source_url}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Decision History Toggle if Multiple Decisions */}
      {decisions.length > 1 && (
        <div className="my-3">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition"
          >
            <History size={13} />
            <span>{showHistory ? "Hide" : "View"} Decision History ({decisions.length} rounds)</span>
          </button>
          {showHistory && (
            <div className="mt-2.5 rounded-xl border border-black/10 bg-[#fafafa] p-3 text-xs divide-y divide-black/5">
              {decisions.map((d) => {
                const revResult = d.review_result?.toUpperCase();
                return (
                  <div key={d.n} className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#0a0a0a] bg-black/5 px-1.5 py-0.5 rounded">
                        Round #{d.n}
                      </span>
                      <span className="text-[11px] font-medium text-[#0a0a0a]">
                        {d.kind === "INITIAL" ? "Initial Adjudication" : "Challenge Review"}
                      </span>
                      {d.challenge_reason && (
                        <span className="font-mono text-[10px] text-[#6b6b6b]">
                          ({d.challenge_reason})
                        </span>
                      )}
                      {revResult && (
                        <span
                          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            revResult === "UPHELD"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : revResult === "REVISED"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : revResult === "WITHDRAWN"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {revResult}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-[#0a0a0a]">
                        {d.outcome || "WITHDRAWN"}
                      </span>
                      <span className="font-mono text-[10px] text-[#6b6b6b]">
                        {d.decided_at ? d.decided_at.slice(0, 10) : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Meta Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-[#6b6b6b]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-[#6b6b6b]" />
            <span>Deadline:</span>
            <strong className="font-mono text-[#0a0a0a] font-medium">{commitment.deadline_hint}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <User size={13} className="text-[#6b6b6b]" />
            <span>Registrant (wallet address, identity not verified):</span>
            <span className="font-mono text-[#0a0a0a]" title={commitment.registrant}>
              {commitment.registrant ? `${commitment.registrant.slice(0, 6)}...${commitment.registrant.slice(-4)}` : "—"}
            </span>
          </span>

          {(commitment.resolver || effectiveDecision?.resolver) && (
            <span className="inline-flex items-center gap-1.5">
              <span>Resolver (wallet address, identity not verified):</span>
              <span className="font-mono text-[#0a0a0a]" title={commitment.resolver || effectiveDecision?.resolver}>
                {(commitment.resolver || effectiveDecision?.resolver)?.slice(0, 6)}...
                {(commitment.resolver || effectiveDecision?.resolver)?.slice(-4)}
              </span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        {showActions && (
          <div className="flex flex-wrap items-center gap-2">
            {isOpen && onResolveClick && (
              <button
                type="button"
                onClick={() => onResolveClick(commitment.commitment_id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Submit Resolution</span>
              </button>
            )}

            {isProvisional && (
              <>
                {onChallengeClick && (
                  <button
                    type="button"
                    onClick={() => onChallengeClick(commitment.commitment_id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0a0a0a] shadow-sm transition hover:bg-black/5 cursor-pointer"
                  >
                    <Gavel size={13} />
                    <span>Challenge</span>
                  </button>
                )}
                {onFinalizeClick && (
                  <button
                    type="button"
                    disabled={!canFinalize}
                    onClick={() => canFinalize && onFinalizeClick(commitment.commitment_id)}
                    title={
                      !canFinalize
                        ? `Finalize locked: 600-second challenge window active (${remainingSec}s remaining). Requires window expiration or 3 adjudication rounds.`
                        : isBudgetExhausted
                        ? "Eligible to finalize: maximum 3 adjudication rounds reached."
                        : "Eligible to finalize: 600-second challenge window has elapsed."
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                      canFinalize
                        ? "bg-[#0a0a0a] text-white hover:opacity-90 cursor-pointer"
                        : "bg-black/10 text-[#6b6b6b] border border-black/10 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <CheckCircle size={13} />
                    <span>Finalize</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
