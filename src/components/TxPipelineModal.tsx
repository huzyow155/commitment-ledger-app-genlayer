import React, { useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, AlertCircle, AlertTriangle } from "lucide-react";
import type { TxStatusReport } from "../services/contractService";
import { mapRevertReason } from "../lib/revertMap";
import { getExplorerTxUrl } from "../config/chain";

interface TxPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TxStatusReport | null;
  stage: "signing" | "submitting" | "consensus" | "complete" | "reverted" | "undetermined";
  title?: string;
  onRetry?: () => void;
}

export const TxPipelineModal: React.FC<TxPipelineModalProps> = ({
  isOpen,
  onClose,
  status,
  stage,
  title = "Consensus Transaction",
  onRetry,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  const copyTxHash = () => {
    if (status?.txHash) {
      navigator.clipboard.writeText(status.txHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const revertInfo = status?.decodedRevert ? mapRevertReason(status.decodedRevert) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm transition-opacity text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-pipeline-title"
    >
      <div className="w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-7 shadow-2xl transition-all">
        <div className="flex items-start justify-between">
          <div>
            <span className="ticker-item inline-block mb-1.5">Studionet Consensus Pipeline</span>
            <h3 id="tx-pipeline-title" className="font-serif text-2xl font-semibold text-[#0a0a0a]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-black/5 hover:text-[#0a0a0a]"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="my-6 space-y-3">
          {/* Step 1: Signing / Submission */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-3.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                stage === "signing"
                  ? "animate-pulse bg-[#0a0a0a] text-white"
                  : "bg-[#17c964] text-white"
              }`}
            >
              1
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#0a0a0a] text-sm block">Signing & Broadcast</span>
              {status?.txHash ? (
                <div className="font-mono text-[11px] text-[#6b6b6b] mt-0.5">
                  Hash: {status.txHash.slice(0, 10)}...{status.txHash.slice(-8)}
                </div>
              ) : (
                <span className="text-[#6b6b6b] text-xs">Preparing throwaway signature on client</span>
              )}
            </div>
          </div>

          {/* Step 2: Validator Consensus */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-3.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                stage === "consensus"
                  ? "animate-pulse bg-[#0a0a0a] text-white"
                  : stage === "complete" || stage === "reverted" || stage === "undetermined"
                  ? "bg-[#17c964] text-white"
                  : "bg-black/10 text-[#6b6b6b]"
              }`}
            >
              2
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#0a0a0a] text-sm block">Multi-Validator Consensus</span>
              <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">
                {stage === "consensus"
                  ? "Validators executing strict_eq evaluation across network nodes (15–35s)..."
                  : `Status: ${status?.statusName || "Waiting for consensus"}`}
              </p>
            </div>
          </div>

          {/* Step 3: Execution Result */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-3.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                stage === "complete"
                  ? "bg-[#17c964] text-white"
                  : stage === "reverted"
                  ? "bg-amber-600 text-white"
                  : stage === "undetermined"
                  ? "bg-sky-600 text-white"
                  : "bg-black/10 text-[#6b6b6b]"
              }`}
            >
              3
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#0a0a0a] text-sm block">Receipt Evaluation</span>
              <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">
                {stage === "complete"
                  ? "Accepted by validators with SUCCESS"
                  : stage === "reverted"
                  ? "Execution reverted (record remains unchanged)"
                  : stage === "undetermined"
                  ? "Validators did not achieve quorum (UNDETERMINED)"
                  : "Awaiting leader receipt and proof confirmation"}
              </p>
            </div>
          </div>
        </div>

        {/* Tx Hash Banner with Explorer Link */}
        {status?.txHash && (
          <div className="rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 text-xs">
            <div className="flex items-center justify-between text-[#6b6b6b]">
              <span className="font-medium text-[11px] uppercase tracking-wider">Transaction Hash (66 chars)</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={copyTxHash}
                  className="inline-flex items-center gap-1 hover:text-[#0a0a0a] transition"
                >
                  {copiedHash ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  <span>{copiedHash ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={getExplorerTxUrl(status.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0a0a0a] underline"
                >
                  <span>Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="mt-1.5 break-all font-mono font-medium text-[#0a0a0a] text-[11px] leading-relaxed">
              {status.txHash}
            </div>
          </div>
        )}

        {/* Revert / Error Message Panel */}
        {stage === "reverted" && revertInfo && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <AlertTriangle size={14} />
              <span>Contract Reverted</span>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed">
              {revertInfo.friendlyMessage}
            </p>
            <div className="mt-2 text-[11px] font-mono text-amber-800 bg-amber-100/60 p-2 rounded-lg">
              Revert String: &ldquo;{status?.decodedRevert}&rdquo;
            </div>
          </div>
        )}

        {/* Undetermined Message Panel */}
        {stage === "undetermined" && (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/90 p-4 text-xs text-sky-950">
            <div className="flex items-center gap-1.5 font-semibold text-sky-900">
              <AlertCircle size={14} />
              <span>Consensus Undetermined</span>
            </div>
            <p className="mt-1 text-xs text-sky-900 leading-relaxed">
              Validators evaluated the contract call but did not reach majority quorum on the deterministic output. The state remains unmodified. You may retry.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/10 pt-4">
          {onRetry && (stage === "reverted" || stage === "undetermined") && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-5 py-2 text-xs font-semibold text-[#0a0a0a] hover:bg-black/5 transition"
            >
              <RefreshCw size={13} />
              <span>Retry Execution</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-6 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
