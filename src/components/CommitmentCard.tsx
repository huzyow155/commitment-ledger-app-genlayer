import React, { useState } from "react";
import { Check, Copy, ExternalLink, ShieldCheck, Quote, Clock, User, ArrowUpRight } from "lucide-react";
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
    <article className="group relative rounded-2xl border border-[#E8E5DF] bg-white p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(20,20,19,0.04)] transition-all duration-300 hover:border-[#D1CDC4] hover:shadow-[0_8px_30px_-8px_rgba(20,20,19,0.08)]">
      {/* Top Header: ID + Status + Outcome Stamps */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E5DF] pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6B6A65]">ID</span>
          <span className="font-mono text-sm font-medium tracking-tight text-[#0E0E0D]">
            {commitment.commitment_id}
          </span>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex items-center rounded-full p-1 text-[#6B6A65] transition hover:bg-[#F7F4EF] hover:text-[#0E0E0D]"
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
                ? "bg-[#0E0E0D] text-white"
                : "border border-amber-300/80 bg-amber-50 text-amber-900"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isResolved ? "bg-emerald-400" : "bg-amber-600 animate-pulse"
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
        <p className="font-serif text-lg leading-relaxed text-[#0E0E0D] sm:text-xl">
          &ldquo;{commitment.raw_text}&rdquo;
        </p>
      </div>

      {/* Canonical Extraction fields */}
      {(commitment.subject || commitment.action) && (
        <div className="my-4 grid grid-cols-1 gap-2.5 rounded-xl border border-[#E8E5DF] bg-[#F7F4EF]/70 p-3.5 text-xs md:grid-cols-2">
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6B6A65] block mb-0.5">Canonical Subject:</span>
            <span className="font-mono text-[#0E0E0D] text-xs">{commitment.subject || "—"}</span>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#6B6A65] block mb-0.5">Canonical Action:</span>
            <span className="font-mono text-[#0E0E0D] text-xs">{commitment.action || "—"}</span>
          </div>
        </div>
      )}

      {/* Verbatim Grounded Quote if Resolved */}
      {commitment.resolution_quote && (
        <div className="my-5 rounded-xl border border-[#E8E5DF] bg-[#FCFAF8] p-4.5 border-l-4 border-l-[#9E3A26]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9E3A26]">
            <Quote size={13} />
            <span>Grounded Verbatim Quote</span>
          </div>
          <p className="mt-2 font-serif text-sm italic text-[#0E0E0D] leading-relaxed">
            &ldquo;{commitment.resolution_quote}&rdquo;
          </p>
          {commitment.source_url && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B6A65]">
              <span>Source:</span>
              <a
                href={commitment.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[#9E3A26] underline hover:text-[#7A2B1C] truncate max-w-xs sm:max-w-md"
              >
                <span className="truncate">{commitment.source_url}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Meta Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E5DF] pt-4 text-xs text-[#6B6A65]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-[#6B6A65]" />
            <span>Deadline:</span>
            <strong className="font-mono text-[#0E0E0D] font-medium">{commitment.deadline_hint}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <User size={13} className="text-[#6B6A65]" />
            <span>Registrant:</span>
            <span className="font-mono text-[#0E0E0D]">
              {commitment.registrant.slice(0, 6)}...{commitment.registrant.slice(-4)}
            </span>
          </span>
        </div>

        {showActions && !isResolved && onResolveClick && (
          <button
            type="button"
            onClick={() => onResolveClick(commitment.commitment_id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#9E3A26] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#7A2B1C] hover:shadow"
          >
            <ShieldCheck size={14} />
            <span>Submit Resolution</span>
          </button>
        )}
      </div>
    </article>
  );
};
