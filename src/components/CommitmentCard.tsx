import React, { useState } from "react";
import { Check, Copy, ExternalLink, ShieldCheck, Quote, Clock, User } from "lucide-react";
import type { CommitmentRecord } from "../lib/outcome";
import { getExplorerAddressUrl, getExplorerTxUrl } from "../config/chain";

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
    <article className="rounded-xl border border-[#E7E3DC] bg-[#F7F4EF]/50 p-5 md:p-6 shadow-sm transition hover:border-[#141413]/30">
      {/* Top Bar: ID + Status + Outcome Stamps */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E3DC] pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#63625E]">ID</span>
          <span className="font-mono text-sm font-semibold text-[#141413]">
            {commitment.commitment_id}
          </span>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex items-center rounded p-1 text-[#63625E] hover:bg-[#E7E3DC] hover:text-[#141413]"
            title="Copy Commitment ID"
          >
            {copiedId ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              isResolved
                ? "bg-[#141413] text-white"
                : "border border-amber-600/40 bg-amber-500/10 text-amber-900"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isResolved ? "bg-emerald-400" : "bg-amber-500 animate-pulse"
              }`}
            />
            {commitment.status}
          </span>

          {/* Outcome Stamp */}
          {isResolved && outcome && (
            <span
              className={`inline-flex items-center rounded border px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${
                outcome === "KEPT"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : outcome === "BROKEN"
                  ? "border-rose-700 bg-rose-50 text-rose-800"
                  : outcome === "PARTIAL"
                  ? "border-amber-700 bg-amber-50 text-amber-800"
                  : "border-gray-500 bg-gray-100 text-gray-700"
              }`}
            >
              ★ {outcome}
            </span>
          )}
        </div>
      </div>

      {/* Raw Commitment Text */}
      <div className="my-4">
        <p className="font-serif text-lg leading-relaxed text-[#141413]">
          &ldquo;{commitment.raw_text}&rdquo;
        </p>
      </div>

      {/* Canonical Extraction fields */}
      {(commitment.subject || commitment.action) && (
        <div className="my-3 grid grid-cols-1 gap-2 rounded-lg border border-[#E7E3DC] bg-white/70 p-3 text-xs md:grid-cols-2">
          <div>
            <span className="font-semibold text-[#63625E]">CANONICAL SUBJECT:</span>{" "}
            <span className="font-mono text-[#141413]">{commitment.subject || "—"}</span>
          </div>
          <div>
            <span className="font-semibold text-[#63625E]">CANONICAL ACTION:</span>{" "}
            <span className="font-mono text-[#141413]">{commitment.action || "—"}</span>
          </div>
        </div>
      )}

      {/* Verbatim Grounded Quote if Resolved */}
      {commitment.resolution_quote && (
        <div className="my-4 rounded-lg border-l-4 border-[#9E3A26] bg-[#FCFAF8] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9E3A26]">
            <Quote size={14} />
            <span>Grounded Verbatim Quote</span>
          </div>
          <p className="mt-1.5 font-serif text-sm italic text-[#141413]">
            &ldquo;{commitment.resolution_quote}&rdquo;
          </p>
          {commitment.source_url && (
            <div className="mt-2 text-xs">
              <span className="text-[#63625E]">Source: </span>
              <a
                href={commitment.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[#9E3A26] underline hover:text-[#7A2B1C]"
              >
                {commitment.source_url}
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Meta Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E3DC] pt-3 text-xs text-[#63625E]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            <span>Deadline:</span>
            <strong className="font-mono text-[#141413]">{commitment.deadline_hint}</strong>
          </span>

          <span className="inline-flex items-center gap-1">
            <User size={13} />
            <span>Registrant:</span>
            <span className="font-mono text-[#141413]">
              {commitment.registrant.slice(0, 6)}…{commitment.registrant.slice(-4)}
            </span>
          </span>
        </div>

        {showActions && !isResolved && onResolveClick && (
          <button
            type="button"
            onClick={() => onResolveClick(commitment.commitment_id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E3A26] px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition hover:bg-[#7A2B1C]"
          >
            <ShieldCheck size={14} />
            <span>Submit Resolution</span>
          </button>
        )}
      </div>
    </article>
  );
};
