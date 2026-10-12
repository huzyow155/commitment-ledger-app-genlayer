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
  const [showRawDetails, setShowRawDetails] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-pipeline-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E7E3DC] bg-[#FCFAF8] p-6 shadow-xl">
        <h3 id="tx-pipeline-title" className="font-serif text-xl font-semibold text-[#141413]">
          {title}
        </h3>

        {/* Pipeline Stage Indicators */}
        <div className="my-6 space-y-3">
          {/* Step 1: Signing / Submission */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                stage === "signing"
                  ? "animate-pulse bg-[#9E3A26] text-white"
                  : "bg-emerald-700 text-white"
              }`}
            >
              1
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#141413]">Signing & Broadcast</span>
              {status?.txHash && (
                <div className="font-mono text-xs text-[#63625E]">
                  Hash: {status.txHash.slice(0, 10)}…{status.txHash.slice(-8)}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Validator Consensus */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                stage === "consensus"
                  ? "animate-pulse bg-[#9E3A26] text-white"
                  : stage === "complete" || stage === "reverted" || stage === "undetermined"
                  ? "bg-emerald-700 text-white"
                  : "bg-[#E7E3DC] text-[#63625E]"
              }`}
            >
              2
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#141413]">Multi-Validator Consensus</span>
              <p className="text-xs text-[#63625E]">
                {stage === "consensus"
                  ? "Validators running strict_eq execution across nodes (~15–35s)…"
                  : `Status: ${status?.statusName || "Waiting"}`}
              </p>
            </div>
          </div>

          {/* Step 3: Execution Result */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                stage === "complete"
                  ? "bg-emerald-700 text-white"
                  : stage === "reverted"
                  ? "bg-amber-600 text-white"
                  : stage === "undetermined"
                  ? "bg-blue-600 text-white"
                  : "bg-[#E7E3DC] text-[#63625E]"
              }`}
            >
              3
            </div>
            <div className="text-sm">
              <span className="font-medium text-[#141413]">Receipt Evaluation</span>
              <p className="text-xs text-[#63625E]">
                {stage === "complete"
                  ? "Accepted by validators with SUCCESS"
                  : stage === "reverted"
                  ? "Execution reverted (commitment unchanged)"
                  : stage === "undetermined"
                  ? "Validators did not achieve quorum"
                  : "Awaiting leader receipt"}
              </p>
            </div>
          </div>
        </div>

        {/* Tx Hash Banner with Explorer Link */}
        {status?.txHash && (
          <div className="rounded-lg border border-[#E7E3DC] bg-[#F7F4EF] p-3 text-xs">
            <div className="flex items-center justify-between text-[#63625E]">
              <span>Transaction Hash (66 chars):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyTxHash}
                  className="inline-flex items-center gap-1 hover:text-[#141413]"
                >
                  {copiedHash ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  <span>{copiedHash ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={getExplorerTxUrl(status.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#9E3A26] hover:underline"
                >
                  <span>Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="mt-1 break-all font-mono font-medium text-[#141413]">
              {status.txHash}
            </div>
          </div>
        )}

        {/* Revert / Error Message Panel */}
        {stage === "reverted" && revertInfo && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <strong className="font-semibold">{revertInfo.friendlyMessage}</strong>
                {revertInfo.commitmentStaysOpen && (
                  <p className="mt-1 text-amber-800">
                    The commitment stays <strong>OPEN</strong> on-chain. You may retry with a different allowlisted source or adjust your inputs.
                  </p>
                )}
                {/* Disclosure for raw decoded string */}
                <button
                  type="button"
                  onClick={() => setShowRawDetails(!showRawDetails)}
                  className="mt-2 text-xs text-amber-800 underline hover:text-amber-950"
                >
                  {showRawDetails ? "Hide raw revert payload" : "Show raw revert payload"}
                </button>
                {showRawDetails && (
                  <pre className="mt-1 overflow-x-auto rounded bg-amber-100/70 p-2 font-mono text-[11px] text-amber-950">
                    {status?.decodedRevert}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Validator Disagreement Panel */}
        {stage === "undetermined" && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <strong className="font-semibold">Validators did not agree this time.</strong>
                <p className="mt-1 text-blue-900 leading-relaxed">
                  The transaction status returned <code>{status?.statusName}</code>. The commitment is unchanged on-chain and remains in its previous state. Try again or provide a clearer, more direct source URL.
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 font-sans font-medium text-white hover:bg-blue-800"
                  >
                    <RefreshCw size={13} />
                    <span>Try again</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={stage === "signing" || stage === "consensus"}
            className="rounded-lg border border-[#E7E3DC] bg-[#141413] px-4 py-2 font-sans text-xs font-semibold text-white transition hover:bg-[#333] disabled:opacity-40"
          >
            {stage === "complete" ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
