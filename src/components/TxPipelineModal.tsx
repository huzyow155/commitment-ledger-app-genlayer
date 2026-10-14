import React, { useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { TxStatusReport } from "../services/contractService";
import { mapRevertReason } from "../lib/revertMap";
import { getExplorerTxUrl } from "../config/chain";
import type { PipelineStage } from "../lib/txLifecycle";

interface TxPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TxStatusReport | null;
  stage: PipelineStage;
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
  const isTerminalSuccess = stage === "complete" || stage === "state_confirmed";
  const isDisagreed = stage === "disagreed" || (stage as string) === "undetermined";
  const isTimedOut = stage === "timed_out";
  const isReverted = stage === "reverted";

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
                  : isTerminalSuccess || stage === "accepted"
                  ? "bg-[#17c964] text-white"
                  : isDisagreed
                  ? "bg-sky-600 text-white"
                  : isReverted
                  ? "bg-amber-600 text-white"
                  : isTimedOut
                  ? "bg-orange-500 text-white"
                  : "bg-black/10 text-[#6b6b6b]"
              }`}
            >
              2
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#0a0a0a] text-sm block">Validator Consensus</span>
              <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">
                {stage === "consensus"
                  ? "Validators executing prompt_comparative evaluation across network nodes..."
                  : stage === "accepted" || isTerminalSuccess
                  ? "Accepted by validators (majority agreement reached)"
                  : isDisagreed
                  ? "Validators disagreed (no majority agreement reached)"
                  : isTimedOut
                  ? "Timed out awaiting consensus"
                  : `Status: ${status?.statusName || "Waiting for consensus"}`}
              </p>
            </div>
          </div>

          {/* Step 3: State Readback Confirmation */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-black/10 bg-[#fbfbfb] p-3.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isTerminalSuccess
                  ? "bg-[#17c964] text-white"
                  : stage === "accepted"
                  ? "animate-pulse bg-[#0a0a0a] text-white"
                  : isReverted
                  ? "bg-amber-600 text-white"
                  : isDisagreed
                  ? "bg-sky-600 text-white"
                  : isTimedOut
                  ? "bg-orange-500 text-white"
                  : "bg-black/10 text-[#6b6b6b]"
              }`}
            >
              3
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#0a0a0a] text-sm block">On-Chain State Confirmation</span>
              <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">
                {isTerminalSuccess
                  ? "State confirmed (storage mutation verified via readback)"
                  : stage === "accepted"
                  ? "Accepted by validators; confirming state readback..."
                  : isReverted
                  ? "Execution reverted (record remains unchanged)"
                  : isDisagreed
                  ? "Validators disagreed (no state change)"
                  : isTimedOut
                  ? "Timed out (state unchanged, safe to retry)"
                  : "Awaiting final state verification"}
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

        {/* State Confirmed Success Panel */}
        {isTerminalSuccess && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle size={14} className="text-emerald-700" />
              <span>State Confirmed</span>
            </div>
            <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
              Transaction accepted by validators and verified on-chain. Storage mutation is confirmed.
            </p>
          </div>
        )}

        {/* Revert / Error Message Panel */}
        {isReverted && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <AlertTriangle size={14} />
              <span>Transaction Reverted</span>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed">
              {revertInfo?.friendlyMessage || status?.decodedRevert || "Transaction reverted during contract execution."}
            </p>
            {status?.decodedRevert && (
              <div className="mt-2 text-[11px] font-mono text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                Decoded Revert: &ldquo;{status.decodedRevert}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Disagreed Message Panel */}
        {isDisagreed && (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/90 p-4 text-xs text-sky-950">
            <div className="flex items-center gap-1.5 font-semibold text-sky-900">
              <AlertCircle size={14} />
              <span>Validators Disagreed (No State Change)</span>
            </div>
            <p className="mt-1 text-xs text-sky-900 leading-relaxed">
              Validators evaluated the contract call but did not achieve majority quorum on the deterministic principle. The on-chain state remains unmodified and safe to retry.
            </p>
          </div>
        )}

        {/* Timed Out Message Panel */}
        {isTimedOut && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/90 p-4 text-xs text-orange-950">
            <div className="flex items-center gap-1.5 font-semibold text-orange-900">
              <Clock size={14} />
              <span>Timed Out (State Unchanged, Safe to Retry)</span>
            </div>
            <p className="mt-1 text-xs text-orange-900 leading-relaxed">
              Transaction polling reached the safety limit without confirmation. The contract state was not modified. You may check the explorer or safely retry.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/10 pt-4">
          {onRetry && (isReverted || isDisagreed || isTimedOut) && (
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
