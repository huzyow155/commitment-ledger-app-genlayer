import React, { useState } from "react";
import { Check, Copy, ExternalLink, ShieldCheck, Quote, Clock, User } from "lucide-react";
import type { CommitmentRecord } from "../lib/outcome";

interface CommitmentCardProps {
  commitment: CommitmentRecord;
  onResolveClick?: (id: string) => void;
  showActions?: boolean;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
  commitment,
  onResolveClick,
  showActions = true,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(commitment.commitment_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isResolved = commitment.status === "RESOLVED";
  const outcome = commitment.outcome;

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

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              isResolved
                ? "bg-[#0a0a0a] text-white"
                : "border border-amber-300/80 bg-amber-50 text-amber-900"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isResolved ? "bg-[#17c964]" : "bg-amber-600 animate-pulse"
              }`}
            />
            {commitment.status}
          </span>

          {/* Outcome Stamp */}
          {isResolved && outcome && (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                outcome === "KEPT"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : outcome === "BROKEN"
                  ? "border-rose-300 bg-rose-50 text-rose-800"
                  : outcome === "PARTIAL"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-300 bg-gray-100 text-gray-700"
              }`}
            >
              ★ {outcome}
            </span>
          )}
        </div>
      </div>

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
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6b6b6b] block mb-0.5">Canonical Subject:</span>
            <span className="font-mono text-[#0a0a0a] text-xs">{commitment.subject || "—"}</span>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6b6b6b] block mb-0.5">Canonical Action:</span>
            <span className="font-mono text-[#0a0a0a] text-xs">{commitment.action || "—"}</span>
          </div>
        </div>
      )}

      {/* Verbatim Grounded Quote if Resolved */}
      {commitment.resolution_quote && (
        <div className="my-5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 border-l-4 border-l-[#0a0a0a]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0a0a0a]">
            <Quote size={13} />
            <span>Grounded Verbatim Quote</span>
          </div>
          <p className="mt-2 font-serif text-sm italic text-[#0a0a0a] leading-relaxed">
            &ldquo;{commitment.resolution_quote}&rdquo;
          </p>
          {commitment.source_url && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6b6b6b]">
              <span>Source:</span>
              <a
                href={commitment.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[#0a0a0a] underline hover:opacity-75 truncate max-w-xs sm:max-w-md"
              >
                <span className="truncate">{commitment.source_url}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
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
            <span>Registrant:</span>
            <span className="font-mono text-[#0a0a0a]">
              {commitment.registrant.slice(0, 6)}...{commitment.registrant.slice(-4)}
            </span>
          </span>
        </div>

        {showActions && !isResolved && onResolveClick && (
          <button
            type="button"
            onClick={() => onResolveClick(commitment.commitment_id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <ShieldCheck size={14} />
            <span>Submit Resolution</span>
          </button>
        )}
      </div>
    </article>
  );
};
